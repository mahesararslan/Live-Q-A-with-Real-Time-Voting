import { Injectable } from '@nestjs/common';
import { CreateRoomInput } from './dto/create-room.input';
import { UpdateRoomInput } from './dto/update-room.input';
import { Room } from 'src/entities/room.entity';
import { User } from 'src/entities/user.entity';
import { Question } from 'src/entities/question.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoomService {

  constructor(
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Question) private readonly questionRepo: Repository<Question>,
  ) {}

  async create(createRoomInput: CreateRoomInput, adminId: number) {
    // Generate a unique room code
    const roomCode = await this.generateUniqueRoomCode();
    
    // Find the admin user first to ensure they exist
    const admin = await this.userRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new Error('Admin user not found');
    }
    
    const room = this.roomRepo.create({
      ...createRoomInput,
      code: roomCode,
      adminId: adminId,
    });
    
    // Save the room first
    const savedRoom = await this.roomRepo.save(room);
    
    // Return the room with admin relationship loaded
    return this.roomRepo.findOne({
      where: { id: savedRoom.id },
      relations: ['admin'],
    });
  }

  findAll() {
    return this.roomRepo.find();
  }

  findOne(id: number) {
    return this.roomRepo.findOne({ where: { id } });
  }

  // Add method to find room by code for joining
  findByCode(code: string) {
    return this.roomRepo.findOne({ 
      where: { code },
      relations: ['admin'] // Include admin details for permission checks
    });
  }

  // 🆕 Find room with participants
  findByCodeWithParticipants(code: string) {
    return this.roomRepo.findOne({
      where: { code },
      relations: ['admin', 'participants'],
    });
  }

  // 🆕 Add user to room participants
  async addParticipant(roomCode: string, userId: number) {
    const room = await this.roomRepo.findOne({
      where: { code: roomCode },
      relations: ['participants'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.isActive || room.isEnded) {
      throw new Error('Room is not active');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a participant
    const isAlreadyParticipant = room.participants.some(p => p.id === userId);
    if (!isAlreadyParticipant) {
      room.participants.push(user);
      await this.roomRepo.save(room);
    }

    // Return room with all relations
    return this.roomRepo.findOne({
      where: { code: roomCode },
      relations: ['admin', 'participants'],
    });
  }

  // 🆕 Remove user from room participants
  async removeParticipant(roomCode: string, userId: number) {
    const room = await this.roomRepo.findOne({
      where: { code: roomCode },
      relations: ['participants'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    room.participants = room.participants.filter(p => p.id !== userId);
    await this.roomRepo.save(room);

    // Return room with all relations
    return this.roomRepo.findOne({
      where: { code: roomCode },
      relations: ['admin', 'participants'],
    });
  }

  // 🆕 Get participant count
  async getParticipantCount(roomCode: string): Promise<number> {
    const room = await this.roomRepo.findOne({
      where: { code: roomCode },
      relations: ['participants'],
    });

    return room?.participants?.length || 0;
  }

  update(id: number, updateRoomInput: UpdateRoomInput) {
    return this.roomRepo.update(id, updateRoomInput);
  }

  remove(id: number) {
    return this.roomRepo.delete(id);
  }

  // 🆕 Delete room and all its questions when session ends
  async deleteRoomAndQuestions(roomCode: string): Promise<boolean> {
    const room = await this.roomRepo.findOne({
      where: { code: roomCode },
      relations: ['questions'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    try {
      // Delete all questions in the room first (if not using CASCADE)
      if (room.questions && room.questions.length > 0) {
        await this.questionRepo.delete({ roomId: room.id });
      }

      // Delete the room (this will also delete questions due to CASCADE in entity)
      await this.roomRepo.delete(room.id);
      
      return true;
    } catch (error) {
      console.error('Error deleting room and questions:', error);
      throw new Error('Failed to delete room and questions');
    }
  }

  // Private method to generate unique room codes
  private async generateUniqueRoomCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate a 6-character alphanumeric code
      code = this.generateRandomCode(6);
      
      // Check if code already exists
      const existingRoom = await this.roomRepo.findOne({ where: { code } });
      if (!existingRoom) {
        isUnique = true;
      }
    }
    
    return code;
  }

  // Generate random alphanumeric code
  private generateRandomCode(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
}