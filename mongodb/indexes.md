# Indexes and query performance

> **Interview answer:** An index is an additional ordered access structure that can reduce documents examined and support sorting. It costs storage, memory, and write maintenance. Prove an index choice against actual filters, sort order, and execution statistics.

## Design a compound index from a query

```javascript
db.orders.createIndex({ customerId: 1, status: 1, createdAt: -1, _id: -1 })

db.orders.find({ customerId: "customer-7", status: "PAID" })
  .sort({ createdAt: -1, _id: -1 })
  .limit(20)
  .explain("executionStats")
```

This puts exact-match fields before the sort fields. The **Equality, Sort, Range (ESR)** guideline is a useful starting point, not an unbreakable law. A highly selective range may justify a different tradeoff, which can require a separate sort.

Field order matters. An index on `{ customerId: 1, createdAt: -1 }` naturally supports the leading customer prefix. It is not equivalent to `{ createdAt: -1, customerId: 1 }`. Do not assume a suffix-only query is equally efficient.

The `_id` tie-breaker gives deterministic ordering among identical timestamps. Whether it belongs in a specific compound index depends on the query and pagination requirements.

## Read explain instead of guessing

Inspect the winning plan and execution statistics:

- `nReturned`: how many documents were returned?
- `totalKeysExamined`: how many index entries were scanned?
- `totalDocsExamined`: how many documents were inspected?
- Is there a collection scan or a blocking sort?

An `IXSCAN` alone is not proof of efficiency: scanning almost the entire index can still be expensive. Stage names and plan shapes vary by server version and execution engine. Compare actual selectivity and work for representative data.

`explain("executionStats")` runs the winning plan to gather execution data; use care with costly queries on live systems.

## Covered queries

A query can be covered when its predicates and returned fields can be satisfied using an index alone, subject to index and query restrictions:

```javascript
db.orders.createIndex({ customerId: 1, totalCents: 1 })
db.orders.find(
  { customerId: "customer-7" },
  { _id: 0, customerId: 1, totalCents: 1 }
).explain("executionStats")
```

Excluding `_id` matters because a secondary index does not automatically include `_id` as an indexed field for coverage. Verify the plan rather than assuming coverage from the field list.

## Specialized indexes and traps

| Index type | Purpose | Caveat |
|---|---|---|
| Unique | Enforce key uniqueness | Existing duplicates can prevent creation; null/missing behavior matters |
| Partial | Index documents matching a filter | Queries need compatible predicates to use it safely |
| Multikey | Index array values | Compound array indexing has restrictions |
| Time-to-live (TTL) | Expire documents using a date-based policy | Background cleanup is delayed, not a precise scheduler |
| Hashed | Hash-based distribution/access | Does not support natural range ordering of original values |

Do not use TTL deletion as the only enforcement for token expiry: reject expired tokens at request time. Indexing every field slows writes and consumes the working set. Automatic index creation also depends on application configuration; an annotation is not proof an index exists.

## Self-checks

<details><summary>1. Why can a query using an index still be slow?</summary>
<p>It may scan many keys and documents, sort a large result, fetch large payloads, or wait on storage and contention. Inspect execution work and workload, not just the presence of IXSCAN.</p>
</details>
<details><summary>2. Is an index on {a: 1, b: 1} equivalent to two single-field indexes?</summary>
<p>No. The compound index orders combinations and can support prefix and combined filtering/sorting patterns. Index intersection, when selected, has different capabilities and costs.</p>
</details>
<details><summary>3. Will a TTL index delete a document exactly at its expiry time?</summary>
<p>No. Cleanup is asynchronous and can lag. Expiry-sensitive application behavior must check time independently of physical deletion.</p>
</details>

## Sources

- [Compound indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-compound/)
- [ESR guideline](https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/)
- [Explain results](https://www.mongodb.com/docs/manual/reference/explain-results/)
- [TTL indexes](https://www.mongodb.com/docs/manual/core/index-ttl/)
