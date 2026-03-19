import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CinemasService } from './cinemas.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { UpdateCinemaDto } from './dto/update-cinema.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('cinemas')
@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a cinema' })
  @ApiResponse({ status: 201, description: 'Cinema created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  create(@Body() createCinemaDto: CreateCinemaDto) {
    return this.cinemasService.create(createCinemaDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all cinemas' })
  @ApiResponse({ status: 200, description: 'Paginated cinemas list' })
  async getCinemas(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10
  ) {
    return this.cinemasService.findAll(page, limit);
  }

  /** Must stay before any `@Get(':id')` route so `search` is not captured as an id. */
  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search cinemas' })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search text (name, address, city, country, phone, country code)'
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated search results' })
  @ApiResponse({ status: 400, description: 'Invalid pagination params' })
  async searchCinemas(
    @Query('q', new DefaultValuePipe('')) q: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    const pageFinal = page ?? 1;
    const limitFinal = limit ?? 10;
    return this.cinemasService.search(q, pageFinal, limitFinal);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get cinema by ID' })
  @ApiResponse({ status: 200, description: 'Cinema found' })
  @ApiResponse({ status: 404, description: 'Cinema not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cinemasService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a cinema' })
  @ApiResponse({ status: 200, description: 'Cinema updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Cinema not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCinemaDto: UpdateCinemaDto
  ) {
    return this.cinemasService.update(id, updateCinemaDto);
  }
}

