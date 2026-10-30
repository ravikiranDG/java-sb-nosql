# Aggregation pipelines

> **Interview answer:** An aggregation pipeline passes documents through transformation stages. Reduce irrelevant data early when semantics permit, understand cardinality changes, and use explain to verify index use and expensive grouping or sorting.

## A worked revenue query

Assume `totalCents` is a validated numeric field and `status` distinguishes paid orders:

```javascript
db.orders.aggregate([
  { $match: { status: "PAID" } },
  { $group: {
      _id: "$customerId",
      revenueCents: { $sum: "$totalCents" },
      orderCount: { $sum: 1 }
  }},
  { $sort: { revenueCents: -1, _id: 1 } },
  { $limit: 10 }
])
```

`$match` filters input orders. `$group` changes the unit from order to customer. `$sort` ranks the resulting totals. `$limit` selects ten groups, not ten orders.

Moving the limit before the group would change the question to "revenue among a small subset of orders," not total customer revenue.

## Know the common stages

| Stage | Effect | Interview pitfall |
|---|---|---|
| `$match` | Filter documents | Filters on computed fields cannot always move earlier |
| `$project` | Select or compute fields | Removing a field before a later stage needs it |
| `$unwind` | One output per array element | Multiplies rows; missing/empty arrays need explicit handling |
| `$group` | Aggregate by a key | Loses original document shape; can consume substantial memory |
| `$lookup` | Join another collection | Large fan-out and missing foreign indexes can be costly |
| `$sort` | Order results | Can be blocking without appropriate access ordering |
| `$facet` | Run multiple sub-pipelines over the input | Memory/result limits; not unlimited free parallel analytics |

The optimizer can move or combine some stages without changing meaning. It cannot turn every pipeline into an indexed scan. Data size and intermediate cardinality matter.

## The unwind double-counting trap

If an order with three items is unwound, its `totalCents` appears in three output documents. Summing that field afterward counts the order three times.

To compute product revenue, sum each item's `priceCents * quantity` after unwind. To compute order revenue, aggregate at order granularity or deliberately deduplicate the order first.

This is the same conceptual trap as joining a parent row to many children in SQL and then summing the parent amount.

## Cursor pagination versus skip

For descending `{ createdAt: -1, _id: -1 }`, seek after a previous cursor by requesting:

```javascript
db.orders.find({
  customerId: "customer-7",
  $or: [
    { createdAt: { $lt: ISODate("2026-01-10T10:00:00Z") } },
    {
      createdAt: ISODate("2026-01-10T10:00:00Z"),
      _id: { $lt: "order-101" }
    }
  ]
}).sort({ createdAt: -1, _id: -1 }).limit(20)
```

This uses the string IDs from the modeling example. In an ObjectId collection, use the matching BSON type in the cursor. A suitable compound index is still needed. Validate cursor inputs and preserve the original filter.

Large skips require walking past earlier results. Seek pagination avoids increasingly large offsets but does not automatically provide snapshot consistency if sort fields change between requests.

## Self-checks

<details><summary>1. Why should match usually appear early?</summary>
<p>Reducing input can reduce later work and may allow an index. But the predicate must be meaningful at that stage; a filter on an aggregate total cannot be applied before that total is computed.</p>
</details>
<details><summary>2. Does lookup make MongoDB equivalent to a relational schema?</summary>
<p>No. It supplies join capability, but constraints, query patterns, data ownership, and performance tradeoffs still differ. Model frequent relationships deliberately rather than treating lookup as cost-free.</p>
</details>
<details><summary>3. Why add an ID tie-breaker to a timestamp sort?</summary>
<p>Multiple records can share a timestamp. A unique tie-breaker produces a deterministic total order and lets a cursor distinguish the exact position within that timestamp.</p>
</details>

## Sources

- [Aggregation](https://www.mongodb.com/docs/manual/aggregation/)
- [Pipeline optimization](https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/)
- [Pagination with range queries](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/)
