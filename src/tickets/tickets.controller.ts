import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
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
}
