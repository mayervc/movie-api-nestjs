import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CinemasService } from './cinemas.service';

@ApiTags('cinemas')
@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

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
}

