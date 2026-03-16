import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType({
  description:
    'To authenticate, add the JWT token to your request headers as: { "Authorization": "Bearer JWT_TOKEN" }',
})
export class AuthPayload {
  @Field()
  token: string;

  @Field()
  username: string;
}
