import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: true,
  playground: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphiql: {
    defaultQuery: `# Welcome to the Medistat API
#
# Medistat provides statistics about prescription medicines
# that people have received — explore drug usage, regional
# trends, and demographic breakdowns through this GraphQL API.
#
# For more information about this API, visit https://cu1114.camp.lnu.se/docs/
#
# Get started by registering an account or logging in below.

# Register a new user
mutation Register {
  register(
    username: "alice"
    password: "secret123"
    regionId: 1
    genderId: 1
    ageGroupId: 1
  ) {
    token
    username
  }
}

# Login with existing credentials
mutation Login {
  login(username: "alice", password: "secret123") {
    token
    username
  }
}
`,
  } as any,
  context: ({ req }) => ({ req }),
  formatError: (formatted, error) => {
    console.error(error);
    const code = formatted.extensions?.code;
    if (code && code !== 'INTERNAL_SERVER_ERROR') {
      return { message: formatted.message, extensions: { code } };
    }
    return { message: 'Internal server error' };
  },
};
