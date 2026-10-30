# Sharding and Spring Data MongoDB

> **Interview answer:** Sharding partitions a collection across shards; replication copies data for redundancy. A shard key determines distribution and routing. Spring Data simplifies Java mapping and queries, but does not remove database modeling, indexing, concurrency, or transaction requirements.

## Sharding versus replication

```text
Application -> mongos router -> shard A replica set
                           -> shard B replica set
                           -> shard C replica set
```

Config servers maintain cluster metadata. Each shard in a production sharded deployment is a replica set. More replicas do not automatically distribute primary writes; sharding is the horizontal data-partitioning mechanism.

## Pick a shard key from workload evidence

Consider cardinality, value frequency, monotonic growth, and common query predicates.

- A monotonically increasing range key can concentrate new inserts in one part of the keyspace.
- A hashed key can spread writes, but sacrifices useful range locality on the original value.
- A low-cardinality key limits distribution options.
- A tenant key can support targeted tenant queries, but a very large tenant can create a hotspot.

Queries containing usable shard-key predicates can be targeted. Other queries may scatter to multiple shards and merge results. An index can make work within each shard efficient without removing scatter-gather network work.

Do not promise a universally perfect shard key. Measure the important operations and discuss future skew, tenant growth, and rebalancing.

## Map documents with Spring Data

These types belong in separate files in an application with the Boot MongoDB starter:

```java
@org.springframework.data.mongodb.core.mapping.Document("products")
public class Product {
    @org.springframework.data.annotation.Id
    private String id;
    private String name;
    private long stock;
    @org.springframework.data.annotation.Version
    private Long version;

    public String getId() { return id; }
    public String getName() { return name; }
    public long getStock() { return stock; }
    public Long getVersion() { return version; }
}

public interface ProductRepository
        extends org.springframework.data.mongodb.repository.MongoRepository<Product, String> {
    java.util.List<Product> findByName(String name);
}
```

Spring Data can populate mapped fields without public setters. This is a mapping illustration, not a complete product API. The ID representation and collection schema must be consistent with your existing data.

Use repositories for straightforward persistence and derived queries. Use `MongoTemplate` for explicit criteria, partial updates, aggregation, and operations requiring precise control.

## Optimistic locking and atomic updates

`@Version` lets supported Spring Data operations include the expected version and detect conflicting updates. With acknowledged writes, conflicts can surface as `OptimisticLockingFailureException`.

This does not make arbitrary raw updates version-safe. Some template update operations can increment a version automatically, but conflict detection still requires an appropriate version predicate. Audit each update path rather than assuming the annotation protects every command.

For decrementing stock, an atomic conditional update is often simpler:

```java
var query = org.springframework.data.mongodb.core.query.Query.query(
    org.springframework.data.mongodb.core.query.Criteria.where("_id").is(productId)
        .and("stock").gte(quantity)
);
var update = new org.springframework.data.mongodb.core.query.Update()
    .inc("stock", -quantity);
var result = mongoTemplate.updateFirst(query, update, Product.class);
```

The snippet assumes an injected `MongoTemplate`, a correctly typed `productId`, and a positive validated `quantity`. Inspect `matchedCount`; do not assume success. Include expected version and business conditions when required. For versioned entities, account for the template's documented version behavior.

## Index and transaction ownership

Declare required indexes and ensure deployment actually creates them. `@Indexed` does not guarantee automatic creation is enabled. Version index migrations and validate their presence.

Configure an appropriate Mongo transaction manager only when needed. A `@Transactional` annotation with a relational transaction manager does not automatically wrap MongoDB writes. Never put MongoDB credentials directly in committed configuration examples.

## Self-checks

<details><summary>1. Does adding three secondaries triple write capacity?</summary>
<p>No. A replica set normally still routes writes to one primary. Secondaries provide redundancy and may serve permitted reads; sharding partitions write ownership across shards.</p>
</details>
<details><summary>2. Does a good secondary index guarantee a targeted sharded query?</summary>
<p>No. Routing depends on shard-key information. An index can improve local scans while the router still has to contact many shards.</p>
</details>
<details><summary>3. Does Version protect updates sent directly through the database shell?</summary>
<p>No. The database does not infer Spring's optimistic-locking protocol from a Java annotation. Every write path must preserve the intended concurrency invariant.</p>
</details>

## Sources

- [Sharding](https://www.mongodb.com/docs/manual/sharding/)
- [Choosing a shard key](https://www.mongodb.com/docs/manual/core/sharding-choose-a-shard-key/)
- [Spring Data mapping](https://docs.spring.io/spring-data/mongodb/reference/mongodb/mapping/mapping.html)
- [Template operations and optimistic locking](https://docs.spring.io/spring-data/mongodb/reference/mongodb/template-crud-operations.html)
