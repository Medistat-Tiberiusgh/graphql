import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';
import { Me } from './me.model';
import { UpdateProfileInput } from './update-profile.input';
import { UsersService, type User } from '../users/users.service';

function toMe(userId: string, account: User | undefined): Me {
  const result = new Me();
  result.userId = userId;
  result.regionId = account?.region_id ?? null;
  result.genderId = account?.gender_id ?? null;
  result.ageGroupId = account?.age_group_id ?? null;
  return result;
}

@Resolver(() => Me)
@UseGuards(JwtAuthGuard)
export class MeResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => Me)
  async me(@CurrentUser() user: JwtPayload): Promise<Me> {
    const account = await this.usersService.findById(user.sub);
    return toMe(user.sub, account);
  }

  @Mutation(() => Me)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: UpdateProfileInput,
  ): Promise<Me> {
    const account = await this.usersService.updateProfile(user.sub, {
      regionId: input.regionId ?? null,
      genderId: input.genderId ?? null,
      ageGroupId: input.ageGroupId ?? null,
    });
    return toMe(user.sub, account);
  }

  @ResolveField(() => [String])
  providers(@Parent() parent: Me): Promise<string[]> {
    return this.usersService.findProvidersByUserId(parent.userId);
  }
}
