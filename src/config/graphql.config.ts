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
      return {
        message: originalError.message,
        extensions: { code: 'BAD_USER_INPUT' },
      };
    }
    const code = error.extensions?.code as string;
    const clientErrorCodes = [
      'GRAPHQL_PARSE_FAILED',
      'GRAPHQL_VALIDATION_FAILED',
      'BAD_USER_INPUT',
    ];
    if (clientErrorCodes.includes(code)) {
      const { stacktrace, ...extensions } = error.extensions ?? {};
      return { ...error, extensions };
    }
    if (process.env.NODE_ENV !== 'dev') {
      return { message: 'Internal server error' };
    }
    return error;
  },
};
