import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { RoomBlock } from './entities/room-block.entity';
import { RoomSeat } from './entities/room-seat.entity';
import { CinemasModule } from '../cinemas/cinemas.module';
import { RoomsController } from './rooms.controller';
import { RoomBlocksController } from './room-blocks.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomBlock, RoomSeat]),
    CinemasModule
  ],
  controllers: [RoomsController, RoomBlocksController],
  providers: [RoomsService],
  exports: [RoomsService]
})
export class RoomsModule {}
