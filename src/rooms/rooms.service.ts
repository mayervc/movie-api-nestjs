import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CinemaUser } from '../cinemas/entities/cinema-user.entity';
import { UpdateRoomDto } from './dto/update-room.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(CinemaUser)
    private readonly cinemaUsersRepository: Repository<CinemaUser>
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

    const isAdmin = currentUser.role === UserRole.ADMIN;
    if (!isAdmin) {
      const ownerLink = await this.cinemaUsersRepository.findOne({
        where: { cinemaId: room.cinemaId, userId: currentUser.id }
      });
      if (!ownerLink) {
        throw new ForbiddenException('Not allowed to update this room');
      }
    }

    Object.assign(room, dto);
    return this.roomsRepository.save(room);
  }
}
