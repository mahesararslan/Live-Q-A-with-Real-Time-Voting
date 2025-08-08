import { Injectable } from '@nestjs/common';
import { CreateVoteInput } from './dto/create-vote.input';
import { RemoveVoteInput } from './dto/remove-vote.input';
import { Vote } from 'src/entities/vote.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class VoteService {
  constructor(
  @InjectRepository(Vote) private readonly VoteRepo: Repository<Vote>,
  ) {}

  create(createVoteInput: CreateVoteInput) {
    const vote = this.VoteRepo.create(createVoteInput);
    return this.VoteRepo.save(vote);
  }

  findAll() {
    return this.VoteRepo.find();
  }

  findOne(id: number) {
    return this.VoteRepo.findOne({ where: { id } });
  }

  remove(removeVoteInput: RemoveVoteInput) {
    return this.VoteRepo.delete(removeVoteInput);
  }
}
