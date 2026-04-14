import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Args('confirm') confirm: boolean,
  ): Promise<boolean> {
    return this.authService.deleteAccount(user.sub, confirm);
  }
}
