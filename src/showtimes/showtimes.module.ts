import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Showtime } from './entities/showtime.entity';
import { ShowtimesController } from './showtimes.controller';
import { ShowtimesService } from './showtimes.service';
import { MoviesModule } from '../movies/movies.module';
import { RoomsModule } from '../rooms/rooms.module';
import { CinemasModule } from '../cinemas/cinemas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Showtime]),
    MoviesModule,
    RoomsModule,
    CinemasModule
  ],
  controllers: [ShowtimesController],
  providers: [ShowtimesService],
  exports: [ShowtimesService]
})
export class ShowtimesModule {}
