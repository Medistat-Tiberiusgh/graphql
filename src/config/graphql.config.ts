import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: true,
  playground: false,
  graphiql: true,
  formatError: (formatted, error) => {
    console.error(error);
    const code = formatted.extensions?.code;
    if (code && code !== 'INTERNAL_SERVER_ERROR') {
      return { message: formatted.message, extensions: { code } };
    }
    return { message: 'Internal server error' };
  },
};
