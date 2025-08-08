import { Field, ObjectType } from '@nestjs/graphql';
import { Room } from '../../entities/room.entity';

@ObjectType()
export class JoinRoomResponse {
  @Field(() => Room)
  room: Room;

  @Field()
  message: string;

  @Field()
  success: boolean;
}
