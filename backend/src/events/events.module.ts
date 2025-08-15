import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { UserModule } from 'src/user/user.module';
import { QuestionModule } from 'src/question/question.module';
import { RoomModule } from 'src/room/room.module';
import { VoteModule } from 'src/vote/vote.module';

@Module({
  imports: [
    UserModule, 
    forwardRef(() => QuestionModule), 
    RoomModule,
    VoteModule
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
