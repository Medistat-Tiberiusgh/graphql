import { UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import {
  DrugInsights,
  GenderSplitPoint,
  RegionalStat,
  TrendPoint,
} from './insights.model';
import { InsightsService } from './insights.service';

@Resolver(() => DrugInsights)
@UseGuards(JwtAuthGuard)
export class InsightsResolver {
  constructor(private readonly insightsService: InsightsService) {}

  @Query(() => DrugInsights)
  async drugInsights(
    @Args('atcCode') atcCode: string,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
    @Args('region', { type: () => Int, nullable: true }) region?: number,
    @Args('gender', { type: () => Int, nullable: true }) gender?: number,
    @Args('ageGroup', { type: () => Int, nullable: true }) ageGroup?: number,
  ): Promise<Partial<DrugInsights>> {
    await this.insightsService.validateInputs(atcCode, { year, region, gender, ageGroup });
    return { atcCode, year, region, gender, ageGroup };
  }

  @ResolveField(() => [RegionalStat])
  regionalPopularity(
    @Parent() ctx: DrugInsights,
  ): Promise<RegionalStat[]> {
    return this.insightsService.getRegionalPopularity(ctx.atcCode!, {
      year: ctx.year,
      region: ctx.region,
      gender: ctx.gender,
      ageGroup: ctx.ageGroup,
    });
  }

  @ResolveField(() => [TrendPoint])
  trend(@Parent() ctx: DrugInsights): Promise<TrendPoint[]> {
    return this.insightsService.getTrend(ctx.atcCode!, {
      year: ctx.year,
      region: ctx.region,
      gender: ctx.gender,
      ageGroup: ctx.ageGroup,
    });
  }

  @ResolveField(() => [GenderSplitPoint])
  genderSplit(@Parent() ctx: DrugInsights): Promise<GenderSplitPoint[]> {
    return this.insightsService.getGenderSplit(ctx.atcCode!, {
      year: ctx.year,
      region: ctx.region,
      gender: ctx.gender,
      ageGroup: ctx.ageGroup,
    });
  }

  @ResolveField(() => Number)
  chronicUseRatio(@Parent() ctx: DrugInsights): Promise<number> {
    return this.insightsService.getChronicUseRatio(ctx.atcCode!, {
      year: ctx.year,
      region: ctx.region,
      gender: ctx.gender,
      ageGroup: ctx.ageGroup,
    });
  }
}
