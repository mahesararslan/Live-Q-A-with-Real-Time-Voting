import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { UserModule } from 'src/user/user.module';
import { QuestionModule } from 'src/question/question.module';
import { RoomModule } from 'src/room/room.module';
import { VoteModule } from 'src/vote/vote.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    UserModule, 
    forwardRef(() => QuestionModule), 
    RoomModule,
    VoteModule,
    RedisModule, // Add Redis module
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
