import { Body, Controller, Param, Post } from '@nestjs/common';
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

  @Post(':provider/exchange')
  async exchange(
    @Param('provider') provider: string,
    @Body() body: ExchangeBody,
  ): Promise<{ token: string }> {
    const { code, codeVerifier, redirectUri } = body;
    if (!code || !codeVerifier || !redirectUri) {
      throw new AppError(
        'code, codeVerifier and redirectUri are required',
        'BAD_USER_INPUT',
      );
    }
    const token = await this.authService.oauthCallback(
      provider,
      code,
      codeVerifier,
      redirectUri,
    );
    return { token };
  }
}
