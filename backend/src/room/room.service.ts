import { Injectable } from '@nestjs/common';
import { CreateRoomInput } from './dto/create-room.input';
import { UpdateRoomInput } from './dto/update-room.input';
import { Room } from 'src/entities/room.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoomService {

  constructor(
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    ) {}

  create(createRoomInput: CreateRoomInput) {
    const room = this.roomRepo.create(createRoomInput);
    return this.roomRepo.save(room);
  }

  findAll() {
    return this.roomRepo.find();
  }

  findOne(id: number) {
    return this.roomRepo.findOne({ where: { id } });
  }

  update(id: number, updateRoomInput: UpdateRoomInput) {
    return this.roomRepo.update(id, updateRoomInput);
  }

  remove(id: number) {
    return this.roomRepo.delete(id);
  }
}
