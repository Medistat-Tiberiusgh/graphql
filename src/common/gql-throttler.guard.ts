import { ExecutionContext, Injectable, UseGuards, applyDecorators } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const { req, res } = ctx.getContext<{ req: Request; res: Response }>();
    return { req, res };
  }
}

export const AuthRateLimit = () =>
  applyDecorators(
    UseGuards(GqlThrottlerGuard),
    Throttle({ default: { ttl: 60000, limit: 5 } }),
  );
