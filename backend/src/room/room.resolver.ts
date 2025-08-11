import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomInput } from './dto/create-room.input';
import { UpdateRoomInput } from './dto/update-room.input';
import { Room } from 'src/entities/room.entity';
import { GqlJwtGuard } from '../auth/guards/gql-jwt-guard/gql-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from 'src/auth/types/jwt-user';

@Resolver(() => Room)
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(GqlJwtGuard)
  @Mutation(() => Room)
  createRoom(
    @Args('createRoomInput') createRoomInput: CreateRoomInput,
    @CurrentUser() user: JwtUser,
  ) {
    return this.roomService.create(createRoomInput, user.userId);
  }

  @Query(() => [Room], { name: 'rooms' })
  findAll() {
    return this.roomService.findAll();
  }

  @Query(() => Room, { name: 'room' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.roomService.findOne(id);
  }

  @Query(() => Room, { name: 'roomByCode' })
  findByCode(@Args('code', { type: () => String }) code: string) {
    return this.roomService.findByCodeWithParticipants(code);
  }

  // 🆕 Join room mutation
  @UseGuards(GqlJwtGuard)
  @Mutation(() => Room)
  async joinRoom(
    @Args('roomCode', { type: () => String }) roomCode: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.roomService.addParticipant(roomCode, user.userId);
  }

  // 🆕 Leave room mutation
  @UseGuards(GqlJwtGuard)
  @Mutation(() => Room)
  async leaveRoom(
    @Args('roomCode', { type: () => String }) roomCode: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.roomService.removeParticipant(roomCode, user.userId);
  }

  // 🆕 Get participant count query
  @Query(() => Int, { name: 'participantCount' })
  async getParticipantCount(
    @Args('roomCode', { type: () => String }) roomCode: string,
  ): Promise<number> {
    return this.roomService.getParticipantCount(roomCode);
  }

  @UseGuards(GqlJwtGuard)
  @Mutation(() => Room)
  updateRoom(@Args('updateRoomInput') updateRoomInput: UpdateRoomInput) {
    return this.roomService.update(updateRoomInput.id, updateRoomInput);
  }

  @UseGuards(GqlJwtGuard)
  @Mutation(() => Room)
  removeRoom(@Args('id', { type: () => Int }) id: number) {
    return this.roomService.remove(id);
  }
}