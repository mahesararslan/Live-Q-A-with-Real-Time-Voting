import { Injectable } from '@nestjs/common';
import { CreateQuestionInput } from './dto/create-question.input';
import { UpdateQuestionInput } from './dto/update-question.input';
import { Question } from 'src/entities/question.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class QuestionService {

  constructor(
    private eventsGateway: EventsGateway,
    @InjectRepository(Question) private readonly questionRepo: Repository<Question>,
    ) {}

  create(createQuestionInput: CreateQuestionInput) {
    const question = this.questionRepo.create(createQuestionInput);
    // Emit the new question event
    this.eventsGateway.sendMessage(question);
    return this.questionRepo.save(question);
  }

  findAll() {
    return this.questionRepo.find();
  }

  findOne(id: number) {
    return this.questionRepo.findOne({ where: { id } });
  }

  update(id: number, updateQuestionInput: UpdateQuestionInput) {
    return this.questionRepo.update(id, updateQuestionInput);
  }

  remove(id: number) {
    return this.questionRepo.delete(id);
  }
}
