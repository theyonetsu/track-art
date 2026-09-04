import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: { email: string; password: string; name?: string; studioName?: string; phone?: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req, @Body() body: { current: string; next: string }) {
    return this.authService.changePassword(req.user.sub, body.current, body.next);
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup-2fa')
  setup2fa(@Req() req) { return this.authService.setupTotp(req.user.sub); }

  @UseGuards(JwtAuthGuard)
  @Post('verify-2fa')
  verify2fa(@Req() req, @Body() body: { token: string }) { return this.authService.verifyTotp(req.user.sub, body.token); }
}
