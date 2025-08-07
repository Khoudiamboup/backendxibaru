import { Controller, Post, Body, Get, UseGuards, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { IsEmail, IsString, MinLength } from 'class-validator';

// DTO pour la validation
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginDto) {
    console.log('Données reçues:', loginDto); // Debug log
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    console.log('User dans req:', req.user); // Debug log
    return req.user;
  }
}
