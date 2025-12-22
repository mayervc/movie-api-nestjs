import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { LoginResponseDto } from './dto/login-response.dto';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private generateToken(user: User): string {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async login(user: User): Promise<LoginResponseDto> {
    return {
      access_token: this.generateToken(user)
    };
  }

  async signup(signupDto: SignupDto): Promise<SignupResponseDto> {
    // Hashear la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // Crear el usuario con el password hasheado y rol por defecto 'user'
    const user = await this.usersService.create({
      email: signupDto.email,
      password: hashedPassword,
      firstName: signupDto.firstName,
      lastName: signupDto.lastName,
      role: UserRole.USER
    });

    // Generar JWT token
    const token = this.generateToken(user);

    // Retornar respuesta sin password
    return {
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    };
  }
}
