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
import { Room } from './room.entity';
import { Vote } from './vote.entity';

@ObjectType()
@Entity()
export class Question {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('text')
  content: string;

  @Field(() => Int)
  @Column({ default: 0 })
  voteCount: number;

  @Field()
  @Column({ default: false })
  isAnswered: boolean;

  @Field()
  @Column({ default: false })
  isDeleted: boolean; // Soft delete flag for admins to hide questions

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.questions, { onDelete: 'CASCADE' })
  user: User;

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.questions, { onDelete: 'CASCADE' })
  room: Room;

  @Field(() => [Vote], { nullable: true })
  @OneToMany(() => Vote, (vote) => vote.question, { cascade: true })
  votes: Vote[];

  @Field(() => Int)
  @Column()
  userId: number;

  @Field(() => Int)
  @Column()
  roomId: number;
}
