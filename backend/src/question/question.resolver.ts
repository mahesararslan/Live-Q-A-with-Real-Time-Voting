import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { QuestionService } from './question.service';
import { CreateQuestionInput } from './dto/create-question.input';
import { UpdateQuestionInput } from './dto/update-question.input';
import { Question } from 'src/entities/question.entity';

@Resolver(() => Question)
export class QuestionResolver {
  constructor(private readonly questionService: QuestionService) {}

  @Mutation(() => Question)
  createQuestion(@Args('createQuestionInput') createQuestionInput: CreateQuestionInput) {
    return this.questionService.create(createQuestionInput);
  }

  @Query(() => [Question], { name: 'questions' })
  findAll() {
    return this.questionService.findAll();
  }

  @Query(() => [Question], { name: 'questionsByRoom' })
  findByRoom(@Args('roomId', { type: () => Int }) roomId: number) {
    return this.questionService.findByRoom(roomId);
  }

  @Query(() => Question, { name: 'question' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.questionService.findOne(id);
  }

  @Mutation(() => Question)
  updateQuestion(@Args('updateQuestionInput') updateQuestionInput: UpdateQuestionInput) {
    return this.questionService.update(updateQuestionInput.id, updateQuestionInput);
  }

  @Mutation(() => Question)
  removeQuestion(@Args('id', { type: () => Int }) id: number) {
    return this.questionService.remove(id);
  }
}
