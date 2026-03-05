import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: true,
  formatError: (error) => {
    console.error(error);
    if (process.env.NODE_ENV !== 'dev') {
      return { message: 'Internal server error' };
    }
    return error;
  },
};
