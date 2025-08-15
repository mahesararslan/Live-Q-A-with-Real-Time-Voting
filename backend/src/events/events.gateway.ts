import { SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServerToClientEvents, RoomParticipant } from './types/events';
import { Question } from 'src/entities/question.entity';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt/ws-jwt.guard';
import { SocketAuthMiddleware } from 'src/auth/guards/ws-jwt/ws.mw';
import { UserService } from 'src/user/user.service';
import { QuestionService } from 'src/question/question.service';
import { RoomService } from 'src/room/room.service';
import { VoteService } from 'src/vote/vote.service';
import { RedisService, PubSubMessage } from '../redis/redis.service';

interface InternalRoomParticipant {
  socketId: string;
  userId: number;
  user: RoomParticipant;
  joinedAt: Date;
}

@WebSocketGateway({ 
  namespace: '/events',
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  }
})
@UseGuards(WsJwtGuard)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(EventsGateway.name);
  private roomParticipants = new Map<string, Set<InternalRoomParticipant>>();

  @WebSocketServer()
  server: Server<any, ServerToClientEvents>;

  constructor(
    private readonly userService: UserService,
    private readonly questionService: QuestionService,
    private readonly roomService: RoomService,
    private readonly voteService: VoteService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    // Set up Redis message handlers
    this.setupRedisHandlers();
    this.logger.log(`Events Gateway initialized with Redis Pub/Sub on server ${this.redisService.getServerId()}`);
  }

  private setupRedisHandlers() {
    // Handle messages from other server instances
    this.redisService.onMessage('newMessage', (message: PubSubMessage) => {
      this.logger.log(`Broadcasting newMessage from Redis for room ${message.roomCode}`);
      this.server.to(`room-${message.roomCode}`).emit('newMessage', message.data);
    });

    this.redisService.onMessage('voteUpdated', (message: PubSubMessage) => {
      this.logger.log(`Broadcasting voteUpdated from Redis for room ${message.roomCode}`);
      this.server.to(`room-${message.roomCode}`).emit('voteUpdated', message.data);
    });

    this.redisService.onMessage('questionAnswered', (message: PubSubMessage) => {
      this.logger.log(`Broadcasting questionAnswered from Redis for room ${message.roomCode}`);
      this.server.to(`room-${message.roomCode}`).emit('questionAnswered', message.data);
    });

    this.redisService.onMessage('userJoined', (message: PubSubMessage) => {
      this.logger.log(`Broadcasting userJoined from Redis for room ${message.roomCode}`);
      this.server.to(`room-${message.roomCode}`).emit('userJoined', message.data);
    });

    this.redisService.onMessage('userLeft', (message: PubSubMessage) => {
      this.logger.log(`Broadcasting userLeft from Redis for room ${message.roomCode}`);
      this.server.to(`room-${message.roomCode}`).emit('userLeft', message.data);
    });

    this.redisService.onMessage('sessionEnded', (message: PubSubMessage) => {
      this.logger.log(`Broadcasting sessionEnded from Redis for room ${message.roomCode}`);
      this.server.to(`room-${message.roomCode}`).emit('sessionEnded', message.data);
      // Clean up local participants
      this.roomParticipants.delete(`room-${message.roomCode}`);
    });
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove user from all rooms they were in
    await this.removeUserFromAllRooms(client.id);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; userId: number }
  ) {
    try {
      this.logger.log(`User ${payload.userId} attempting to join room ${payload.roomCode}`);

      // Validate room exists and is active
      const room = await this.roomService.findByCodeWithParticipants(payload.roomCode);
      if (!room || !room.isActive || room.isEnded) {
        client.emit('joinRoomError', { message: 'Room not found or inactive' });
        return;
      }

      // Get user details
      const user = await this.userService.findOne(payload.userId);
      if (!user) {
        client.emit('joinRoomError', { message: 'User not found' });
        return;
      }

      const roomId = `room-${payload.roomCode}`;
      
      // Join the socket room
      await client.join(roomId);

      // Add user to participants tracking
      if (!this.roomParticipants.has(roomId)) {
        this.roomParticipants.set(roomId, new Set());
      }

      const participants = this.roomParticipants.get(roomId);
      
      // Remove any existing entries for this user (in case of reconnection)
      participants.forEach(participant => {
        if (participant.userId === payload.userId) {
          participants.delete(participant);
        }
      });

      // Add current user
      const newParticipant: InternalRoomParticipant = {
        socketId: client.id,
        userId: payload.userId,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        },
        joinedAt: new Date(),
      };

      participants.add(newParticipant);

      // Add to Redis for cross-server participant tracking
      await this.redisService.addParticipantToRoom(payload.roomCode, newParticipant.user);
      
      // Get total participants across all servers
      const totalParticipantCount = await this.redisService.getRoomParticipantCount(payload.roomCode);
      const allParticipants = await this.redisService.getRoomParticipants(payload.roomCode);

      const joinData = {
        user: newParticipant.user,
        participantCount: totalParticipantCount,
        participants: allParticipants,
      };

      // Emit to local server first
      this.server.to(roomId).emit('userJoined', joinData);
      
      // Publish to Redis for other servers
      await this.redisService.publishToRoom(payload.roomCode, 'userJoined', joinData);

      // Send success response to the joining user
      client.emit('joinRoomSuccess', {
        roomId: payload.roomCode,
        participantCount: totalParticipantCount,
        participants: allParticipants,
      });

      this.logger.log(`User ${payload.userId} successfully joined room ${payload.roomCode}`);

    } catch (error) {
      this.logger.error('Join room error:', error);
      client.emit('joinRoomError', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; userId: number }
  ) {
    const roomId = `room-${payload.roomCode}`;
    await client.leave(roomId);
    await this.removeUserFromRoom(roomId, client.id, payload.userId, payload.roomCode);
    
    client.emit('leaveRoomSuccess', { roomId: payload.roomCode });
    this.logger.log(`User ${payload.userId} left room ${payload.roomCode}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string; roomCode: string; userId: number }
  ) {
    try {
      this.logger.log('Received message:', payload);

      // Validate room exists
      const room = await this.roomService.findByCode(payload.roomCode);
      if (!room) {
        client.emit('messageError', { error: 'Room not found' });
        return;
      }

      // Create the question in the database
      const newQuestion = await this.questionService.create({
        content: payload.content,
        roomId: room.id,
        userId: payload.userId,
      });

      this.logger.log('Created question:', newQuestion);

      const roomId = `room-${payload.roomCode}`;
      
      // Emit to local server first
      this.server.to(roomId).emit('newMessage', newQuestion);
      
      // Publish to Redis for other servers
      await this.redisService.publishToRoom(payload.roomCode, 'newMessage', newQuestion);
      
      this.logger.log(`Emitted newMessage to ${roomId} and Redis:`, newQuestion.id);
      
    } catch (error) {
      this.logger.error('Error handling message:', error);
      client.emit('messageError', { 
        error: 'Failed to create question',
        details: error.message 
      });
    }
  }

  @SubscribeMessage('vote')
  async handleVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { questionId: number; roomCode: string; userId: number }
  ) {
    try {
      this.logger.log(`Processing vote for question ${payload.questionId} from user ${payload.userId} in room ${payload.roomCode}`);
      
      // Toggle the vote in the database
      const voteResult = await this.voteService.toggleVote(payload.questionId, payload.userId);
      
      // Get updated vote count
      const voteCount = await this.voteService.getQuestionVoteCount(payload.questionId);
      
      // Check if user has voted after the toggle
      const hasVoted = await this.voteService.hasUserVoted(payload.questionId, payload.userId);
      
      const roomId = `room-${payload.roomCode}`;
      
      const voteData = {
        questionId: payload.questionId,
        userId: payload.userId,
        voteCount,
        hasVoted,
        action: voteResult.action // 'added' or 'removed'
      };

      // Emit to local server first
      this.server.to(roomId).emit('voteUpdated', voteData);
      
      // Publish to Redis for other servers
      await this.redisService.publishToRoom(payload.roomCode, 'voteUpdated', voteData);
      
      this.logger.log(`Vote ${voteResult.action} for question ${payload.questionId}. New count: ${voteCount}`);
      
    } catch (error) {
      this.logger.error('Error handling vote:', error);
      client.emit('voteError', { 
        error: 'Failed to process vote',
        details: error.message 
      });
    }
  }

  @SubscribeMessage('markAsAnswered')
  async handleMarkAsAnswered(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { questionId: number; roomCode: string; userId: number }
  ) {
    try {
      this.logger.log(`Admin ${payload.userId} marking question ${payload.questionId} as answered in room ${payload.roomCode}`);
      
      // Verify the user is the room admin
      const room = await this.roomService.findByCode(payload.roomCode);
      if (!room || room.admin.id !== payload.userId) {
        client.emit('markAsAnsweredError', { 
          error: 'Unauthorized: Only room admin can mark questions as answered',
          details: 'You must be the room creator to mark questions as answered'
        });
        return;
      }

      // Mark the question as answered
      const updatedQuestion = await this.questionService.markAsAnswered(payload.questionId);
      
      const roomId = `room-${payload.roomCode}`;
      
      const answerData = {
        questionId: updatedQuestion.id,
        isAnswered: updatedQuestion.isAnswered,
        question: updatedQuestion
      };

      // Emit to local server first
      this.server.to(roomId).emit('questionAnswered', answerData);
      
      // Publish to Redis for other servers
      await this.redisService.publishToRoom(payload.roomCode, 'questionAnswered', answerData);
      
      this.logger.log(`Question ${payload.questionId} marked as answered in room ${payload.roomCode}`);
      
    } catch (error) {
      this.logger.error('Error marking question as answered:', error);
      client.emit('markAsAnsweredError', { 
        error: 'Failed to mark question as answered',
        details: error.message 
      });
    }
  }

  @SubscribeMessage('endSession')
  async handleEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; userId: number }
  ) {
    try {
      this.logger.log(`Admin ${payload.userId} ending session for room ${payload.roomCode}`);
      
      // Verify the user is the room admin
      const room = await this.roomService.findByCode(payload.roomCode);
      if (!room || room.admin.id !== payload.userId) {
        client.emit('sessionEndError', { 
          error: 'Unauthorized: Only room admin can end session',
          details: 'You must be the room creator to end the session'
        });
        return;
      }

      const user = await this.userService.findOne(payload.userId);
      if (!user) {
        client.emit('sessionEndError', { error: 'User not found' });
        return;
      }

      const roomId = `room-${payload.roomCode}`;
      
      const sessionData = {
        roomCode: payload.roomCode,
        endedBy: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl
        },
        message: `Session ended by ${user.firstName} ${user.lastName}`
      };

      // Emit to local server first
      this.server.to(roomId).emit('sessionEnded', sessionData);
      
      // Publish to Redis for other servers
      await this.redisService.publishToRoom(payload.roomCode, 'sessionEnded', sessionData);

      // Remove all participants from local tracking
      this.roomParticipants.delete(roomId);
      
      // Clean up Redis room data
      await this.redisService.deleteRoom(payload.roomCode);
      
      // Delete room and all questions from database
      try {
        await this.roomService.deleteRoomAndQuestions(payload.roomCode);
        this.logger.log(`Successfully deleted room ${payload.roomCode} and all its questions from database`);
      } catch (deleteError) {
        this.logger.error('Error deleting room from database:', deleteError);
        // Continue with session end even if database deletion fails
      }
      
      this.logger.log(`Session ended for room ${payload.roomCode} by admin ${payload.userId}`);
      
    } catch (error) {
      this.logger.error('Error ending session:', error);
      client.emit('sessionEndError', { 
        error: 'Failed to end session',
        details: error.message 
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleUserLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; userId: number }
  ) {
    try {
      this.logger.log(`User ${payload.userId} leaving room ${payload.roomCode}`);
      
      const user = await this.userService.findOne(payload.userId);
      if (!user) {
        this.logger.error('User not found when leaving room');
        return;
      }

      const roomId = `room-${payload.roomCode}`;
      
      // Remove user from socket room
      client.leave(roomId);
      
      // Remove user from participants tracking
      await this.removeUserFromRoom(roomId, client.id, payload.userId, payload.roomCode);
      
      this.logger.log(`User ${payload.userId} left room ${payload.roomCode}`);
      
    } catch (error) {
      this.logger.error('Error handling user leave:', error);
    }
  }

  private async removeUserFromRoom(roomId: string, socketId: string, userId?: number, roomCode?: string) {
    const participants = this.roomParticipants.get(roomId);
    if (!participants) return;

    let removedUser = null;
    participants.forEach(participant => {
      if (participant.socketId === socketId || (userId && participant.userId === userId)) {
        removedUser = participant.user;
        participants.delete(participant);
      }
    });

    if (removedUser && roomCode) {
      // Remove from Redis
      await this.redisService.removeParticipantFromRoom(roomCode, removedUser.id.toString());
      
      // Get updated participant count from Redis
      const totalParticipantCount = await this.redisService.getRoomParticipantCount(roomCode);
      const allParticipants = await this.redisService.getRoomParticipants(roomCode);

      const leaveData = {
        user: removedUser,
        participantCount: totalParticipantCount,
        participants: allParticipants,
      };

      // Emit to local server first
      this.server.to(roomId).emit('userLeft', leaveData);
      
      // Publish to Redis for other servers
      await this.redisService.publishToRoom(roomCode, 'userLeft', leaveData);

      // Remove from database participants
      try {
        await this.roomService.removeParticipant(roomCode, removedUser.id);
        this.logger.log(`User ${removedUser.id} removed from database participants for room ${roomCode}`);
      } catch (dbError) {
        this.logger.error('Error removing user from database participants:', dbError);
      }
    }

    // Clean up empty room
    if (participants.size === 0) {
      this.roomParticipants.delete(roomId);
    }
  }

  private async removeUserFromAllRooms(socketId: string) {
    const roomsToCleanup: { roomCode: string; userId: number }[] = [];
    
    // First, collect room info and remove from in-memory tracking
    this.roomParticipants.forEach((participants, roomId) => {
      participants.forEach(participant => {
        if (participant.socketId === socketId) {
          const roomCode = roomId.replace('room-', '');
          roomsToCleanup.push({ roomCode, userId: participant.userId });
        }
      });
    });
    
    // Then, clean up each room
    for (const { roomCode, userId } of roomsToCleanup) {
      await this.removeUserFromRoom(`room-${roomCode}`, socketId, userId, roomCode);
    }
  }

  async sendMessage(question: Question, roomCode?: string) {
    const user = await this.userService.findOne(question.userId);
    const fullQuestion = {
      ...question,
      user: user
    }
    console.log('Sending question:', fullQuestion);
    
    if (roomCode) {
      // Send to specific room
      const roomId = `room-${roomCode}`;
      this.server.to(roomId).emit('newMessage', fullQuestion);
    } else {
      // Send to all (fallback)
      this.server.emit('newMessage', fullQuestion);
    }
  }

  // Helper methods for other services (now using Redis)
  async getRoomParticipants(roomCode: string) {
    return await this.redisService.getRoomParticipants(roomCode);
  }

  async getRoomParticipantCount(roomCode: string): Promise<number> {
    return await this.redisService.getRoomParticipantCount(roomCode);
  }

  // Health check method
  async isRedisHealthy(): Promise<boolean> {
    return await this.redisService.isHealthy();
  }

  // Get server ID for debugging
  getServerId(): string {
    return this.redisService.getServerId();
  }
}
