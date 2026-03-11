import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthPayload } from './auth.model';
import { AppError } from '../common/app-error';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string): Promise<AuthPayload> {
    if (!username || username.trim().length === 0) {
      throw new AppError(
        'You forgot to provide the username',
        'BAD_USER_INPUT',
      );
    }
    if (username.length > 50) {
      throw new AppError(
        'No weird and long usernames. Pick one that is under 50 characters',
        'BAD_USER_INPUT',
      );
    }
    if (password.length < 6) {
      throw new AppError(
        'Password must be at least 6 characters',
        'BAD_USER_INPUT',
      );
    }
    if (password.length > 100) {
      throw new AppError(
        'Password must not exceed 100 characters',
        'BAD_USER_INPUT',
      );
    }

    const existing = await this.usersService.findByUsername(username);
    if (existing) {
      throw new AppError('Username already taken', 'CONFLICT');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(username, passwordHash);

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });
    return { token, username: user.username };
  }

  async login(username: string, password: string): Promise<AuthPayload> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new AppError('Invalid credentials', 'UNAUTHENTICATED');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid credentials', 'UNAUTHENTICATED');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });
    return { token, username: user.username };
  }
}
