import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../../common/app-error';
import { ExternalIdentity, OAuthProvider } from './oauth-provider.interface';

// Google's OIDC userinfo response (scopes: openid email profile).
interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string | null;
  picture: string | null;
}

@Injectable()
export class GoogleProvider implements OAuthProvider {
  readonly name = 'google';
  private readonly logger = new Logger(GoogleProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async exchangeCode(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<ExternalIdentity> {
    const accessToken = await this.exchangeCodeForAccessToken(
      code,
      codeVerifier,
      redirectUri,
    );
    const profile = await this.fetchUserInfo(accessToken);

    return {
      providerUid: profile.sub,
      email: profile.email,
      emailVerified: Boolean(profile.email_verified),
      displayName: profile.name ?? profile.email,
      avatarUrl: profile.picture,
    };
  }

  private async exchangeCodeForAccessToken(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<string> {
    // Google's token endpoint expects form-encoded data, not JSON.
    const body = new URLSearchParams({
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      client_secret:
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!data.access_token) {
      // Surface Google's real reason server-side — invalid_client, redirect_uri_mismatch, etc. — so a failed sign-in isn't an opaque 500.
      this.logger.error(
        `Google token exchange failed (${res.status}): ${data.error ?? 'unknown'} — ${data.error_description ?? ''}`,
      );
      throw new AppError('Google OAuth failed', 'UNAUTHENTICATED');
    }
    return data.access_token;
  }

  // The access token from a direct, TLS-protected token exchange is trusted, so reading /userinfo with it needs no extra signature verification.
  private async fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const res = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok) {
      throw new AppError('Could not read Google profile', 'UNAUTHENTICATED');
    }
    return res.json() as Promise<GoogleUserInfo>;
  }
}
