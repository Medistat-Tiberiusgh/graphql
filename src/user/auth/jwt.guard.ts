import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AppError } from '../../common/app-error';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError('No token provided', 'UNAUTHENTICATED');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new AppError('Invalid token format', 'UNAUTHENTICATED');
    }

    try {
      req.user = this.jwtService.verify(token);
      return true;
    } catch {
      throw new AppError('Invalid or expired token', 'UNAUTHENTICATED');
    }
  }
}
