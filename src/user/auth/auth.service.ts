import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, User } from '../users/users.service';
import { AppError } from '../../common/app-error';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private signToken(
    user: User,
    displayName: string,
    avatarUrl: string | null = null,
  ): string {
    return this.jwtService.sign({
      sub: user.id,
      username: displayName,
      regionId: user.region_id,
      genderId: user.gender_id,
      ageGroupId: user.age_group_id,
      avatarUrl,
    });
  }

  // Resolves the local user for an external login. We trust the provider's
  // verified-email claim, so a new provider can be linked to an existing
  // account that shares the same verified email.
  private async resolveUser(params: {
    provider: string;
    providerUid: string;
    email: string;
    emailVerified: boolean;
  }): Promise<User> {
    const { provider, providerUid, email, emailVerified } = params;

    const byIdentity = await this.usersService.findByProviderIdentity(
      provider,
      providerUid,
    );
    if (byIdentity) return byIdentity;

    if (emailVerified) {
      const byEmail = await this.usersService.findByEmail(email);
      if (byEmail) {
        await this.usersService.linkIdentity(byEmail.id, provider, providerUid);
        return byEmail;
      }
    }

    return this.usersService.createWithIdentity({
      email,
      emailVerified,
      provider,
      providerUid,
    });
  }

  async githubCallback(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<string> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        }),
      },
    );
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      throw new AppError('GitHub OAuth failed', 'UNAUTHENTICATED');
    }

    const profile = await this.fetchGithubProfile(tokenData.access_token);
    const primaryEmail = await this.fetchGithubPrimaryEmail(
      tokenData.access_token,
    );

    const user = await this.resolveUser({
      provider: 'github',
      providerUid: String(profile.id),
      email: primaryEmail.email,
      emailVerified: primaryEmail.verified,
    });

    return this.signToken(
      user,
      profile.name ?? profile.login,
      profile.avatar_url,
    );
  }

  private async fetchGithubProfile(accessToken: string): Promise<{
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
  }> {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'medistat-api',
      },
    });
    return res.json() as Promise<{
      id: number;
      login: string;
      name: string | null;
      avatar_url: string;
    }>;
  }

  // GitHub omits a private email from /user, so the primary verified email must
  // be read from /user/emails (requires the `user:email` OAuth scope).
  private async fetchGithubPrimaryEmail(
    accessToken: string,
  ): Promise<{ email: string; verified: boolean }> {
    const res = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'medistat-api',
      },
    });
    const emails = (await res.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;

    const primary = emails.find((e) => e.primary);
    if (!primary) {
      throw new AppError(
        'GitHub account has no primary email',
        'BAD_USER_INPUT',
      );
    }
    return { email: primary.email, verified: primary.verified };
  }

  // Test-only auth seam: lets the CI integration suite obtain a JWT without a real OIDC round-trip. Disabled in production so it can never be a backdoor — real sign-in there is OAuth-only.
  async ciToken(
    providedSecret: string | undefined,
    username: string | undefined,
  ): Promise<string> {
    if (this.configService.get<string>('NODE_ENV') === 'prod') {
      throw new AppError(
        'CI token issuance is disabled in production',
        'FORBIDDEN',
      );
    }
    const expected = this.configService.get<string>('CI_AUTH_SECRET');
    if (!expected || !providedSecret || providedSecret !== expected) {
      throw new AppError('Invalid CI credentials', 'UNAUTHENTICATED');
    }
    if (!username) {
      throw new AppError('username is required', 'BAD_USER_INPUT');
    }

    const user = await this.resolveUser({
      provider: 'ci',
      providerUid: username,
      email: `${username}@ci.local`,
      emailVerified: true,
    });
    return this.signToken(user, username);
  }

  async deleteAccount(userId: string, confirm: boolean): Promise<boolean> {
    if (!confirm) {
      throw new AppError(
        'You must set confirm to true to delete your account',
        'BAD_USER_INPUT',
      );
    }
    const deleted = await this.usersService.delete(userId);
    if (!deleted) {
      throw new AppError('User not found', 'NOT_FOUND');
    }
    return true;
  }
}
