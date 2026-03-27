import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateRoomSeatDto {
  @ApiProperty({ example: 'A', description: 'Row label for the seat' })
  @IsString()
  @MinLength(1)
  seatRowLabel: string;

  @ApiProperty({ example: 1, description: 'Row number of the seat' })
  @IsInt()
  @Min(1)
  seatRow: number;

  @ApiProperty({ example: 1, description: 'Column label number of the seat' })
  @IsInt()
  @Min(1)
  seatColumnLabel: number;

  @ApiProperty({ example: 1, description: 'Column number of the seat' })
  @IsInt()
  @Min(1)
  seatColumn: number;

  @ApiProperty({ example: 1, description: 'Room ID the seat belongs to' })
  @IsInt()
  @Min(1)
  roomId: number;
}
