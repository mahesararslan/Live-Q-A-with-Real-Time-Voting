import { Module } from '@nestjs/common';
import { VoteService } from './vote.service';
import { VoteResolver } from './vote.resolver';
import { Vote } from 'src/entities/vote.entity';
import { Question } from 'src/entities/question.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, Question])],
  providers: [VoteResolver, VoteService],
  exports: [VoteService],
})
export class VoteModule {}
