export class SignupResponseDto {
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  token: string;
}
