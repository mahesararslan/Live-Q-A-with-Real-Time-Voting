import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';

@ObjectType()
@Entity()
@Unique(['userId', 'questionId']) // Ensure one vote per user per question
export class Vote {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.votes, { onDelete: 'CASCADE' })
  user: User;

  @Field(() => Question)
  @ManyToOne(() => Question, (question) => question.votes, { onDelete: 'CASCADE' })
  question: Question;

  @Field(() => Int)
  @Column()
  userId: number;

  @Field(() => Int)
  @Column()
  questionId: number;
}
