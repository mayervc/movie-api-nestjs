import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  ForbiddenException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { TicketsService } from '../tickets/tickets.service';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { User } from './entities/user.entity';

function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ticketsService: TicketsService
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    const full = await this.usersService.findById(user.id);
    return toUserResponse(full);
  }

  @Get('me/tickets')
  @ApiOperation({ summary: 'Get all tickets of the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of tickets (empty array if none)'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyTickets(@CurrentUser() currentUser: User) {
    return this.ticketsService.findByUser(currentUser.id);
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create admin user (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Admin user created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createAdmin(
    @Body() dto: CreateUserByAdminDto
  ): Promise<UserResponseDto> {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      role: UserRole.ADMIN
    });
    return toUserResponse(user);
  }

  @Post('vendors')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create vendor user (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Vendor user created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createVendor(
    @Body() dto: CreateUserByAdminDto
  ): Promise<UserResponseDto> {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      role: UserRole.VENDOR
    });
    return toUserResponse(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (ADMIN or resource owner)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User
  ): Promise<UserResponseDto> {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = currentUser.id === id;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Not allowed to update this user');
    }
    const user = await this.usersService.update(id, dto);
    return toUserResponse(user);
  }
}
