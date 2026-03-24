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
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProduces
} from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { SearchMovieDto } from './dto/search-movie.dto';
import { AddCastDto } from './dto/add-cast.dto';
import { BulkRemoveCastDto } from './dto/bulk-remove-cast.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
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

  @Get('trending/pdf')
  @Public()
  @ApiOperation({ summary: 'Download trending movies as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file with trending movies',
    content: { 'application/pdf': {} }
  })
  async getTrendingPdf(@Res() res: Response) {
    const buffer = await this.moviesService.generateTrendingPdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="trending-movies.pdf"',
      'Content-Length': buffer.length
    });
    res.end(buffer);
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending movies' })
  @ApiResponse({ status: 200, description: 'List of trending movies' })
  async getTrending(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10
  ) {
    return this.moviesService.findTrending(page, limit);
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Get popular (trending) movies' })
  @ApiResponse({ status: 200, description: 'List of popular movies' })
  async getPopular(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10
  ) {
    return this.moviesService.findTrending(page, limit);
  }

  @Get('top-rated')
  @Public()
  @ApiOperation({ summary: 'Get top-rated movies ordered by rating' })
  @ApiResponse({ status: 200, description: 'List of top-rated movies' })
  async getTopRated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10
  ) {
    return this.moviesService.findTopRated(page, limit);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search movies by query string' })
  @ApiResponse({ status: 200, description: 'Paginated search results' })
  async searchByQuery(
    @Query('q') q: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10
  ) {
    return this.moviesService.search({ query: q, page, limit });
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
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
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
  @ApiOperation({ summary: 'Search movies by body query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  search(@Body() searchDto: SearchMovieDto) {
    return this.moviesService.search(searchDto);
  }

  @Post(':id/cast')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add actor to movie cast' })
  @ApiResponse({ status: 201, description: 'Actor added to cast' })
  @ApiResponse({ status: 400, description: 'Actor already in cast' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  addToCast(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCastDto
  ) {
    return this.moviesService.addToCast(id, dto);
  }

  @Post(':id/cast/delete')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove multiple actors from movie cast' })
  @ApiResponse({ status: 200, description: 'Actors removed from cast' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  bulkRemoveFromCast(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BulkRemoveCastDto
  ) {
    return this.moviesService.bulkRemoveFromCast(id, dto);
  }

  @Delete(':movieId/actors/:actorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove actor from movie cast' })
  @ApiResponse({ status: 204, description: 'Actor removed from cast' })
  @ApiResponse({ status: 404, description: 'Movie or cast entry not found' })
  removeFromCast(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Param('actorId', ParseIntPipe) actorId: number
  ) {
    return this.moviesService.removeFromCast(movieId, actorId);
  }
}
