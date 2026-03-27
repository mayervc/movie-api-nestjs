import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { UpdateRoomBlockDto } from './dto/update-room-block.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('room-blocks')
@Controller('room-blocks')
export class RoomBlocksController {
  constructor(private readonly roomsService: RoomsService) {}

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update room block by ID' })
  @ApiResponse({ status: 200, description: 'Room block updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or cinema owner required'
  })
  @ApiResponse({ status: 404, description: 'Room block not found' })
  updateBlock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomBlockDto: UpdateRoomBlockDto,
    @CurrentUser() currentUser: User
  ) {
    return this.roomsService.updateBlock(id, updateRoomBlockDto, currentUser);
  }
}
