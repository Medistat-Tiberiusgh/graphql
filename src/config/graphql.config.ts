import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: 'schema.gql',
  csrfPrevention: false,
  playground: false,
  graphiql: true,
  context: ({ req }) => ({ req }),
  formatError: (formatted, error) => {
    console.error(error);
    const code = formatted.extensions?.code;
    if (code && code !== 'INTERNAL_SERVER_ERROR') {
      return { message: formatted.message, extensions: { code } };
    }
    return { message: 'Internal server error. If you suspect this is caused by a misconfiguration, please report it to tiberius.gherac@gmail.com' };
  },
};
