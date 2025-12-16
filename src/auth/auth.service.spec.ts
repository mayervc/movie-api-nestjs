import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
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
    findByEmail: jest.fn()
  };

  const mockJwtService = {
    sign: jest.fn()
  };

  beforeEach(async () => {
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

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      const result = await service.validateUser(email, password);

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
      const result = await service.validateUser(email, password);

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
      const result = await service.validateUser(email, password);

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
      const result = await service.login(mockUser);

      // Assert
      expect(result).toEqual({
        access_token: expectedToken
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });
  });
});

