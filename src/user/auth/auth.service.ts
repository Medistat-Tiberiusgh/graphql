import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, User } from '../users/users.service';
import { AppError } from '../../common/app-error';
import { OAuthProvider } from './providers/oauth-provider.interface';
import { GithubProvider } from './providers/github.provider';
import { GoogleProvider } from './providers/google.provider';

type LoginIdentity = {
  provider: string;
  providerUid: string;
  email: string;
  emailVerified: boolean;
};

@Injectable()
export class AuthService {
  private readonly providers: Map<string, OAuthProvider>;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    githubProvider: GithubProvider,
    googleProvider: GoogleProvider,
  ) {
    const providers: OAuthProvider[] = [githubProvider, googleProvider];
    this.providers = new Map(
      providers.map((provider) => [provider.name, provider]),
    );
  }

  // Completes an OAuth login for any registered provider: exchange the code for a normalized identity, resolve it to a local user, then issue our JWT.
  async oauthCallback(
    providerName: string,
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<string> {
    const provider = this.requireProvider(providerName);
    const identity = await provider.exchangeCode(code, codeVerifier, redirectUri);
    const user = await this.resolveUser({
      provider: provider.name,
      providerUid: identity.providerUid,
      email: identity.email,
      emailVerified: identity.emailVerified,
    });
    return this.signToken(user, identity.displayName, identity.avatarUrl);
  }

  async linkProvider(
    userId: string,
    providerName: string,
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<void> {
    const provider = this.requireProvider(providerName);
    const identity = await provider.exchangeCode(code, codeVerifier, redirectUri);
    await this.attachIdentityToUser(userId, provider.name, identity.providerUid);
  }

  private async attachIdentityToUser(
    userId: string,
    provider: string,
    providerUid: string,
  ): Promise<void> {
    const owner = await this.usersService.findByProviderIdentity(
      provider,
      providerUid,
    );
    if (!owner) {
      await this.usersService.linkIdentity(userId, provider, providerUid);
      return;
    }
    if (owner.id === userId) return;
    await this.usersService.mergeAccounts(userId, owner.id);
  }

  private requireProvider(providerName: string): OAuthProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new AppError(
        `Unknown auth provider: ${providerName}`,
        'BAD_USER_INPUT',
      );
    }
    return provider;
  }

  private signToken(
    user: User,
    displayName: string,
    avatarUrl: string | null,
  ): string {
    return this.jwtService.sign({
      sub: user.id,
      username: displayName,
      email: user.email,
      avatarUrl,
    });
  }

  private async resolveUser(identity: LoginIdentity): Promise<User> {
    const linkedToIdentity = await this.usersService.findByProviderIdentity(
      identity.provider,
      identity.providerUid,
    );
    if (linkedToIdentity) return linkedToIdentity;

    const linkedByEmail = await this.linkToExistingAccount(identity);
    if (linkedByEmail) return linkedByEmail;

    return this.usersService.createWithIdentity(identity);
  }

  // We trust the provider's verified-email claim, so a login can adopt an
  // existing account that shares the same verified email.
  private async linkToExistingAccount(
    identity: LoginIdentity,
  ): Promise<User | undefined> {
    if (!identity.emailVerified) return undefined;

    const account = await this.usersService.findByEmail(identity.email);
    if (!account) return undefined;

    await this.usersService.linkIdentity(
      account.id,
      identity.provider,
      identity.providerUid,
    );
    return account;
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
    return this.signToken(user, username, null);
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
