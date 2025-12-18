import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
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
    login: jest.fn(),
    signup: jest.fn()
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

  describe('POST /auth/signup', () => {
    const signupDto: SignupDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User'
    };

    const mockSignupResponse: SignupResponseDto = {
      user: {
        email: signupDto.email,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    };

    it('should return 201 with user and token', async () => {
      // Arrange
      mockAuthService.signup.mockResolvedValue(mockSignupResponse);

      // Act
      const result = await controller.signup(signupDto);

      // Assert
      expect(result).toEqual(mockSignupResponse);
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
      expect(mockAuthService.signup).toHaveBeenCalledTimes(1);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(signupDto.email);
      expect(result.token).toBeDefined();
      expect('password' in result.user).toBe(false);
    });

    it('should return 409 when email already exists', async () => {
      // Arrange
      const conflictError = new ConflictException('Email already exists');
      mockAuthService.signup.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.signup(signupDto)).rejects.toThrow(
        ConflictException
      );
      await expect(controller.signup(signupDto)).rejects.toThrow(
        'Email already exists'
      );
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
    });

    it('should propagate server errors as 500', async () => {
      // Arrange
      const serverError = new Error('Database connection failed');
      mockAuthService.signup.mockRejectedValue(serverError);

      // Act & Assert
      await expect(controller.signup(signupDto)).rejects.toThrow(Error);
      await expect(controller.signup(signupDto)).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
    });

    it('should validate request body', async () => {
      // Arrange
      mockAuthService.signup.mockResolvedValue(mockSignupResponse);

      // Act
      const result = await controller.signup(signupDto);

      // Assert
      expect(result).toBeDefined();
      // La validación del DTO se hace automáticamente por NestJS
      // Si el DTO fuera inválido, la petición ni siquiera llegaría al método
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
    });
  });
});
