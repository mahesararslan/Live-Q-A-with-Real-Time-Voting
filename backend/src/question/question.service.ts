import { Injectable } from '@nestjs/common';
import { CreateQuestionInput } from './dto/create-question.input';
import { UpdateQuestionInput } from './dto/update-question.input';
import { Question } from 'src/entities/question.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class QuestionService {

  constructor(
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
    
    // Note: WebSocket events will be handled separately to avoid circular dependencies
    
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

  async findByRoomWithVoteInfo(roomId: number, userId?: number) {
    const questions = await this.questionRepo.find({
      where: { roomId },
      relations: ['user', 'room', 'votes'],
      order: { createdAt: 'DESC' },
    });

    // If userId is provided, add hasVoted information
    if (userId) {
      return questions.map(question => ({
        ...question,
        hasVoted: question.votes.some(vote => vote.userId === userId),
        votes: undefined, // Remove votes array to avoid sending unnecessary data
      }));
    }

    return questions.map(question => ({
      ...question,
      votes: undefined, // Remove votes array to avoid sending unnecessary data
    }));
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
