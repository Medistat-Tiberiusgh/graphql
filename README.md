# API Design Assignment

## Project Name

Medistat API

## Objective

Medistat is a GraphQL API for personal medication tracking backed by Swedish national prescription statistics. Users manage their own medication list and, for each drug, receive insights on regional popularity, multi-year trends, and demographic context. All derived from a public national prescribing dataset.

## Implementation Type

GraphQL

## Links and Testing

|                                       | URL / File                            |
| ------------------------------------- | ------------------------------------- |
| **Production API**                    | _https://cu1114.camp.lnu.se/graphql_  |
| **API Documentation**                 | _..._                                 |
| **GraphQL Playground** (GraphQL only) | _https://cu1114.camp.lnu.se/graphql_  |
| **Postman Collection**                | `*.postman_collection.json`           |
| **Production Environment**            | `production.postman_environment.json` |

**Examiner can verify tests in one of the following ways:**

1. **CI/CD pipeline** — check the pipeline output in GitLab for test results.
2. **Run manually** — no setup needed:
   ```
   npx newman run <collection.json> -e production.postman_environment.json
   ```

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
- _How did you implement nested queries? How does the single-endpoint approach affect your design?_

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

**Testing** — XXXX

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
