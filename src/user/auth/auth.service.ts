import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AppError } from '../../common/app-error';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private signToken(user: {
    id: string;
    username: string;
    region_id: number | null;
    gender_id: number | null;
    age_group_id: number | null;
    avatarUrl?: string;
  }): string {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
      regionId: user.region_id,
      genderId: user.gender_id,
      ageGroupId: user.age_group_id,
      avatarUrl: user.avatarUrl ?? null,
    });
  }

  async githubCallback(code: string): Promise<string> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      throw new AppError('GitHub OAuth failed', 'UNAUTHENTICATED');
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'medistat-api' },
    });
    const profile = await profileRes.json() as { id: number; login: string; name: string | null; avatar_url: string };

    const githubId = String(profile.id);
    let user = await this.usersService.findByGithubId(githubId);

    if (!user) {
      let username = profile.login;
      const existing = await this.usersService.findByUsername(username);
      if (existing) {
        username = `${username}_${githubId}`;
      }
      user = await this.usersService.createFromGithub(githubId, username);
    }

    return this.signToken({ ...user, username: profile.name ?? profile.login, avatarUrl: profile.avatar_url });
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
