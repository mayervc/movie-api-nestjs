import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ShowtimesService } from './showtimes.service';
import { SearchShowtimesDto } from './dto/search-showtimes.dto';

@ApiTags('showtimes')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Post('search')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search showtimes by filters' })
  @ApiResponse({ status: 200, description: 'List of matching showtimes' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  search(@Body() searchShowtimesDto: SearchShowtimesDto) {
    return this.showtimesService.search(searchShowtimesDto);
  }
}
