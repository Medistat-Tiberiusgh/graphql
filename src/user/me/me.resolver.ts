import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';
import { Me } from './me.model';
import { UsersService } from '../users/users.service';

@Resolver(() => Me)
@UseGuards(JwtAuthGuard)
export class MeResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => Me)
  async me(@CurrentUser() user: JwtPayload): Promise<Me> {
    const account = await this.usersService.findById(user.sub);
    const result = new Me();
    result.userId = user.sub;
    result.regionId = account?.region_id ?? null;
    result.genderId = account?.gender_id ?? null;
    result.ageGroupId = account?.age_group_id ?? null;
    return result;
  }

  @ResolveField(() => [String])
  providers(@Parent() parent: Me): Promise<string[]> {
    return this.usersService.findProvidersByUserId(parent.userId);
  }
}
