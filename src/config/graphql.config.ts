import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: true,
  transformSchema: (schema: GraphQLSchema) => {
    const description =
      'Full API documentation: https://cu1114.camp.lnu.se/docs/';
    const withDescription = (type: GraphQLObjectType | undefined | null) =>
      type
        ? new GraphQLObjectType({ ...type.toConfig(), description })
        : undefined;
    const newMutation = withDescription(schema.getMutationType());
    const newQuery = withDescription(schema.getQueryType());
    const config = schema.toConfig();
    return new GraphQLSchema({
      ...config,
      mutation: newMutation,
      query: newQuery,
      types: config.types.map((t) => {
        if (t.name === 'Mutation' && newMutation) return newMutation;
        if (t.name === 'Query' && newQuery) return newQuery;
        return t;
      }),
    });
  },
  playground: false,
  graphiql: true,
  context: ({ req, res }) => ({ req, res }),
  formatError: (formatted, error) => {
    console.error(error);
    const code = formatted.extensions?.code;
    if (code && code !== 'INTERNAL_SERVER_ERROR') {
      return { message: formatted.message, extensions: { code } };
    }
    return {
      message:
        'Internal server error. If you suspect this is caused by a misconfiguration, please report it to tiberius.gherac@gmail.com',
    };
  },
};
