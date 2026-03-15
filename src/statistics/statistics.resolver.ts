import {
  Args,
  ID,
  Int,
  Query,
  ResolveField,
  Resolver,
  Parent,
} from '@nestjs/graphql';
import { Statistic, StatisticsConnection } from './statistics.model';
import { StatisticsService } from './statistics.service';
import { StatisticsDataLoaders } from './statistics.dataloaders';
import { AgeGroup } from '../age-groups/age-group.model';
import { Drug } from '../drugs/drug.model';
import { Gender } from '../genders/gender.model';
import { Region } from '../regions/region.model';

@Resolver(() => Statistic)
export class StatisticsResolver {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly loaders: StatisticsDataLoaders,
  ) {}

  @ResolveField(() => ID)
  id(@Parent() statistic: Statistic): string {
    return Buffer.from(
      `${statistic.year}:${statistic.region}:${statistic.atcCode}:${statistic.gender}:${statistic.ageGroup}`,
    ).toString('base64');
  }

  @ResolveField(() => Drug, { nullable: true })
  async drugData(@Parent() statistic: Statistic): Promise<Drug | undefined> {
    return this.loaders.drugByAtcCode.load(statistic.atcCode);
  }

  @ResolveField(() => AgeGroup, { nullable: true })
  async ageGroupData(
    @Parent() statistic: Statistic,
  ): Promise<AgeGroup | undefined> {
    return this.loaders.ageGroupById.load(String(statistic.ageGroup));
  }

  @ResolveField(() => Gender, { nullable: true })
  async genderData(
    @Parent() statistic: Statistic,
  ): Promise<Gender | undefined> {
    return this.loaders.genderById.load(String(statistic.gender));
  }

  @ResolveField(() => Region, { nullable: true })
  async regionData(
    @Parent() statistic: Statistic,
  ): Promise<Region | undefined> {
    return this.loaders.regionById.load(String(statistic.region));
  }

  @Query(() => StatisticsConnection)
  async statistics(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
    @Args('region', { type: () => Int, nullable: true }) region?: number,
    @Args('atcCode', { nullable: true }) atcCode?: string,
    @Args('gender', { type: () => Int, nullable: true }) gender?: number,
    @Args('ageGroup', { type: () => Int, nullable: true }) ageGroup?: number,
  ): Promise<StatisticsConnection> {
    return this.statisticsService.findAll(limit, offset, {
      year,
      region,
      atcCode,
      gender,
      ageGroup,
    });
  }

  @Query(() => Statistic, { nullable: true })
  async statistic(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Statistic | undefined> {
    const [year, region, atcCode, gender, ageGroup] = Buffer.from(id, 'base64')
      .toString()
      .split(':');
    return this.statisticsService.findOne(
      +year,
      +region,
      atcCode,
      +gender,
      +ageGroup,
    );
  }
}
