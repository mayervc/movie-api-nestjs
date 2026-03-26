import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { RoomBlock } from './entities/room-block.entity';
import { CinemasService } from '../cinemas/cinemas.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateRoomBlockDto } from './dto/create-room-block.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(RoomBlock)
    private readonly roomBlocksRepository: Repository<RoomBlock>,
    private readonly cinemasService: CinemasService
  ) {}

  async findOne(id: number): Promise<Room> {
    const room = await this.roomsRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async update(
    id: number,
    dto: UpdateRoomDto,
    currentUser: User
  ): Promise<Room> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }

    const room = await this.findOne(id);

    await this.cinemasService.assertCinemaOwnerOrAdmin(
      room.cinemaId,
      currentUser
    );

    Object.assign(room, dto);
    return this.roomsRepository.save(room);
  }

  async delete(id: number, currentUser: User): Promise<void> {
    const room = await this.findOne(id);

    await this.cinemasService.assertCinemaOwnerOrAdmin(
      room.cinemaId,
      currentUser
    );

    await this.roomsRepository.delete(id);
  }

  async createBlock(
    roomId: number,
    dto: CreateRoomBlockDto,
    currentUser: User
  ): Promise<RoomBlock> {
    const room = await this.findOne(roomId);

    await this.cinemasService.assertCinemaOwnerOrAdmin(
      room.cinemaId,
      currentUser
    );

    const block = this.roomBlocksRepository.create({ ...dto, roomId });
    return this.roomBlocksRepository.save(block);
  }
}
