import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('tickets')
@Controller('showtimes')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':id/tickets')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get authenticated user's tickets for a showtime" })
  @ApiResponse({
    status: 200,
    description: 'List of tickets (empty array if none)'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Showtime not found' })
  findByShowtime(
    @Param('id', ParseIntPipe) showtimeId: number,
    @CurrentUser() currentUser: User
  ) {
    return this.ticketsService.findByShowtime(showtimeId, currentUser.id);
  }
}
