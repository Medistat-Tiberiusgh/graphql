import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../../common/app-error';
import { ExternalIdentity, OAuthProvider } from './oauth-provider.interface';

interface GithubProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

@Injectable()
export class GithubProvider implements OAuthProvider {
  readonly name = 'github';

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
    const profile = await this.fetchProfile(accessToken);
    const primaryEmail = await this.fetchPrimaryEmail(accessToken);

    return {
      providerUid: String(profile.id),
      email: primaryEmail.email,
      emailVerified: primaryEmail.verified,
      displayName: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url,
    };
  }

  private async exchangeCodeForAccessToken(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<string> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.configService.get<string>('GITHUB_CLIENT_ID'),
        client_secret: this.configService.get<string>('GITHUB_CLIENT_SECRET'),
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    });
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new AppError('GitHub OAuth failed', 'UNAUTHENTICATED');
    }
    return data.access_token;
  }

  private async fetchProfile(accessToken: string): Promise<GithubProfile> {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'medistat-api',
      },
    });
    return res.json() as Promise<GithubProfile>;
  }

  // GitHub omits a private email from /user, so the primary email comes from /user/emails — which requires the `user:email` OAuth scope. Without that scope GitHub returns an error object (not an array), so guard the shape and give a clear message instead of crashing on `.find`.
  private async fetchPrimaryEmail(
    accessToken: string,
  ): Promise<{ email: string; verified: boolean }> {
    const res = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'medistat-api',
      },
    });
    const emails = (await res.json()) as unknown;
    if (!Array.isArray(emails)) {
      throw new AppError(
        'Could not read your GitHub email. The app needs the user:email scope.',
        'BAD_USER_INPUT',
      );
    }

    const verifiedEmails = emails as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary = verifiedEmails.find((e) => e.primary);
    if (!primary) {
      throw new AppError(
        'GitHub account has no primary email',
        'BAD_USER_INPUT',
      );
    }
    return { email: primary.email, verified: primary.verified };
  }
}
