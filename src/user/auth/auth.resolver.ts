import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload } from './auth.model';
import { JwtAuthGuard } from './jwt.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload, {
    description:
      'Valid values for regionId, genderId and ageGroupId are listed at https://cu1114.camp.lnu.se/docs/schema/reference-data',
  })
  async register(
    @Args('username') username: string,
    @Args('password') password: string,
    @Args('regionId', { type: () => Int }) regionId: number,
    @Args('genderId', { type: () => Int }) genderId: number,
    @Args('ageGroupId', { type: () => Int }) ageGroupId: number,
  ): Promise<AuthPayload> {
    return this.authService.register(
      username,
      password,
      regionId,
      genderId,
      ageGroupId,
    );
  }

  @Mutation(() => AuthPayload)
  async login(
    @Args('username') username: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    return this.authService.login(username, password);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Args('confirm') confirm: boolean,
  ): Promise<boolean> {
    return this.authService.deleteAccount(user.sub, confirm);
  }
}
