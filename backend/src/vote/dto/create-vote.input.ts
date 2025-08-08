import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateVoteInput {
  @Field(() => Int)
  questionId: number;

  @Field(() => Int)
  userId: number;
}
