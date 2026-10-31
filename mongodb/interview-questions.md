# MongoDB and NoSQL interview question bank: 16 essential questions

> **Interview answer:** Start with the access pattern and business invariant, choose the document and index design, then explain which operations are atomic and what replication or sharding changes. Do not substitute "NoSQL is scalable" for a reasoned database choice.

## How to use this bank

These are curated common preparation topics, not a measured interview-frequency ranking. **Must know** questions cover daily data correctness and performance. **Deeper follow-up** questions probe distributed and operational behavior. Commands are mongosh examples for a disposable practice database.

## Q1. SQL versus NoSQL: why choose MongoDB?

**Priority: Must know. Model answer:** NoSQL includes document, key-value, wide-column, and graph models. MongoDB is a document database. Choose it when document ownership and access patterns fit, while accounting for constraints, relationships, transactions, and operations.

**Example:** A bounded order snapshot with embedded items fits a document. Highly relational queries with many shared invariants may fit a relational database better.

**Trap:** SQL can scale and store JSON; MongoDB can support transactions and joins.

**Follow-up:** Which exact reads and atomic invariants determine your choice? [Modeling](modeling.md).

## Q2. BSON, ObjectId, and flexible schema: what do they mean?

**Priority: Must know. Model answer:** Binary JSON (BSON) is MongoDB's typed document representation. ObjectId is a common identifier, not a precise business timestamp. Flexible document shape still needs application and collection validation.

**Example:** Store createdAt explicitly for sorting and use a unique tie-breaker for stable pagination.

**Trap:** A document has a 16 MiB limit; an unbounded array eventually becomes a correctness and scaling problem.

**Follow-up:** How do you migrate documents when a field changes type or meaning?

## Q3. When should you embed versus reference?

**Priority: Must know. Model answer:** Embed bounded data owned and accessed together; reference independently managed or unbounded relationships. Consider duplication, consistency maintenance, query patterns, and single-document atomicity.

**Example:** Embed purchased item names and prices as an order snapshot; reference the independently changing customer.

**Trap:** Millions of comments embedded in one post create an oversized hot document.

**Follow-up:** How would you retain historical prices while updating a product catalog?

## Q4. How do null, missing fields, and projections differ?

**Priority: Must know. Model answer:** `{phone: null}` matches explicit null and missing fields. `$exists: false` matches absence. `$type: "null"` matches explicit BSON null. Projections control returned fields, not matching.

```javascript
db.users.find({ phone: { $exists: false } }, { _id: 0, name: 1 })
```

**Trap:** An inclusion projection normally still returns `_id` unless excluded. Inclusion/exclusion generally cannot be mixed except for `_id`.

**Follow-up:** How does this affect a covered query or an index filtering policy? [Queries](queries.md).

## Q5. Why is elemMatch necessary for some array queries?

**Priority: Must know. Model answer:** Use elemMatch when multiple conditions must hold on the same array element. Separate dot-path predicates can be satisfied by different elements.

**Example:** An order contains one book item with quantity one and another product with quantity five. Separate product and quantity predicates may match even though the book quantity is not five.

**Trap:** Query correctness must be established before optimizing with a multikey index.

**Follow-up:** Write the same-element predicate and explain which document should no longer match.

## Q6. How do you prevent overselling with an atomic update?

**Priority: Must know. Model answer:** Include the availability condition in the server-side update filter and decrement using inc. Filter evaluation and update are atomic for that document.

```javascript
db.inventory.updateOne(
  { _id: "book-1", stock: { $gte: 2 } },
  { $inc: { stock: -2 } }
)
```

**Trap:** A separate read/check/write races. Zero matched documents means no eligible match, which is different from a successful no-change update.

**Follow-up:** Does this also atomically create an order in a different document? Explain the extra transaction or workflow requirement.

## Q7. Replacement, update, and upsert: what can go wrong?

**Priority: Must know. Model answer:** Update operators modify selected fields; replacement replaces the document body. Upsert inserts when no match exists.

**Example:** Two callers concurrently upserting a logical user need an appropriate unique index to prevent duplicate logical identities.

**Trap:** Upsert alone is not durable idempotency. A modified count of zero is not always failure if the value was already present.

**Follow-up:** How would you distinguish matched, modified, and inserted results in an API contract?

## Q8. Design a compound index for customer orders

**Priority: Must know. Model answer:** Begin from the filter and sort. For equality on customerId and status followed by descending createdAt and ID, consider equality fields first and the sort fields next.

```javascript
db.orders.createIndex({ customerId: 1, status: 1, createdAt: -1, _id: -1 })
```

**Trap:** The Equality, Sort, Range (ESR) guideline is a starting point; selectivity can justify other tradeoffs. Field order changes useful prefixes.

**Follow-up:** Which queries can use the prefix, and when would two single-field indexes not replace this compound index? [Indexes](indexes.md).

## Q9. How do you prove a query is efficient with explain?

**Priority: Must know. Model answer:** Inspect the winning plan, returned count, keys examined, documents examined, and sorting work on representative data. Index scan presence alone is insufficient.

**Example:** Returning 20 documents after examining a million keys can still be expensive.

