import { Args, Query, Resolver } from '@nestjs/graphql';
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
  async region(@Args('regionCode') regionCode: string): Promise<Region> {
    return this.regionsService.findOne(regionCode);
  }
}
