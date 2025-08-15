import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export interface PubSubMessage {
  type: 'newMessage' | 'voteUpdated' | 'questionAnswered' | 'userJoined' | 'userLeft' | 'sessionEnded';
  roomCode: string;
  data: any;
  serverId?: string;
  timestamp?: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private publisher: Redis;
  private subscriber: Redis;
  private readonly serverId: string;
  private eventHandlers = new Map<string, (message: PubSubMessage) => void>();

  constructor(@InjectRedis() private readonly redis: Redis) {
    this.serverId = `server-${process.pid}-${Date.now()}`;
  }

  async onModuleInit() {
    await this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Create publisher (duplicate the main Redis connection)
      this.publisher = this.redis.duplicate();
      
      // Create subscriber (duplicate the main Redis connection)
      this.subscriber = this.redis.duplicate();

      // Set up subscriber event handlers
      this.subscriber.on('pmessage', this.handleMessage.bind(this));
      this.subscriber.on('error', (error) => {
        this.logger.error('Redis subscriber error:', error);
      });
      
      // Subscribe to all room channels using pattern
      await this.subscriber.psubscribe('room:*');
      
      this.logger.log(`Redis Pub/Sub initialized for server ${this.serverId}`);
    } catch (error) {
      this.logger.error('Failed to initialize Redis Pub/Sub:', error);
    }
  }

  private handleMessage(pattern: string, channel: string, message: string) {
    try {
      const parsedMessage: PubSubMessage = JSON.parse(message);
      
      // Ignore messages from the same server instance
      if (parsedMessage.serverId === this.serverId) {
        return;
      }

      const roomCode = channel.replace('room:', '');
      const handler = this.eventHandlers.get(parsedMessage.type);
      
      if (handler) {
        handler({ ...parsedMessage, roomCode });
      }
      
      this.logger.log(`Received Redis message: ${parsedMessage.type} for room ${roomCode} from server ${parsedMessage.serverId}`);
    } catch (error) {
      this.logger.error('Error handling Redis message:', error);
    }
  }

  async publishToRoom(roomCode: string, type: PubSubMessage['type'], data: any) {
    try {
      const message: PubSubMessage = {
        type,
        roomCode,
        data,
        serverId: this.serverId,
        timestamp: Date.now(),
      };

      await this.publisher.publish(`room:${roomCode}`, JSON.stringify(message));
      this.logger.log(`Published ${type} message to room:${roomCode}`);
    } catch (error) {
      this.logger.error(`Error publishing to room ${roomCode}:`, error);
    }
  }

  onMessage(type: PubSubMessage['type'], handler: (message: PubSubMessage) => void) {
    this.eventHandlers.set(type, handler);
  }

  // Room participant management via Redis
  async addParticipantToRoom(roomCode: string, participant: any) {
    try {
      const key = `room:${roomCode}:participants`;
      await this.publisher.hset(key, participant.id, JSON.stringify({
        ...participant,
        serverId: this.serverId,
        lastSeen: Date.now(),
      }));
      await this.publisher.expire(key, 3600); // Expire after 1 hour
    } catch (error) {
      this.logger.error(`Error adding participant to room ${roomCode}:`, error);
    }
  }

  async removeParticipantFromRoom(roomCode: string, participantId: string) {
    try {
      const key = `room:${roomCode}:participants`;
      await this.publisher.hdel(key, participantId);
    } catch (error) {
      this.logger.error(`Error removing participant from room ${roomCode}:`, error);
    }
  }

  async getRoomParticipants(roomCode: string): Promise<any[]> {
    try {
      const key = `room:${roomCode}:participants`;
      const participants = await this.publisher.hgetall(key);
      return Object.values(participants).map(p => {
        const parsed = JSON.parse(p);
        // Remove server-specific data when returning to clients
        const { serverId, lastSeen, ...clientData } = parsed;
        return clientData;
      });
    } catch (error) {
      this.logger.error(`Error getting participants for room ${roomCode}:`, error);
      return [];
    }
  }

  async getRoomParticipantCount(roomCode: string): Promise<number> {
    try {
      const key = `room:${roomCode}:participants`;
      return await this.publisher.hlen(key);
    } catch (error) {
      this.logger.error(`Error getting participant count for room ${roomCode}:`, error);
      return 0;
    }
  }

  async deleteRoom(roomCode: string) {
    try {
      const participantKey = `room:${roomCode}:participants`;
      await this.publisher.del(participantKey);
      this.logger.log(`Deleted Redis data for room ${roomCode}`);
    } catch (error) {
      this.logger.error(`Error deleting room ${roomCode} from Redis:`, error);
    }
  }

  // Cleanup stale participants (participants that haven't been seen for a while)
  async cleanupStaleParticipants(roomCode: string, maxAge: number = 300000) { // 5 minutes
    try {
      const key = `room:${roomCode}:participants`;
      const participants = await this.publisher.hgetall(key);
      const now = Date.now();
      
      for (const [participantId, data] of Object.entries(participants)) {
        const parsed = JSON.parse(data);
        if (now - parsed.lastSeen > maxAge) {
          await this.publisher.hdel(key, participantId);
          this.logger.log(`Cleaned up stale participant ${participantId} from room ${roomCode}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error cleaning up stale participants for room ${roomCode}:`, error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.subscriber?.disconnect();
      await this.publisher?.disconnect();
      this.logger.log('Redis connections closed');
    } catch (error) {
      this.logger.error('Error closing Redis connections:', error);
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Get server ID for debugging
  getServerId(): string {
    return this.serverId;
  }
}
