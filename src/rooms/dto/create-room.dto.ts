import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Sala Estandar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2, description: 'Number of block rows in the room' })
  @IsInt()
  @Min(1)
  rowsBlocks: number;

  @ApiProperty({
    example: 2,
    description: 'Number of block columns in the room'
  })
  @IsInt()
  @Min(1)
  columnsBlocks: number;

  @ApiPropertyOptional({ example: 'Standard room with central screen' })
  @IsString()
  @IsOptional()
  details?: string;
}
