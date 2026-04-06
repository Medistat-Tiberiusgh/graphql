# API Design Assignment

## Project Name

Medistat API

## Objective

Medistat is a GraphQL API for personal medication tracking backed by Swedish national prescription statistics. Users manage their own medication list and, for each drug, receive insights on regional popularity, multi-year trends, and demographic context. All derived from a public national prescribing dataset.

## Implementation Type

GraphQL

## Links and Testing

|                                 | URL / File                           |
| ------------------------------- | ------------------------------------ |
| **Production API & Playground** | _https://cu1114.camp.lnu.se/graphql_ |
| **API Documentation**           | _https://cu1114.camp.lnu.se/docs/_   |
| **Bruno (test) Collection**     | `tests/`                             |
| **Bruno Environment**           | `tests/environments/Dev.bru`         |

**Examiner can verify tests in one of the following ways:**

1. **CI/CD pipeline** — check the pipeline output in GitLab for test results.
2. **Run manually** — requires [Bruno CLI](https://docs.usebruno.com/bru-cli/overview):
   ```bash
   npx bru run --env-file environments/Dev.bru --sandbox=developer
   ```
   Make sure the API is running locally before executing.

## Dataset

| Field                                | Description                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dataset source**                   | Swedish national prescription statistics from Socialstyrelsen (National Board of Health and Welfare), CSV export from Statistikdatabasen – Läkemedel 2006–2024. Narcotic classification added via a left join with NPL data from Läkemedelsverket. Covers all human drugs (7-character ATC codes, excluding veterinary Q-prefix), unified by year, region, and demographics. |
| **Primary resource (CRUD)**          | UserMedication (id, atc, notes, added_at) — a user's private list of tracked medications, linked to their profile and enriched with statistical insights                                                                                                                                                                                                                     |
| **Secondary resource 1 (read-only)** | PrescriptionData (year, region, atc, gender, age_group, num_prescriptions, num_patients, per_1000) — national fact table used for trend, regional, and demographic benchmarking                                                                                                                                                                                              |
| **Secondary resource 2 (read-only)** | Drug (atc, name, narcotic_class) — ATC drug catalog used to resolve medication names and classification                                                                                                                                                                                                                                                                      |

## Design Decisions

### Authentication

JWT Authentication

The API uses JSON Web Tokens (JWT) with the HS256 algorithm, signed with a secret loaded from the `JWT_SECRET` environment variable. Tokens are issued on register and login mutations and expire after 2 hours. The payload of the JWT includes the user's `ID` (sub), `username`, `regionId`, `genderId`, and `ageGroupId` . The latter ones are embedded in order to avoid extra database lookups on every request requiiring authentication.

A custom `JwtAuthGuard` validates the token on every protected query/mutation by extracting it from the GraphQL request context, verifying the signature and expiry, and attaching the decoded payload to the request. The `@CurrentUser()` parameter decorator then makes the payload available inside resolvers.

There is no refresh token mechanism once a token expires, the user must log in again. A refresh mekanism for the token has not been implemented because of time constraint. The 2 hour expiry felt like a good trade-off for normal usage.

Why this approach?
Firstly to satisfy the issues #3, #7 and #14. A big selling point of the JWT is the fact that is stateless meaning the the server does not need to store or coordinate user state. By having the authentification and authorization stateless the application becomes easyer to scale horizontally since any server instance can independently verify a token without consulting a shared session store.

The main alternative to JWT is server-side session cookies, which are stateful meaning that the server
stores session data. The advantage with session cookies is that they are simpler to invalidate
immediately (a key advantage JWT lacks without a blocklist), but introduce coordination
overhead when scaling across multiple instances.

Worth mentioneing i believe is the fact that authentication and authorization are security-critical operation where missconfiguration can lead to both application failures and dataleckage. For this reason i believe it is worth considering whether to delegate this responsibility to a specialized third-party provider such as an OAuth 2.0 / OpenID Connect service, which offloads token management, rotation, and revocation to a purpose-built system.

### API Design

**GraphQL students:**

- _How did you design your schema (types, queries, mutations)?_

Through NestJS, the graphql schema is designed through decoraters, keeping implementation and schema in sync by definition.

**Types** Evolved throughout the development of the API. In places where it became obvious that the returned type is a datastructure, the API was changed in order to reflect the data structure type. A neat feature that i discovered throughout the development of the types is that one can add descriptions to them. Descriptions have been used for informing the API consumer about details that would be hard to understand (as for example a deliberate wrapper type `DrugInsights` so future insight dimensions can be added without a breaking change).

**Queries** are split by resource. Reference data is publicly accessible. `myMedications` requires a valid JWT and returns only the authenticated user's data.

**Mutations** are grouped into auth (`register`, `login`, `deleteAccount`) and medications (`addMedication`, `updateMedication`, `removeMedication`). All medication mutations and `deleteAccount` are protected by the JWT guard. `deleteAccount` requires an explicit `confirm: true` argument to prevent accidental deletion.

- _How did you implement nested queries? How does the single-endpoint approach affect your design?_

Nested queries are implemented via `@ResolveField` on the `UserMedicationsResolver`. When a client requests `myMedications`, the resolver returns the base `UserMedication` rows. If the client also requests `drugData` or `insights`, NestJS automatically calls the corresponding `@ResolveField` method for each medication, fetching the drug catalog entry or regional statistics lazily. If the client omits those fields, the resolvers are never called.

The single-endpoint model shaped the design in two concrete ways. First, the `DrugInsights` wrapper type exists because the single endpoint invites clients to ask for more over time — wrapping `regionalPopularity` in a type means future dimensions (trends, demographics) can be added as new fields without a breaking change. Second, authorization had to move into the resolver layer rather than the URL layer. Since everything goes through `/graphql`, field-level guards (`@UseGuards(JwtAuthGuard)`) on the resolver class replace what would otherwise be route-level middleware in a REST API.

### Error Handling

All errors are handled through a custom `AppError` class that extends `GraphQLError`, adding a typed `code` field (for example: `BAD_USER_INPUT´ , `UNAUTHENTICATED`, ´ NOT_FOUND´, `CONFLICT´). These are thrown explicitly throughout the application for known failure conditions.

A global error formatter is implemented as well as a catch-all. If an error is not an `AppError` instance, it is replaced with a generic "Internal server error" response to avoid leaking implementation details. All error responses follow the format:

```JSON
{
  "errors": [
    {
      "message": "User not found.",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

## Core Technologies Used

**NestJS + Apollo Server** — NestJS is an opinionated framework that enforces dependency inversion by design, which aligned well with the course requirements. Apollo Server is integrated to handle the GraphQL layer.

**PostgreSQL** — A relational database was chosen because the dataset has clear relationships between entities (prescriptions, drugs, regions, demographics). PostgreSQL handles the data volume well and integrates cleanly with TypeORM.

**Python seed scripts** — The dataset is large (~46M rows), so preprocessing and seeding is handled by Python scripts (adapted from an existing CSV-to-database tool with AI assistance). Python was kept for its efficiency with large file processing. The scripts and schema are maintained in a separate repository.

**Docker** — Both the seed script and database are containerised. The production environment runs four containers on a shared Docker network: the API, PostgreSQL + seed script, a Caddy reverse proxy (handling TLS certificate renewal via LNU's infrastructure), and a webhook listener that triggers redeployment when the CI/CD pipeline pushes a new image.

**GitLab CI/CD** — On every push to main, the pipeline builds a Docker image with Kaniko, pushes it to the GitLab Container Registry tagged with the commit SHA and latest, then sends a webhook to the server to pull and restart the updated container.

**Tests** — API tests are written as a Bruno collection (`tests/`) and run via the Bruno CLI. Bruno was chosen over Postman because Postman does not support exporting GraphQL collections as plain files, which makes version control and CI integration impractical. The collection covers auth, medications, all reference data queries, and a cleanup step that deletes the test user after each run, making the suite safe to run against the production API.

## Reflection

**What was hard?**

The biggest challenge was fully thinking through the dataset before starting implementation. I had a clear idea early on, but as development progressed I realised there were decisions I had not worked out in advance — this led to iterative changes to the seed scripts and PostgreSQL schema mid-development. Schema changes in particular proved disruptive: they broke working code, caused naming to go out of sync across layers, and were time-consuming to untangle.

Implementing GraphQL on the backend was also new territory. I had consumed GraphQL APIs before, but designing and exposing a schema is a different challenge — especially combined with a framework I had not used before.

NestJS and Apollo Server had a steep initial learning curve, but the opinionated structure ultimately made the codebase easier to reason about. I would use both again in future projects.

Setting up Caddy as a reverse proxy in a container was unfamiliar at first, though once it was running it gave me a clearer overview of the server infrastructure than I expected. The custom CD pipeline (webhook-triggered redeployment) was similarly tricky to get right.

**What would I do differently?**

Design the database schema and seed pipeline more carefully before writing any application code. The cost of changing the schema after the fact was much higher than I anticipated — a more thorough upfront design would have saved significant time.

## Acknowledgements

Apollo Server documentation — GraphQL schema design and resolver patterns
NestJS documentation — framework setup and module structure
from-csv-to-database — base repository adapted for preprocessing and seeding the dataset
YouTube tutorials — NestJS and GraphQL introductions
Claude (Anthropic) & Gemini (Google) — assistance with general development
CSN — moral support