**Trap:** A collection scan is not automatically the worst plan for every tiny collection or low-selectivity workload. Execution-engine plan details vary by version.

**Follow-up:** What makes a query covered, and why might `_id` projection prevent coverage?

## Q10. Unique, partial, multikey, and TTL indexes?

**Priority: Must know. Model answer:** Unique enforces a key constraint; partial indexes cover documents matching a filter; multikey indexes index array values; time-to-live (TTL) indexes support asynchronous expiration cleanup.

**Example:** A TTL date can remove old sessions eventually, but request-time expiry must still be validated.

**Trap:** Null/missing behavior matters for uniqueness, array combinations have compound-index restrictions, and every index adds write cost.

**Follow-up:** How do you confirm an Indexed annotation actually resulted in a database index?

## Q11. What does aggregation do, and why can unwind double-count?

**Priority: Must know. Model answer:** Pipelines transform documents through stages such as match, group, unwind, lookup, and sort. Cardinality can change at each stage.

**Example:** Unwinding three order items repeats the order total three times. Summing that repeated total overcounts; sum item amounts or aggregate at order granularity.

**Trap:** Moving limit before group can change the question being answered.

**Follow-up:** Which filters can move earlier without changing semantics? [Worked aggregation](aggregation.md).

## Q12. Skip pagination versus cursor pagination?

**Priority: Must know. Model answer:** Large skips require traversing past earlier results. Cursor pagination seeks after a known sort position using a deterministic order and a matching index.

**Example:** For descending createdAt and ID, continue with an earlier timestamp or the same timestamp and a smaller ID.

**Trap:** Timestamp alone is not unique, and changing sort fields between requests can still move records. Cursor pagination is not automatically a snapshot.

**Follow-up:** Preserve the original filter, validate cursor values, and explain how BSON ID type affects comparisons.

## Q13. Replication versus sharding, and what makes a bad shard key?

**Priority: Must know. Model answer:** Replication keeps copies for failover; sharding partitions data and write ownership. A shard key should support distribution and important routing predicates.

**Example:** A monotonically increasing range key can concentrate writes; a huge tenant can make tenant-based distribution uneven.

**Trap:** More secondaries do not triple primary write capacity. A secondary index does not guarantee targeted routing without shard-key information.

**Follow-up:** Discuss hashed versus range locality and scatter-gather costs. [Sharding](scaling.md).

## Q14. Read preference, read concern, and write concern?

**Priority: Must know. Model answer:** Read preference chooses the serving member. Read concern specifies read visibility guarantees. Write concern specifies acknowledgment requirements.

**Example:** A secondary can lag even when a preceding write was majority acknowledged.

**Trap:** Majority read concern is not a universal promise of the latest value from any member. A write-concern timeout does not prove rollback.

**Follow-up:** What does a causally consistent session provide with appropriate concerns? Why is linearizability a separate requirement? [Consistency](consistency.md).

## Q15. When are multi-document transactions needed, and can a retry duplicate effects?

**Priority: Deeper follow-up. Model answer:** Use a transaction for an invariant spanning documents when modeling alone cannot express it. A supported replica set or sharded deployment and appropriate transaction configuration are required.

**Example:** Inventory and an order can commit together, but a card charge made inside a retryable callback can still execute more than once.

**Trap:** A client timeout can mean a successful write with a lost response. Driver retries do not make every business workflow exactly once.

**Follow-up:** Explain idempotency, outbox publishing, and why replication is not backup.

## Q16. MongoRepository versus MongoTemplate, and what does Version protect?

**Priority: Must know. Model answer:** Repositories simplify common persistence and derived queries. MongoTemplate provides explicit criteria, updates, aggregation, and operation control. Version supports optimistic checks in documented Spring Data operations.

**Example:** A save with an expected version can fail when another writer has already changed the document.

**Trap:** A Java Version annotation does not govern arbitrary shell or raw update commands. Automatic version increments alone are not equivalent to expected-version conflict detection.

**Follow-up:** Audit every update path, index creation, acknowledged writes, and the chosen Mongo transaction manager. [Spring Data implementation](scaling.md).

## Self-checks

<details><summary>1. What should you ask before recommending embedding?</summary>
<p>How data is read and updated, who owns it, how large the relationship becomes, which invariants must be atomic, and how duplication will be maintained.</p>
</details>
<details><summary>2. How would you demonstrate an index actually helped?</summary>
<p>Use the real filter and sort on representative data, compare examined keys/documents and execution work, verify sort and coverage behavior, and account for write/storage cost.</p>
</details>
<details><summary>3. Why is a timeout not a reliable rollback signal?</summary>
<p>The server may have applied or committed work before the response was lost or acknowledgment timed out. Safe recovery requires an operation identity, conditional transition, or another deliberate idempotency strategy.</p>
</details>

## Sources

- [MongoDB manual](https://www.mongodb.com/docs/manual/)
- [MongoDB data modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- [Atomicity](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)
- [Explain statistics](https://www.mongodb.com/docs/manual/reference/explain-results/)
- [Spring Data MongoDB](https://docs.spring.io/spring-data/mongodb/reference/)
