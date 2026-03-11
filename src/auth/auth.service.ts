import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthPayload } from './auth.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string): Promise<AuthPayload> {
    const existing = await this.usersService.findByUsername(username);
    if (existing) {
      throw new ConflictException('Username already taken');
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });
    return { token, username: user.username };
  }
}
