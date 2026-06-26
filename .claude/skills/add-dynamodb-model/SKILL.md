---
name: add-dynamodb-model
description: Adds a new DynamoDB single-table entity to the BloodConnect backend — a model adapter in core/services/aws/commons/ddbModels/, a repository operations class in core/services/aws/commons/ddbOperations/, GSI/LSI key design, and the matching attribute/index declarations in the Terraform table. Use when asked to "add a DynamoDB model/entity", "store a new record type", "add a table item type", "design keys/GSI for X", or persist a new domain object. Excludes wiring an HTTP endpoint (use add-backend-endpoint).
---

# Add a DynamoDB single-table entity

BloodConnect uses one DynamoDB table (`${env}-bloodConnect-table`, PK/SK = `PK`/`SK`) with overloaded keys per entity. Each entity = a DTO (in `commons/dto/`) + a model adapter (DTO ⇄ DB fields, key/index design) + an operations class (typed queries). Reference: `BloodDonationModel.ts` + `BloodDonationDynamoDbOperations.ts`. For geospatial/H3 entities see `LocationModel.ts` and `DonorSearchModel.ts`.

## Checklist

1. **DTO** — confirm or add the domain DTO in `commons/dto/` (e.g. `DonationDTO.ts`). The DB layer is generic over `Dto extends DTO`.

2. **Model adapter** in `core/services/aws/commons/ddbModels/<Entity>Model.ts`. Copy `BloodDonationModel.ts`:
   - Export key prefix constants, e.g. `export const <ENTITY>_PK_PREFIX = 'BLOOD_REQ'`.
   - Define a `<Entity>Fields` type = `Omit<Dto, ...primary-key-parts> & HasTimeLog & { PK: \`${PREFIX}#${string}\`; SK: ...; GSI1PK?: ...; GSI1SK?: ...; LSI1SK?: ... }`. Template-literal types document the key shape.
   - Implement `class <Entity>Model implements NosqlModel<Fields>, DbModelDtoAdapter<Dto, Fields>` with:
     - `getPrimaryIndex(): { partitionKey: 'PK', sortKey: 'SK' }`
     - `getIndexDefinitions()` returning the `GSI`/`LSI` map (e.g. `{ GSI: { GSI1: { partitionKey: 'GSI1PK', sortKey: 'GSI1SK' } } }`)
     - `getIndex(indexType, indexName)`
     - `fromDto(dto)` — build `PK`/`SK` from prefix + key parts, spread remaining data, and conditionally set `GSI1PK/GSI1SK/LSI1SK` only when all source attributes are defined (the `canIndex` pattern — keeps sparse indexes sparse).
     - `toDto(dbFields)` — strip `PK/SK/GSIx/LSIx`, reconstruct the DTO key fields via `.replace(prefix, '')`.
   - Index typing helpers (`NosqlModel`, `DbModelDtoAdapter`, `HasTimeLog`, `DbIndex`, `IndexType`, `IndexDefinitions`) come from `ddbModels/DbModelDefinitions.ts`.

3. **Operations class** in `core/services/aws/commons/ddbOperations/<Entity>DynamoDbOperations.ts`. Copy `BloodDonationDynamoDbOperations.ts`:
   - `export default class <Entity>DynamoDbOperations extends DynamoDbTableOperations<Dto, Fields, <Entity>Model> implements <Entity>Repository`.
   - `constructor(tableName: string, region: string) { super(new <Entity>Model(), tableName, region) }`.
   - The base `DynamoDbTableOperations` (`ddbOperations/DynamoDbTableOperations.ts`) already provides `create`, `update`, `getItem`, `delete`, and a generic `query`. Add only entity-specific finder methods that build a `QueryInput<Fields>` and call `super.query(...)` / `super.getItem(...)`. Use `QueryConditionOperator` (`EQUALS`, `BEGINS_WITH`, `BETWEEN`) and `this.modelAdapter.getPrimaryIndex()` for key names. Pass `indexName` (the GSI/LSI name) to query a secondary index.
   - Add the repository interface under `core/application/models/policies/repositories/` so the domain layer depends on the port, not the adapter.

4. **Terraform table** in `iac/terraform/aws/dynamodb/dynamodb.tf` — only if the entity introduces NEW indexed attributes. The table declares each key attribute via an `attribute { name = "..." type = "S" }` block and indexes via `global_secondary_index` / `local_secondary_index` (`GSI1`/`LSI1` already exist on `GSI1PK`/`GSI1SK`/`LSI1SK`). Reuse existing GSI1/LSI1 by mapping your entity's keys onto them where possible; add a new attribute + index block only when reuse is impossible. Run `make tf-validate`.

5. **Document** the key design in `docs/architecture/Database.rst` (access patterns + key layout table).

6. **Validate**: `make lint` and `make test`. Add unit tests for `fromDto`/`toDto` round-trips and finder queries (see write-backend-tests; DB-model tests live under `core/services/aws/tests/dbModels/`).

## Gotchas

- New attributes referenced by a GSI/LSI must be declared in `attribute {}` blocks in `dynamodb.tf` or Terraform apply fails.
- Keep indexes sparse: only set `GSIxPK/SK` in `fromDto` when every component attribute is present (the `canIndex` guard), or you pollute the index and break queries.
- `update` in the base class auto-strips the primary key and treats `null` values as REMOVE — set a field to `null` to delete it, not `undefined`.
- This skill stops at persistence. To expose it over HTTP, use add-backend-endpoint.
