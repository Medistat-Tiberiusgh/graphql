import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: true,
  playground: false,
  graphiql: true,
  formatError: (error) => {
    console.error(error);
    const originalError = error.extensions?.originalError as any;
    if (originalError?.statusCode === 400) {
      return { message: originalError.message, extensions: { code: 'BAD_USER_INPUT' } };
    }
    if (process.env.NODE_ENV !== 'dev') {
      return { message: 'Internal server error' };
    }
    return error;
  },
};
