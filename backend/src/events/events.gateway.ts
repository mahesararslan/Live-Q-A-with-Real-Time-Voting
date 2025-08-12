import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServerToClientEvents } from './types/events';
import { Question } from 'src/entities/question.entity';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt/ws-jwt.guard';
import { SocketAuthMiddleware } from 'src/auth/guards/ws-jwt/ws.mw';

@WebSocketGateway({ namespace: '/events' })
@UseGuards(WsJwtGuard)
export class EventsGateway {

  @WebSocketServer()
  server: Server<any, ServerToClientEvents>;

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleware() as any);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  sendMessage(question: Question) {
    this.server.emit('newMessage', question);
  }
}
