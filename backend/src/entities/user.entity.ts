import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { Question } from './question.entity';
import { Vote } from './vote.entity';

@ObjectType()
@Entity()
export class User {
  constructor(partial?: Partial<User>) {
    Object.assign(this, partial);
  }

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column({ nullable: true })
  avatarUrl: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true }) // for google users
  password: string; // Not exposed in GraphQL for security

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Field(() => [Room], { nullable: true })
  @OneToMany(() => Room, (room) => room.admin)
  adminRooms: Room[];

  @Field(() => [Question], { nullable: true })
  @OneToMany(() => Question, (question) => question.user)
  questions: Question[];

  @Field(() => [Vote], { nullable: true })
  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];
}