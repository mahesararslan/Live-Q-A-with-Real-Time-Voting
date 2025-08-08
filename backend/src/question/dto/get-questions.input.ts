import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';

export enum QuestionSortBy {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  MOST_VOTED = 'MOST_VOTED',
  LEAST_VOTED = 'LEAST_VOTED',
}

registerEnumType(QuestionSortBy, { name: 'QuestionSortBy' });

@InputType()
export class GetQuestionsInput {
  @Field(() => Int)
  roomId: number;

  @Field(() => QuestionSortBy, { nullable: true, defaultValue: QuestionSortBy.NEWEST })
  @IsOptional()
  @IsEnum(QuestionSortBy)
  sortBy?: QuestionSortBy;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  offset?: number;
}
