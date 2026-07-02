# Medistat — graphql

The GraphQL API for [Medistat](https://github.com/Medistat-Tiberiusgh), a visualization tool for dispensed medicines in Sweden. One schema serves both the public prescription statistics and the private user data behind the dashboard.

## How it's put together

- Built with NestJS and Apollo Server. The schema is defined through decorators, so the schema and the resolvers stay in sync by definition.
- Postgres is queried with raw SQL via `pg` (no ORM), so queries against the large fact table stay explicit.
- The schema has two surfaces: statistics and reference data that anyone can query, and JWT-protected user data (profile and saved medications).
- Nested fields resolve lazily. A medications query returns the base rows, and `drugData` and `insights` only run when the client asks for them.
- Domain errors carry a typed `code` extension (`NOT_FOUND`, `CONFLICT`, and so on). Anything unexpected is masked as a generic internal error, so implementation details never leak.

The schema is easiest explored in the playground at [medistat.tiberiusgh.com/graphql](https://medistat.tiberiusgh.com/graphql).

## Authentication

Login is delegated to GitHub and Google via OAuth with PKCE. The frontend runs the authorization flow and POSTs the code to `/auth/:provider/exchange`, where the backend completes the exchange with the provider, upserts the user, and returns a JWT.

A logged-in user can link the other provider from their profile. If that identity already belongs to another account, the two accounts are merged.

## CI/CD

Every push to `main` ships to production:

1. **Build & push** — the image goes to GHCR, tagged with the commit SHA and `latest`.
2. **Integration tests** — in parallel with the build, the write flows run against a throwaway Postgres seeded with sample data.
3. **Deploy** — only if both succeed, CI POSTs to a webhook on the server that pulls the new image and restarts the container.
4. **Smoke test** — read-only queries run against the live API.
5. **Rollback** — if the smoke test fails, a second webhook swaps the previous image back in.

## Testing

Tests are a Bruno collection in `tests/`, stored as plain files so they version-control cleanly and run in CI (Postman can't || does not want || wants money in order to export GraphQL collections as files). They are split in two tiers:

- **Pre-deploy integration tests** (auth, medications, cleanup) run against a throwaway Postgres seeded with the [db-etl](https://github.com/Medistat-Tiberiusgh/db-etl) sample dataset. That's the same schema and loader as production, so the write flows are verified against a real database without ever touching production data.
- **Post-deploy smoke tests** (read-only queries) run against the live API to confirm the deployment is healthy. A failure triggers the rollback.

Sign-in in production is OAuth-only. The `ciToken` mutation that lets the test suite mint a JWT without a real OAuth round-trip is disabled in production, so it can never become a backdoor. Every run creates its own test user and deletes it afterwards.

## Dataset

The statistics come from Socialstyrelsen (the National Board of Health and Welfare), enriched with narcotic classifications from Läkemedelsverket (the Medical Products Agency). Loading the database and keeping it current is handled by the [db-etl](https://github.com/Medistat-Tiberiusgh/db-etl) repository.
