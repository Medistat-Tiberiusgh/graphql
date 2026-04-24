import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';
import { Me, UserMedication } from './medication.model';
import { UserMedicationsService } from './medications.service';
import { Drug } from '../../drugs/drug.model';
import { DrugsDataLoaders } from '../../drugs/drugs.dataloaders';

@Resolver(() => Me)
@UseGuards(JwtAuthGuard)
export class UserMedicationsResolver {
  constructor(private readonly service: UserMedicationsService) {}

  @Query(() => Me)
  me(@CurrentUser() user: JwtPayload): Me {
    const result = new Me();
    result.userId = user.sub;
    return result;
  }

  @ResolveField(() => [UserMedication])
  medications(@Parent() parent: Me): Promise<UserMedication[]> {
    return this.service.findAllForUser(parent.userId);
  }

  @Mutation(() => UserMedication)
  addMedication(
    @CurrentUser() user: JwtPayload,
    @Args('atc') atc: string,
    @Args('notes', { nullable: true }) notes?: string,
  ): Promise<UserMedication> {
    return this.service.add(user.sub, atc, notes);
  }

  @Mutation(() => UserMedication)
  updateMedication(
    @CurrentUser() user: JwtPayload,
    @Args('atc') atc: string,
    @Args('notes', { nullable: true }) notes?: string,
  ): Promise<UserMedication> {
    return this.service.update(user.sub, atc, notes ?? null);
  }

  @Mutation(() => String)
  removeMedication(
    @CurrentUser() user: JwtPayload,
    @Args('atc') atc: string,
  ): Promise<string> {
    return this.service.remove(user.sub, atc);
  }
}

@Resolver(() => UserMedication)
export class UserMedicationResolver {
  constructor(private readonly loaders: DrugsDataLoaders) {}

  @ResolveField(() => Drug, { nullable: true })
  drugData(@Parent() med: UserMedication): Promise<Drug | undefined> {
    return this.loaders.drugByAtcCode.load(med.atc);
  }
}
