import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomSeatDto } from './create-room-seat.dto';

export class UpdateRoomSeatDto extends PartialType(CreateRoomSeatDto) {}
