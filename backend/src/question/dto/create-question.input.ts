import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateQuestionInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  content: string;

  @Field(() => Int)
  @IsNotEmpty()
  roomId: number;

  @Field()
  @IsNotEmpty()
  userId: number;
}
