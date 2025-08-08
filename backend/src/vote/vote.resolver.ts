import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { VoteService } from './vote.service';
import { CreateVoteInput } from './dto/create-vote.input';
import { RemoveVoteInput } from './dto/remove-vote.input';
import { Vote } from 'src/entities/vote.entity';

@Resolver(() => Vote)
export class VoteResolver {
  constructor(private readonly voteService: VoteService) {}

  @Mutation(() => Vote)
  createVote(@Args('createVoteInput') createVoteInput: CreateVoteInput) {
    return this.voteService.create(createVoteInput);
  }

  @Mutation(() => Vote)
  removeVote(@Args('removeVoteInput') removeVoteInput: RemoveVoteInput) {
    return this.voteService.remove(removeVoteInput);
  }

  // @Query(() => [Vote], { name: 'vote' })
  // findAll() {
  //   return this.voteService.findAll();
  // }

  // @Query(() => Vote, { name: 'vote' })
  // findOne(@Args('id', { type: () => Int }) id: number) {
  //   return this.voteService.findOne(id);
  // }
}
