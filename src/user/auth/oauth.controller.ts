import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class OAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('github')
  githubLogin(@Res() res: Response) {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GITHUB_CALLBACK_URL');
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl!)}&scope=read:user`;
    res.redirect(url);
  }

  @Get('github/callback')
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    try {
      const token = await this.authService.githubCallback(code);
      res.redirect(`${frontendUrl}?token=${token}`);
    } catch {
      res.redirect(`${frontendUrl}?error=oauth_failed`);
    }
  }
}
