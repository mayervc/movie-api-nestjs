import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  // Mock data
  const mockUser: User = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: '$2b$10$hashedPassword', // bcrypt hash
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn()
  };

  const mockJwtService = {
    sign: jest.fn()
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        }
      ]
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      // Arrange
      const email = 'john.doe@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithHashedPassword = {
        ...mockUser,
        password: hashedPassword
      };

      mockUsersService.findByEmail.mockResolvedValue(userWithHashedPassword);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(userWithHashedPassword);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockUsersService.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is incorrect', async () => {
      // Arrange
      const email = 'john.doe@example.com';
      const password = 'wrongPassword';
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      const userWithHashedPassword = {
        ...mockUser,
        password: hashedPassword
      };

      mockUsersService.findByEmail.mockResolvedValue(userWithHashedPassword);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe('login', () => {
    it('should generate JWT token on login', async () => {
      // Arrange
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const expectedPayload = {
        email: mockUser.email,
        sub: mockUser.id
      };

      mockJwtService.sign.mockReturnValue(expectedToken);

      // Act
      const result = await authService.login(mockUser);

      // Assert
      expect(result).toEqual({
        access_token: expectedToken
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User'
    };

    it('should create user and return token when signup is successful', async () => {
      // Arrange
      const createdUser: User = {
        id: 2,
        email: signupDto.email,
        password: '$2b$10$hashedPassword',
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const expectedPayload = {
        email: createdUser.email,
        sub: createdUser.id
      };

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(expectedToken);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('$2b$10$hashedPassword' as never);

      // Act
      const result = await authService.signup(signupDto);

      // Assert
      expect(result).toEqual({
        user: {
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName
        },
        token: expectedToken
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: signupDto.email,
        password: '$2b$10$hashedPassword',
        firstName: signupDto.firstName,
        lastName: signupDto.lastName
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect('password' in result.user).toBe(false);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const conflictError = new ConflictException('Email already exists');
      mockUsersService.create.mockRejectedValue(conflictError);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('$2b$10$hashedPassword' as never);

      // Act & Assert
      await expect(authService.signup(signupDto)).rejects.toThrow(
        ConflictException
      );
      await expect(authService.signup(signupDto)).rejects.toThrow(
        'Email already exists'
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      // Arrange
      const createdUser: User = {
        id: 2,
        email: signupDto.email,
        password: '$2b$10$hashedPassword',
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const hashedPassword = '$2b$10$hashedPassword123';

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('token');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      // Act
      await authService.signup(signupDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword
        })
      );
      expect(mockUsersService.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          password: signupDto.password
        })
      );
    });

    it('should generate JWT token correctly', async () => {
      // Arrange
      const createdUser: User = {
        id: 2,
        email: signupDto.email,
        password: '$2b$10$hashedPassword',
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const expectedPayload = {
        email: createdUser.email,
        sub: createdUser.id
      };

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(expectedToken);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('$2b$10$hashedPassword' as never);

      // Act
      const result = await authService.signup(signupDto);

      // Assert
      expect(result.token).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('should return user without password in response', async () => {
      // Arrange
      const createdUser: User = {
        id: 2,
        email: signupDto.email,
        password: '$2b$10$hashedPassword',
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('token');
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('$2b$10$hashedPassword' as never);

      // Act
      const result = await authService.signup(signupDto);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(createdUser.email);
      expect(result.user.firstName).toBe(createdUser.firstName);
      expect(result.user.lastName).toBe(createdUser.lastName);
      expect('password' in result.user).toBe(false);
    });
  });
});
