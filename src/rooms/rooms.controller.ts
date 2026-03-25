import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { RoomsService } from './rooms.service';

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
}
