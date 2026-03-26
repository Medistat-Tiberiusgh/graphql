import {
  ExecutionContext,
  Injectable,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AppError } from './app-error';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const { req, res } = ctx.getContext<{ req: Request; res: Response }>();
    return { req, res };
  }

  protected throwThrottlingException(): Promise<void> {
    throw new AppError(
      'Too many requests, please try again later.',
      'TOO_MANY_REQUESTS',
    );
  }
}

export const AuthRateLimit = () =>
  applyDecorators(
    UseGuards(GqlThrottlerGuard),
    Throttle({
      default: { ttl: 60000, limit: process.env.NODE_ENV === 'prod' ? 5 : 50 },
    }),
  );
