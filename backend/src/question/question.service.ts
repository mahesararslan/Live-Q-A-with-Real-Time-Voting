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

  async create(createQuestionInput: CreateQuestionInput) {
    const question = this.questionRepo.create(createQuestionInput);
    console.log('Creating question:', question);
    
    const savedQuestion = await this.questionRepo.save(question);
    
    // Fetch the question with relations
    const questionWithRelations = await this.questionRepo.findOne({
      where: { id: savedQuestion.id },
      relations: ['user', 'room'],
    });
    
    // Emit the new question event
    this.eventsGateway.sendMessage(questionWithRelations);
    
    return questionWithRelations; 
  }

  findAll() {
    return this.questionRepo.find({
      relations: ['user', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  findByRoom(roomId: number) {
    return this.questionRepo.find({
      where: { roomId },
      relations: ['user', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.questionRepo.findOne({ 
      where: { id },
      relations: ['user', 'room'],
    });
  }

  update(id: number, updateQuestionInput: UpdateQuestionInput) {
    return this.questionRepo.update(id, updateQuestionInput);
  }

  remove(id: number) {
    return this.questionRepo.delete(id);
  }
}
