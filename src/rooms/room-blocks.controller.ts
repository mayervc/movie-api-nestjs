import {
  Body,
  Controller,
  Delete,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { UpdateRoomBlockDto } from './dto/update-room-block.dto';
import { CreateRoomSeatDto } from './dto/create-room-seat.dto';
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete room block by ID' })
  @ApiResponse({ status: 204, description: 'Room block deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or cinema owner required'
  })
  @ApiResponse({ status: 404, description: 'Room block not found' })
  deleteBlock(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User
  ) {
    return this.roomsService.deleteBlock(id, currentUser);
  }

  @Post(':blockId/seats')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a seat inside a room block' })
  @ApiResponse({ status: 201, description: 'Room seat created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or cinema owner required'
  })
  @ApiResponse({ status: 404, description: 'Room block not found' })
  createSeat(
    @Param('blockId', ParseIntPipe) blockId: number,
    @Body() createRoomSeatDto: CreateRoomSeatDto,
    @CurrentUser() currentUser: User
  ) {
    return this.roomsService.createSeat(
      blockId,
      createRoomSeatDto,
      currentUser
    );
  }
}
