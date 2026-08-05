import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    // 1. Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // 2. Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // 3. Save the user
    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
    });

    // 4. Return user without the password field
    const { password, ...userWithoutPassword } = user;
    return {
      success: true,
      data: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    // 1. Find user
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generate tokens
    const payload = { sub: user.id, email: user.email };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m', // Short lived
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d', // Longer lived
    });

    // 4. Hash the refresh token before saving to database (Security best practice!)
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    // 5. Save session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        expiresAt,
      },
    });

    const { password, ...userWithoutPassword } = user;

    // 6. Return tokens and user
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async logout(userId: string) {
    // For now, we delete all active sessions for this user (Logout All Devices)
    // Later we can target specific sessions if needed.
    await this.prisma.session.deleteMany({
      where: { userId },
    });
    return { success: true };
  }
}
