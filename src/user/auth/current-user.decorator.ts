import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface JwtPayload {
  sub: string;
  username: string;
  regionId: number | null;
  genderId: number | null;
  ageGroupId: number | null;
  avatarUrl: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user as JwtPayload;
  },
);
