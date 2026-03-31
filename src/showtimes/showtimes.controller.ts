import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ShowtimesService } from './showtimes.service';
import { SearchShowtimesDto } from './dto/search-showtimes.dto';

@ApiTags('showtimes')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get showtime by ID with movie and room details' })
  @ApiResponse({ status: 200, description: 'Showtime found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Showtime not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.findOne(id);
  }

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
