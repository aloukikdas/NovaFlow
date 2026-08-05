import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Extract the token from the HTTP-only cookie
    const token = request.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      // Verify the token using our secret
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      
      // Attach the payload to the request object so the controller can use it
      (request as any).user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
    return true;
  }
}