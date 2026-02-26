import { UserRole } from '../enums/user-role.enum';

export class UserResponseDto {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
