import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
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
  code: string;

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

  @Field(() => Int)
  @Column()
  adminId: number;

  // Relations 
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.adminRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Field(() => [Question], { nullable: true })
  @OneToMany(() => Question, (question) => question.room, { cascade: true })
  questions: Question[];

  // 🆕 Many-to-Many relationship for participants
  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user.joinedRooms, { cascade: ['insert', 'update'] })
  @JoinTable({
    name: 'room_participants', // Custom junction table name
    joinColumn: { name: 'roomId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  participants: User[];

  // Computed fields
  @Field(() => Int)
  async totalQuestions(): Promise<number> {
    return this.questions?.length || 0;
  }

  @Field(() => Int)
  async activeQuestions(): Promise<number> {
    return this.questions?.filter(q => !q.isDeleted).length || 0;
  }

  @Field(() => Int)
  async participantCount(): Promise<number> {
    return this.participants?.length || 0;
  }
}