import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  ForYou,
  MostDispensedItem,
  RisingItem,
  StandsOutItem,
} from './for-you.model';
import { ForYouService } from './for-you.service';

@Resolver(() => ForYou)
export class ForYouResolver {
  constructor(private readonly forYouService: ForYouService) {}

  @Query(() => ForYou, {
    description:
      'Highlights for a demographic group. Omitted fields fall back to the national totals.',
  })
  forYou(
    @Args('region', { type: () => Int, nullable: true }) region?: number,
    @Args('gender', { type: () => Int, nullable: true }) gender?: number,
    @Args('ageGroup', { type: () => Int, nullable: true }) ageGroup?: number,
  ): Promise<ForYou> {
    return this.forYouService.forProfile({ region, gender, ageGroup });
  }

  @ResolveField(() => [StandsOutItem])
  standsOut(
    @Parent() forYou: ForYou,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<StandsOutItem[]> {
    return this.forYouService.standsOut(forYou, limit);
  }

  @ResolveField(() => [MostDispensedItem])
  mostDispensed(
    @Parent() forYou: ForYou,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<MostDispensedItem[]> {
    return this.forYouService.mostDispensed(forYou, limit);
  }

  @ResolveField(() => [RisingItem])
  rising(
    @Parent() forYou: ForYou,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<RisingItem[]> {
    return this.forYouService.rising(forYou, limit);
  }
}
