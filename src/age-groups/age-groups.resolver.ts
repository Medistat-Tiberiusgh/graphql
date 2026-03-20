import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { AgeGroup } from './age-group.model';
import { AgeGroupsService } from './age-groups.service';

@Resolver(() => AgeGroup)
export class AgeGroupsResolver {
  constructor(private readonly ageGroupsService: AgeGroupsService) {}

  @Query(() => [AgeGroup])
  async ageGroups(): Promise<AgeGroup[]> {
    return this.ageGroupsService.findAll();
  }

  @Query(() => AgeGroup)
  async ageGroup(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AgeGroup> {
    return this.ageGroupsService.findOne(id);
  }
}
