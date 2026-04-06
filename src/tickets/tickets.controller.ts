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
import { TicketsService } from './tickets.service';
import { PurchaseTicketsDto } from './dto/purchase-tickets.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('tickets')
@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase tickets for a showtime' })
  @ApiResponse({ status: 201, description: 'Tickets created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Seat already taken or validation failure'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Showtime or seat not found' })
  purchase(
    @Body() purchaseTicketsDto: PurchaseTicketsDto,
    @CurrentUser() currentUser: User
  ) {
    return this.ticketsService.purchase(purchaseTicketsDto, currentUser.id);
  }

  @Get('showtimes/:id/tickets')
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
