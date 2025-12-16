import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: User = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: '$2b$10$hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockLoginResponse: LoginResponseDto = {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  };

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/login', () => {
    it('should return 200 with token when credentials are valid', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'john.doe@example.com',
        password: 'password123'
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(mockLoginResponse);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledTimes(1);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when user not found', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 401 when password incorrect', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'john.doe@example.com',
        password: 'wrongPassword'
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should validate DTO', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'john.doe@example.com',
        password: 'password123'
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toBeDefined();
      // La validación del DTO se hace automáticamente por NestJS
      // Si el DTO fuera inválido, la petición ni siquiera llegaría al método
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
    });
  });
});

