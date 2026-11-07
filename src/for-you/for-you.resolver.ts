import { Args, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/auth/jwt.guard';
import { Me } from '../user/me/me.model';
import {
  Changes,
  ComparisonItem,
  ForYou,
  GrowthItem,
  MostDispensedItem,
} from './for-you.model';
import { ForYouGroupInput } from './for-you-group.input';
import { ForYouService } from './for-you.service';

@Resolver(() => Me)
@UseGuards(JwtAuthGuard)
export class MeForYouResolver {
  constructor(private readonly forYouService: ForYouService) {}

  @ResolveField(() => ForYou, {
    nullable: true,
    description:
      'Highlights for `group`, or for the saved demographics when omitted; null when the group is empty',
  })
  forYou(
    @Parent() me: Me,
    @Args('group', { type: () => ForYouGroupInput, nullable: true })
    group?: ForYouGroupInput,
  ): Promise<ForYou | null> {
    if (!group) return this.forYouService.forDemographics(me);
    return this.forYouService.forExploredGroup({
      regionId: group.regionId ?? null,
      genderId: group.genderId ?? null,
      ageGroupId: group.ageGroupId ?? null,
    });
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

  @ResolveField(() => Changes, {
    description: 'Rising and declining drugs over the last 3, 5 or 10 years',
  })
  changes(
    @Parent() forYou: ForYou,
    @Args('years', { type: () => Int, defaultValue: 5 }) years: number,
  ): Changes {
    return this.forYouService.changesOver(forYou, years);
  }
}

@Resolver(() => Changes)
export class ChangesResolver {
  constructor(private readonly forYouService: ForYouService) {}

  @ResolveField(() => [GrowthItem])
  rising(
    @Parent() changes: Changes,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<GrowthItem[]> {
    return this.forYouService.rising(changes, limit);
  }

  @ResolveField(() => [GrowthItem])
  declining(
    @Parent() changes: Changes,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<GrowthItem[]> {
    return this.forYouService.declining(changes, limit);
  }
}
