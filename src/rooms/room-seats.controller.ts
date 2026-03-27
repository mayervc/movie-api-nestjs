import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { UpdateRoomSeatDto } from './dto/update-room-seat.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('room-seats')
@Controller('room-seats')
export class RoomSeatsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update room seat by ID' })
  @ApiResponse({ status: 200, description: 'Room seat updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or cinema owner required'
  })
  @ApiResponse({ status: 404, description: 'Room seat not found' })
  updateSeat(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomSeatDto: UpdateRoomSeatDto,
    @CurrentUser() currentUser: User
  ) {
    return this.roomsService.updateSeat(id, updateRoomSeatDto, currentUser);
  }
}
