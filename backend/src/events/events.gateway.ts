import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ServerToClientEvents } from './types/events';
import { Question } from 'src/entities/question.entity';

@WebSocketGateway({ namespace: '/events' })
export class EventsGateway {

  @WebSocketServer()
  server: Server<any, ServerToClientEvents>;

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  sendMessage(question: Question) {
    this.server.emit('newMessage', question);
  }
}
