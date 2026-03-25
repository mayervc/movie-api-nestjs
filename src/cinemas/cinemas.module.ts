import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cinema } from './entities/cinema.entity';
import { CinemaUser } from './entities/cinema-user.entity';
import { CinemasController } from './cinemas.controller';
import { CinemasService } from './cinemas.service';
import { User } from '../users/entities/user.entity';
import { Room } from '../rooms/entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cinema, CinemaUser, User, Room])],
  controllers: [CinemasController],
  providers: [CinemasService],
  exports: [CinemasService]
})
export class CinemasModule {}
