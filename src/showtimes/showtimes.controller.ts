import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { SearchShowtimesDto } from './dto/search-showtimes.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('showtimes')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new showtime' })
  @ApiResponse({ status: 201, description: 'Showtime created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or cinema owner required'
  })
  @ApiResponse({ status: 404, description: 'Movie or room not found' })
  create(
    @Body() createShowtimeDto: CreateShowtimeDto,
    @CurrentUser() currentUser: User
  ) {
    return this.showtimesService.create(createShowtimeDto, currentUser);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update showtime by ID' })
  @ApiResponse({ status: 200, description: 'Showtime updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or cinema owner required'
  })
  @ApiResponse({ status: 404, description: 'Showtime not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShowtimeDto: UpdateShowtimeDto,
    @CurrentUser() currentUser: User
  ) {
    return this.showtimesService.update(id, updateShowtimeDto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete showtime by ID' })
  @ApiResponse({ status: 204, description: 'Showtime deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or cinema owner required'
  })
  @ApiResponse({ status: 404, description: 'Showtime not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User
  ) {
    return this.showtimesService.remove(id, currentUser);
  }

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
