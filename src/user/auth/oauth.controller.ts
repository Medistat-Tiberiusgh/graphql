import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AppError } from '../../common/app-error';

interface ExchangeBody {
  code?: string;
  codeVerifier?: string;
  redirectUri?: string;
}

@Controller('auth')
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('github/exchange')
  async githubExchange(@Body() body: ExchangeBody): Promise<{ token: string }> {
    const { code, codeVerifier, redirectUri } = body;
    if (!code || !codeVerifier || !redirectUri) {
      throw new AppError(
        'code, codeVerifier and redirectUri are required',
        'BAD_USER_INPUT',
      );
    }
    const token = await this.authService.githubCallback(
      code,
      codeVerifier,
      redirectUri,
    );
    return { token };
  }
}
