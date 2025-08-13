import { SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);
  private roomParticipants = new Map<string, Set<InternalRoomParticipant>>();

  @WebSocketServer()
  server: Server<any, ServerToClientEvents>;

  constructor(
    private readonly userService: UserService,
    private readonly questionService: QuestionService,
    private readonly roomService: RoomService,
    private readonly voteService: VoteService,
  ) {}

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleware() as any);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove user from all rooms they were in
    this.removeUserFromAllRooms(client.id);
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

      // Notify all participants about new user
      this.server.to(roomId).emit('userJoined', {
        user: newParticipant.user,
        participantCount: participants.size,
        participants: Array.from(participants).map(p => p.user),
      });

      // Send success response to the joining user
      client.emit('joinRoomSuccess', {
        roomId: payload.roomCode,
        participantCount: participants.size,
        participants: Array.from(participants).map(p => p.user),
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
    this.removeUserFromRoom(roomId, client.id, payload.userId);
    
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
      
      // Emit the complete question object to all clients in the room
      this.server.to(roomId).emit('newMessage', newQuestion);
      
      this.logger.log(`Emitted newMessage to ${roomId}:`, newQuestion.id);
      
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
      
      // Emit vote update to all clients in the room
      this.server.to(roomId).emit('voteUpdated', {
        questionId: payload.questionId,
        userId: payload.userId,
        voteCount,
        hasVoted,
        action: voteResult.action // 'added' or 'removed'
      });
      
      this.logger.log(`Vote ${voteResult.action} for question ${payload.questionId}. New count: ${voteCount}`);
      
    } catch (error) {
      this.logger.error('Error handling vote:', error);
      client.emit('voteError', { 
        error: 'Failed to process vote',
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
      
      // Notify all participants that the session has ended
      this.server.to(roomId).emit('sessionEnded', {
        roomCode: payload.roomCode,
        endedBy: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl
        },
        message: `Session ended by ${user.firstName} ${user.lastName}`
      });

      // Remove all participants from the room
      this.roomParticipants.delete(roomId);
      
      // TODO: Optionally mark room as ended in database
      
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
      this.removeUserFromRoom(roomId, client.id, payload.userId);
      
      this.logger.log(`User ${payload.userId} left room ${payload.roomCode}`);
      
    } catch (error) {
      this.logger.error('Error handling user leave:', error);
    }
  }

  private removeUserFromRoom(roomId: string, socketId: string, userId?: number) {
    const participants = this.roomParticipants.get(roomId);
    if (!participants) return;

    let removedUser = null;
    participants.forEach(participant => {
      if (participant.socketId === socketId || (userId && participant.userId === userId)) {
        removedUser = participant.user;
        participants.delete(participant);
      }
    });

    if (removedUser) {
      // Notify remaining participants
      this.server.to(roomId).emit('userLeft', {
        user: removedUser,
        participantCount: participants.size,
        participants: Array.from(participants).map(p => p.user),
      });
    }

    // Clean up empty room
    if (participants.size === 0) {
      this.roomParticipants.delete(roomId);
    }
  }

  private removeUserFromAllRooms(socketId: string) {
    this.roomParticipants.forEach((participants, roomId) => {
      this.removeUserFromRoom(roomId, socketId);
    });
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

  // Helper methods for other services
  getRoomParticipants(roomCode: string) {
    const roomId = `room-${roomCode}`;
    const participants = this.roomParticipants.get(roomId);
    return participants ? Array.from(participants).map(p => p.user) : [];
  }

  getRoomParticipantCount(roomCode: string): number {
    const roomId = `room-${roomCode}`;
    const participants = this.roomParticipants.get(roomId);
    return participants ? participants.size : 0;
  }
}
