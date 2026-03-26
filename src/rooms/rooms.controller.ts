import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiResponse({ status: 200, description: 'Room found' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update room by ID' })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or cinema owner required'
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentUser() currentUser: User
  ) {
    return this.roomsService.update(id, updateRoomDto, currentUser);
  }
}
