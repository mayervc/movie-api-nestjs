import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShowtimesService } from './showtimes.service';

@ApiTags('showtimes')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}
}
