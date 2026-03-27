import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { RoomBlock } from './entities/room-block.entity';
import { RoomSeat } from './entities/room-seat.entity';
import { CinemasService } from '../cinemas/cinemas.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateRoomBlockDto } from './dto/create-room-block.dto';
import { UpdateRoomBlockDto } from './dto/update-room-block.dto';
import { CreateRoomSeatDto } from './dto/create-room-seat.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(RoomBlock)
    private readonly roomBlocksRepository: Repository<RoomBlock>,
    @InjectRepository(RoomSeat)
    private readonly roomSeatsRepository: Repository<RoomSeat>,
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

  async findOneBlock(id: number): Promise<RoomBlock> {
    const block = await this.roomBlocksRepository.findOne({ where: { id } });
    if (!block) {
      throw new NotFoundException(`RoomBlock with ID ${id} not found`);
    }
    return block;
  }

  async updateBlock(
    id: number,
    dto: UpdateRoomBlockDto,
    currentUser: User
  ): Promise<RoomBlock> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }

    const block = await this.findOneBlock(id);
    const room = await this.findOne(block.roomId);

    await this.cinemasService.assertCinemaOwnerOrAdmin(
      room.cinemaId,
      currentUser
    );

    Object.assign(block, dto);
    return this.roomBlocksRepository.save(block);
  }

  async deleteBlock(id: number, currentUser: User): Promise<void> {
    const block = await this.findOneBlock(id);
    const room = await this.findOne(block.roomId);

    await this.cinemasService.assertCinemaOwnerOrAdmin(
      room.cinemaId,
      currentUser
    );

    await this.roomBlocksRepository.delete(id);
  }

  async createSeat(
    blockId: number,
    dto: CreateRoomSeatDto,
    currentUser: User
  ): Promise<RoomSeat> {
    const block = await this.findOneBlock(blockId);
    const room = await this.findOne(block.roomId);

    await this.cinemasService.assertCinemaOwnerOrAdmin(
      room.cinemaId,
      currentUser
    );

    const seat = this.roomSeatsRepository.create({
      ...dto,
      roomBlockId: blockId
    });
    return this.roomSeatsRepository.save(seat);
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
