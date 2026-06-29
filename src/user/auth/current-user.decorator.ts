import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user as JwtPayload;
  },
);
