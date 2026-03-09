# API Design Assignment

## Project Name

_Replace with the name of your API project._

## Objective

Design and develop a robust, well-documented API (REST or GraphQL) that allows users to retrieve and manage information from a dataset of your choice. The API must include JWT authentication, automated testing via Postman/Newman in a CI/CD pipeline, and be publicly deployed.

Choose a dataset (10000+ data points) that interests you — it should include at least one primary CRUD resource and two additional read-only resources. Sources like [Kaggle](https://www.kaggle.com/datasets), public APIs, or CSV files work well. Pick something you find interesting, as you will reuse this API in the next assignment (WT dashboard).

_Describe your API in a few sentences: what dataset does it serve, what are its main resources, and what can users do with it?_

## Implementation Type

_Specify: REST or GraphQL_

## Links and Testing

|                                       | URL / File                            |
| ------------------------------------- | ------------------------------------- |
| **Production API**                    | _..._                                 |
| **API Documentation**                 | _..._                                 |
| **GraphQL Playground** (GraphQL only) | _..._                                 |
| **Postman Collection**                | `*.postman_collection.json`           |
| **Production Environment**            | `production.postman_environment.json` |

**Examiner can verify tests in one of the following ways:**

1. **CI/CD pipeline** — check the pipeline output in GitLab for test results.
2. **Run manually** — no setup needed:
   ```
   npx newman run <collection.json> -e production.postman_environment.json
   ```

## Dataset

_Describe the dataset you chose:_

| Field                                | Description                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| **Dataset source**                   | _e.g. Kaggle, public API, CSV, etc._                        |
| **Primary resource (CRUD)**          | _e.g. Movies (id, title, release_year, genre, description)_ |
| **Secondary resource 1 (read-only)** | _e.g. Actors (id, name, movies_played)_                     |
| **Secondary resource 2 (read-only)** | _e.g. Ratings (id, text, movie)_                            |

## Design Decisions

### Authentication

_Describe your JWT authentication solution. Why did you choose this approach? What alternatives exist, and what are their trade-offs?_

### API Design

**REST students:**

- _How did you implement HATEOAS? How does it improve API discoverability?_
- _How did you structure your resource URLs and use HTTP methods/status codes?_

**GraphQL students:**

- _How did you design your schema (types, queries, mutations)?_
- _How did you implement nested queries? How does the single-endpoint approach affect your design?_

### Error Handling

_How does your API handle errors? Describe the format and consistency of your error responses._

## Core Technologies Used

_List the technologies you chose and briefly explain why:_

## Reflection

_What was hard? What did you learn? What would you do differently?_

## Acknowledgements

_Resources, attributions, or shoutouts._

## Requirements

See [all requirements in Issues](../../issues/). Close issues as you implement them. Create additional issues for any custom functionality. See [TESTING.md](TESTING.md) for detailed testing requirements.

### Functional Requirements — Common

| Requirement                                                          | Issue                  | Status               |
| -------------------------------------------------------------------- | ---------------------- | -------------------- |
| Data acquisition — choose and document a dataset (1000+ data points) | [#1](../../issues/1)   | :white_large_square: |
| Full CRUD for primary resource, read-only for secondary resources    | [#2](../../issues/2)   | :white_large_square: |
| JWT authentication for write operations                              | [#3](../../issues/3)   | :white_large_square: |
| Error handling (400, 401, 404 with consistent format)                | [#4](../../issues/4)   | :white_large_square: |
| Filtering and pagination for large result sets                       | [#17](../../issues/17) | :white_large_square: |

### Functional Requirements — REST

| Requirement                                                 | Issue                  | Status               |
| ----------------------------------------------------------- | ---------------------- | -------------------- |
| RESTful endpoints with proper HTTP methods and status codes | [#12](../../issues/12) | :white_large_square: |
| HATEOAS (hypermedia links in responses)                     | [#13](../../issues/13) | :white_large_square: |

### Functional Requirements — GraphQL

| Requirement                                          | Issue                  | Status               |
| ---------------------------------------------------- | ---------------------- | -------------------- |
| Queries and mutations via single `/graphql` endpoint | [#14](../../issues/14) | :white_large_square: |
| At least one nested query                            | [#15](../../issues/15) | :white_large_square: |
| GraphQL Playground available                         | [#16](../../issues/16) | :white_large_square: |

### Non-Functional Requirements

| Requirement                                                 | Issue                  | Status               |
| ----------------------------------------------------------- | ---------------------- | -------------------- |
| API documentation (Swagger/OpenAPI or Postman)              | [#6](../../issues/6)   | :white_large_square: |
| Automated Postman tests (20+ test cases, success + failure) | [#7](../../issues/7)   | :white_large_square: |
| CI/CD pipeline running tests on every commit/MR             | [#8](../../issues/8)   | :white_large_square: |
| Seed script for sample data                                 | [#5](../../issues/5)   | :white_large_square: |
| Code quality (consistent standard, modular, documented)     | [#10](../../issues/10) | :white_large_square: |
| Deployed and publicly accessible                            | [#9](../../issues/9)   | :white_large_square: |
| Peer review reflection submitted on merge request           | [#11](../../issues/11) | :white_large_square: |

## Dataset

### Source

The data originates from two Swedish public health authorities:

- **Socialstyrelsen** (National Board of Health and Welfare) — prescription statistics 2006–2024, available via the open statistics API at [socialstyrelsen.se/statistik-och-data/statistik/for-utvecklare](https://www.socialstyrelsen.se/statistik-och-data/statistik/for-utvecklare/) (CSV Statistikdatabasen – Läkemedel 2006–2024).
- **Läkemedelsverket** (Medical Products Agency) — narcotic classification per ATC code, extracted from the Nationellt produktregister för läkemedel (NPL).

### Preprocessing and filtering

The raw Socialstyrelsen export covers all dispensed prescriptions. The scripts in `scripts/` reduce this to narcotic drugs only:

1. `narcotics_extractor.py` — parses NPL XML product files and builds a mapping of ATC codes to narcotic class (II–V).
2. `preprocessing.py` — filters the raw prescription data to only rows whose ATC code appears in that mapping, then joins in drug names and generates the four lookup tables.

**`prescription_data.csv` therefore contains only narcotic-classified prescriptions** — not all dispensed drugs. This is intentional: the dataset is scoped to controlled substances for focused analysis.

### Entities

| File                    | Rows    | API role                    | Description                                                                       |
| ----------------------- | ------- | --------------------------- | --------------------------------------------------------------------------------- |
| `prescription_data.csv` | ~1.88 M | **Primary resource (CRUD)** | Main fact table — one row per (year, region, drug, gender, age group) combination |
| `drugs.csv`             | 79      | Read-only resource          | Narcotic-classified drugs with ATC code and Swedish name                          |
| `regions.csv`           | 22      | Read-only resource          | Swedish regions (counties + national total "Riket")                               |
| `genders.csv`           | 2       | Read-only resource          | Gender categories (Män / Kvinnor)                                                 |
| `age_groups.csv`        | 19      | Read-only resource          | Five-year age bands (0–4, 5–9, … 90+)                                             |

### Key fields — `prescription_data.csv`

| Field               | Type   | Description                             |
| ------------------- | ------ | --------------------------------------- |
| `year`              | int    | Calendar year (2006–2024)               |
| `region`            | int    | Region ID (FK → `regions.id`)           |
| `atc`               | string | 7-character ATC code (FK → `drugs.atc`) |
| `gender`            | int    | Gender ID (FK → `genders.id`)           |
| `age_group`         | int    | Age group ID (FK → `age_groups.id`)     |
| `num_prescriptions` | int    | Number of dispensed prescriptions       |
| `num_patients`      | int    | Number of unique patients               |
| `per_1000`          | float  | Dispensations per 1,000 inhabitants     |
