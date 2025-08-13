import { Injectable } from '@nestjs/common';
import { CreateVoteInput } from './dto/create-vote.input';
import { RemoveVoteInput } from './dto/remove-vote.input';
import { Vote } from 'src/entities/vote.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from 'src/entities/question.entity';

type VoteToggleResult = {
  action: 'added' | 'removed';
  voteId: number;
};

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote) private readonly voteRepo: Repository<Vote>,
    @InjectRepository(Question) private readonly questionRepo: Repository<Question>,
  ) {}

  async toggleVote(questionId: number, userId: number): Promise<VoteToggleResult> {
    // Check if user already voted for this question
    const existingVote = await this.voteRepo.findOne({
      where: { questionId, userId },
    });

    if (existingVote) {
      // Remove the vote if it exists
      await this.voteRepo.remove(existingVote);
      
      // Update question vote count
      await this.updateQuestionVoteCount(questionId);
      
      return { action: 'removed' as const, voteId: existingVote.id };
    } else {
      // Create a new vote if it doesn't exist
      const vote = this.voteRepo.create({ questionId, userId });
      const savedVote = await this.voteRepo.save(vote);
      
      // Update question vote count
      await this.updateQuestionVoteCount(questionId);
      
      return { action: 'added' as const, voteId: savedVote.id };
    }
  }

  private async updateQuestionVoteCount(questionId: number): Promise<void> {
    const voteCount = await this.getQuestionVoteCount(questionId);
    await this.questionRepo.update(questionId, { voteCount });
  }

  async getQuestionVoteCount(questionId: number): Promise<number> {
    return await this.voteRepo.count({ where: { questionId } });
  }

  async hasUserVoted(questionId: number, userId: number): Promise<boolean> {
    const vote = await this.voteRepo.findOne({
      where: { questionId, userId },
    });
    return !!vote;
  }

  create(createVoteInput: CreateVoteInput) {
    const vote = this.voteRepo.create(createVoteInput);
    return this.voteRepo.save(vote);
  }

  findAll() {
    return this.voteRepo.find();
  }

  findOne(id: number) {
    return this.voteRepo.findOne({ where: { id } });
  }

  remove(removeVoteInput: RemoveVoteInput) {
    return this.voteRepo.delete(removeVoteInput);
  }
}
