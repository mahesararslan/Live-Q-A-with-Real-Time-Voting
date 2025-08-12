import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServerToClientEvents } from './types/events';
import { Question } from 'src/entities/question.entity';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt/ws-jwt.guard';
import { SocketAuthMiddleware } from 'src/auth/guards/ws-jwt/ws.mw';
import { UserService } from 'src/user/user.service';

@WebSocketGateway({ namespace: '/events' })
@UseGuards(WsJwtGuard)
export class EventsGateway {

  @WebSocketServer()
  server: Server<any, ServerToClientEvents>;

  constructor(private readonly userService: UserService) {}

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleware() as any);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  async sendMessage(question: Question) {
    const user = await this.userService.findOne(question.userId);
    question = {
      ...question,
      user: user
    }
    console.log('Sending question:', question);
    this.server.emit('newMessage', question);
  }
}
