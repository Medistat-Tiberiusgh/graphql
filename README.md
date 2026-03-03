# API Design Assignment

## Project Name

*Replace with the name of your API project.*

## Objective

Design and develop a robust, well-documented API (REST or GraphQL) that allows users to retrieve and manage information from a dataset of your choice. The API must include JWT authentication, automated testing via Postman/Newman in a CI/CD pipeline, and be publicly deployed.

Choose a dataset (10000+ data points) that interests you — it should include at least one primary CRUD resource and two additional read-only resources. Sources like [Kaggle](https://www.kaggle.com/datasets), public APIs, or CSV files work well. Pick something you find interesting, as you will reuse this API in the next assignment (WT dashboard).

*Describe your API in a few sentences: what dataset does it serve, what are its main resources, and what can users do with it?*

## Implementation Type

*Specify: REST or GraphQL*

## Links and Testing

| | URL / File |
|---|---|
| **Production API** | *...* |
| **API Documentation** | *...* |
| **GraphQL Playground** (GraphQL only) | *...* |
| **Postman Collection** | `*.postman_collection.json` |
| **Production Environment** | `production.postman_environment.json` |

**Examiner can verify tests in one of the following ways:**

1. **CI/CD pipeline** — check the pipeline output in GitLab for test results.
2. **Run manually** — no setup needed:
   ```
   npx newman run <collection.json> -e production.postman_environment.json
   ```

## Dataset

*Describe the dataset you chose:*

| Field | Description |
|---|---|
| **Dataset source** | *e.g. Kaggle, public API, CSV, etc.* |
| **Primary resource (CRUD)** | *e.g. Movies (id, title, release_year, genre, description)* |
| **Secondary resource 1 (read-only)** | *e.g. Actors (id, name, movies_played)* |
| **Secondary resource 2 (read-only)** | *e.g. Ratings (id, text, movie)* |


## Design Decisions

### Authentication

*Describe your JWT authentication solution. Why did you choose this approach? What alternatives exist, and what are their trade-offs?*

### API Design

**REST students:**
- *How did you implement HATEOAS? How does it improve API discoverability?*
- *How did you structure your resource URLs and use HTTP methods/status codes?*

**GraphQL students:**
- *How did you design your schema (types, queries, mutations)?*
- *How did you implement nested queries? How does the single-endpoint approach affect your design?*

### Error Handling

*How does your API handle errors? Describe the format and consistency of your error responses.*

## Core Technologies Used

*List the technologies you chose and briefly explain why:*


## Reflection

*What was hard? What did you learn? What would you do differently?*

## Acknowledgements

*Resources, attributions, or shoutouts.*

## Requirements

See [all requirements in Issues](../../issues/). Close issues as you implement them. Create additional issues for any custom functionality. See [TESTING.md](TESTING.md) for detailed testing requirements.

### Functional Requirements — Common

| Requirement | Issue | Status |
|---|---|---|
| Data acquisition — choose and document a dataset (1000+ data points) | [#1](../../issues/1) | :white_large_square: |
| Full CRUD for primary resource, read-only for secondary resources | [#2](../../issues/2) | :white_large_square: |
| JWT authentication for write operations | [#3](../../issues/3) | :white_large_square: |
| Error handling (400, 401, 404 with consistent format) | [#4](../../issues/4) | :white_large_square: |
| Filtering and pagination for large result sets | [#17](../../issues/17) | :white_large_square: |

### Functional Requirements — REST

| Requirement | Issue | Status |
|---|---|---|
| RESTful endpoints with proper HTTP methods and status codes | [#12](../../issues/12) | :white_large_square: |
| HATEOAS (hypermedia links in responses) | [#13](../../issues/13) | :white_large_square: |

### Functional Requirements — GraphQL

| Requirement | Issue | Status |
|---|---|---|
| Queries and mutations via single `/graphql` endpoint | [#14](../../issues/14) | :white_large_square: |
| At least one nested query | [#15](../../issues/15) | :white_large_square: |
| GraphQL Playground available | [#16](../../issues/16) | :white_large_square: |

### Non-Functional Requirements

| Requirement | Issue | Status |
|---|---|---|
| API documentation (Swagger/OpenAPI or Postman) | [#6](../../issues/6) | :white_large_square: |
| Automated Postman tests (20+ test cases, success + failure) | [#7](../../issues/7) | :white_large_square: |
| CI/CD pipeline running tests on every commit/MR | [#8](../../issues/8) | :white_large_square: |
| Seed script for sample data | [#5](../../issues/5) | :white_large_square: |
| Code quality (consistent standard, modular, documented) | [#10](../../issues/10) | :white_large_square: |
| Deployed and publicly accessible | [#9](../../issues/9) | :white_large_square: |
| Peer review reflection submitted on merge request | [#11](../../issues/11) | :white_large_square: |


