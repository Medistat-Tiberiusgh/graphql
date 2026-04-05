import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Region } from './region.model';
import { RegionsService } from './regions.service';

@Resolver(() => Region)
export class RegionsResolver {
  constructor(private readonly regionsService: RegionsService) {}

  @Query(() => [Region])
  async regions(): Promise<Region[]> {
    return this.regionsService.findAll();
  }

  @Query(() => Region)
  async region(
    @Args('regionId', { type: () => Int }) regionId: number,
  ): Promise<Region> {
    return this.regionsService.findOne(regionId);
  }
}
