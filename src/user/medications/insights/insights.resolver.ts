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
  AgeSplitPoint,
  DemographicCell,
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
  ): Promise<DrugInsights> {
    await this.insightsService.validateAtc(atcCode);
    return { atcCode };
  }

  @ResolveField(() => [RegionalStat])
  regionalPopularity(
    @Parent() ctx: DrugInsights,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
    @Args('gender', { type: () => Int, nullable: true }) gender?: number,
    @Args('ageGroup', { type: () => Int, nullable: true }) ageGroup?: number,
  ): Promise<RegionalStat[]> {
    return this.insightsService.getRegionalPopularity(ctx.atcCode, {
      year,
      gender,
      ageGroup,
    });
  }

  @ResolveField(() => [TrendPoint])
  trend(
    @Parent() ctx: DrugInsights,
    @Args('region', { type: () => Int, nullable: true }) region?: number,
    @Args('gender', { type: () => Int, nullable: true }) gender?: number,
    @Args('ageGroup', { type: () => Int, nullable: true }) ageGroup?: number,
  ): Promise<TrendPoint[]> {
    return this.insightsService.getTrend(ctx.atcCode, {
      region,
      gender,
      ageGroup,
    });
  }

  @ResolveField(() => [GenderSplitPoint])
  genderSplit(
    @Parent() ctx: DrugInsights,
    @Args('region', { type: () => Int, nullable: true }) region?: number,
    @Args('ageGroup', { type: () => Int, nullable: true }) ageGroup?: number,
  ): Promise<GenderSplitPoint[]> {
    return this.insightsService.getGenderSplit(ctx.atcCode, {
      region,
      ageGroup,
    });
  }

  @ResolveField(() => [AgeSplitPoint])
  ageSplit(
    @Parent() ctx: DrugInsights,
    @Args('region', { type: () => Int, nullable: true }) region?: number,
    @Args('gender', { type: () => Int, nullable: true }) gender?: number,
  ): Promise<AgeSplitPoint[]> {
    return this.insightsService.getAgeSplit(ctx.atcCode, { region, gender });
  }

  @ResolveField(() => [DemographicCell])
  demographicGrid(
    @Parent() ctx: DrugInsights,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
    @Args('region', { type: () => Int, nullable: true }) region?: number,
  ): Promise<DemographicCell[]> {
    return this.insightsService.getDemographicGrid(ctx.atcCode, {
      year,
      region,
    });
  }
}
