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

  @Query(() => AgeGroup, { nullable: true })
  async ageGroup(@Args('id', { type: () => Int }) id: number): Promise<AgeGroup | undefined> {
    return this.ageGroupsService.findOne(id);
  }
}
