import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomBlockDto } from './create-room-block.dto';

export class UpdateRoomBlockDto extends PartialType(CreateRoomBlockDto) {}
