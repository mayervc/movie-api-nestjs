import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateRoomBlockDto {
  @ApiProperty({ example: 5, description: 'Number of seat rows in the block' })
  @IsInt()
  @Min(1)
  rowSeats: number;

  @ApiProperty({
    example: 8,
    description: 'Number of seat columns in the block'
  })
  @IsInt()
  @Min(1)
  columnsSeats: number;

  @ApiProperty({ example: 1, description: 'Block row position in the room' })
  @IsInt()
  @Min(1)
  blockRow: number;

  @ApiProperty({
    example: 1,
    description: 'Block column position in the room'
  })
  @IsInt()
  @Min(1)
  blockColumn: number;
}
