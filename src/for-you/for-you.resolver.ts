import { Args, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/auth/jwt.guard';
import { Me } from '../user/me/me.model';
import {
  ComparisonItem,
  ForYou,
  GrowthItem,
  MostDispensedItem,
} from './for-you.model';
import { ForYouService } from './for-you.service';

@Resolver(() => Me)
@UseGuards(JwtAuthGuard)
export class MeForYouResolver {
  constructor(private readonly forYouService: ForYouService) {}

  @ResolveField(() => ForYou, {
    nullable: true,
    description:
      "Highlights for the signed-in user's saved demographics; null when none are saved",
  })
  forYou(@Parent() me: Me): Promise<ForYou | null> {
    return this.forYouService.forDemographics(me);
  }
}

@Resolver(() => ForYou)
export class ForYouResolver {
  constructor(private readonly forYouService: ForYouService) {}

  @ResolveField(() => [ComparisonItem], {
    description: 'Drugs dispensed most above the comparedWith rate',
  })
  moreCommon(
    @Parent() forYou: ForYou,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<ComparisonItem[]> {
    return this.forYouService.moreCommon(forYou, limit);
  }

  @ResolveField(() => [ComparisonItem], {
    description: 'Drugs dispensed most below the comparedWith rate',
  })
  lessCommon(
    @Parent() forYou: ForYou,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<ComparisonItem[]> {
    return this.forYouService.lessCommon(forYou, limit);
  }

  @ResolveField(() => [MostDispensedItem])
  mostDispensed(
    @Parent() forYou: ForYou,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<MostDispensedItem[]> {
    return this.forYouService.mostDispensed(forYou, limit);
  }

  @ResolveField(() => [GrowthItem])
  rising(
    @Parent() forYou: ForYou,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<GrowthItem[]> {
    return this.forYouService.rising(forYou, limit);
  }

  @ResolveField(() => [GrowthItem])
  declining(
    @Parent() forYou: ForYou,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<GrowthItem[]> {
    return this.forYouService.declining(forYou, limit);
  }
}
