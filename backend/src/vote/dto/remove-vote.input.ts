import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class RemoveVoteInput {
  @Field(() => Int)
  questionId: number;

  @Field(() => Int)
  userId: number;
}
