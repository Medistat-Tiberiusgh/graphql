import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Gender } from './gender.model';
import { GendersService } from './genders.service';

@Resolver(() => Gender)
export class GendersResolver {
  constructor(private readonly gendersService: GendersService) {}

  @Query(() => [Gender])
  async genders(): Promise<Gender[]> {
    return this.gendersService.findAll();
  }

  @Query(() => Gender)
  async gender(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Gender> {
    return this.gendersService.findOne(id);
  }
}
