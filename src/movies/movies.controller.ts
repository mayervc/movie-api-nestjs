import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { SearchMovieDto } from './dto/search-movie.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN) // Solo administradores pueden crear películas
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({ status: 201, description: 'Movie created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all movies' })
  @ApiResponse({ status: 200, description: 'List of movies' })
  findAll() {
    return this.moviesService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie found' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN) // Solo administradores pueden actualizar películas
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a movie' })
  @ApiResponse({ status: 200, description: 'Movie updated successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto
  ) {
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN) // Solo administradores pueden eliminar películas
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a movie' })
  @ApiResponse({ status: 204, description: 'Movie deleted successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }

  @Post('search')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search movies' })
  @ApiResponse({ status: 200, description: 'Search results' })
  search(@Body() searchDto: SearchMovieDto) {
    return this.moviesService.search(searchDto);
  }
}
