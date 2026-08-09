import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth') // Sets route to /api/v1/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

 @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return { success: true, data: user };
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto, 
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(loginDto);

    // Set HTTP-Only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true, // Prevents JavaScript from reading the cookie (XSS protection)
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.authService.getProfile(user.sub);
    return { success: true, data: profile };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.authService.logout(user.sub);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { success: true, message: 'Logged out successfully' };
  }
}