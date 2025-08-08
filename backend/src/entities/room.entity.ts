import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';

@ObjectType()
@Entity()
export class Room {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  code: string; // Unique room code for joining

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field()
  @Column({ default: false })
  isEnded: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  endedAt?: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.adminRooms, { onDelete: 'CASCADE' })
  admin: User;

  @Field(() => [Question], { nullable: true })
  @OneToMany(() => Question, (question) => question.room, { cascade: true })
  questions: Question[];

  @Field(() => Int)
  @Column()
  adminId: number;

  // Computed fields
  @Field(() => Int)
  async totalQuestions(): Promise<number> {
    return this.questions?.length || 0;
  }

  @Field(() => Int)
  async activeQuestions(): Promise<number> {
    return this.questions?.filter(q => !q.isDeleted).length || 0;
  }
}
