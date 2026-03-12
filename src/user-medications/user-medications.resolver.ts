import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';
import { UserMedication } from './user-medication.model';
import { UserMedicationsService } from './user-medications.service';

@Resolver(() => UserMedication)
@UseGuards(JwtAuthGuard)
export class UserMedicationsResolver {
  constructor(private readonly service: UserMedicationsService) {}

  @Query(() => [UserMedication])
  myMedications(@CurrentUser() user: JwtPayload): Promise<UserMedication[]> {
    return this.service.findAllForUser(user.sub);
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
