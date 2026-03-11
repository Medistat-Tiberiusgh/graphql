import { GraphQLError } from 'graphql';

export class AppError extends GraphQLError {
  constructor(message: string, code: string) {
    super(message, { extensions: { code } });
  }
}
