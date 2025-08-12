import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if(context.getType() !== 'ws') {
      return true; // Only allow WebSocket connections
    }

    const client: Socket = context.switchToWs().getClient();
    WsJwtGuard.validateToken(client);

    return true;
  }

  static validateToken(client: Socket) {
    const { authorization } = client.handshake.headers; // client.handshake.auth is used in WebSocket connections but since for now we are using postman so using headers.
    Logger.log({ authorization });

    const token: string = authorization?.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    console.log('token:', token);
    const payload = verify(token, jwtSecret);
    console.log('payload:', payload);
    return payload;
  }
}
