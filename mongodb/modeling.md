# NoSQL and document modeling

> **Interview answer:** NoSQL groups several non-relational data models, including document, key-value, wide-column, and graph systems. MongoDB is a document database. Choose it from access patterns, consistency needs, relationships, and operational constraints, not because "NoSQL is always faster."

## What is actually stored?

MongoDB stores documents in **Binary JSON (BSON)**, a typed binary representation supporting values such as dates, binary data, and ObjectIds. A collection holds documents; fields can contain nested documents and arrays.

```javascript
// mongosh example: insert into a disposable practice database.
db.orders.insertOne({
  _id: "order-101",
  customerId: "customer-7",
  status: "PAID",
  items: [
    { productId: "book-1", title: "Java Guide", quantity: 2, priceCents: 1500 }
  ],
  totalCents: 3000,
  createdAt: ISODate("2026-01-10T10:00:00Z")
})
```

The order stores the purchased title and price as a historical snapshot. A later catalog price update should not rewrite a past receipt. This is intentional duplication based on semantics, not an accidental inconsistency.

MongoDB has a flexible schema, not "no schema." Application code still expects types and shapes. Use schema validation, application validation, and migration plans. BSON documents have a 16 MiB size limit.

## Embed or reference?

| Embed when | Reference when |
|---|---|
| Data is read and updated together | Data has an independent lifecycle |
| Child count is reasonably bounded | Relationship grows without a practical bound |
| Single-document atomic updates are valuable | Sharing and independent queries dominate |
| Duplication has a deliberate ownership policy | Duplication would create expensive consistency work |

An address snapshot in an order is a natural embed. Millions of comments inside one blog document are not: unbounded arrays grow the document, create a hot write target, and complicate pagination.

References are application-level links, not automatically enforced foreign keys. `$lookup` supports joins, but join-heavy access patterns may be simpler in a relational model.

## SQL versus MongoDB without myths

Relational databases provide structured tables, relationships, constraints, and mature join capabilities. They can also store JSON and scale through several strategies.

MongoDB supports secondary indexes, aggregation, replication, sharding, and multi-document transactions. It is not "always eventually consistent" and it is not "transaction-free."

Ask: What are the top reads and writes? Which invariants must be atomic? How large do relationships become? How much duplication can the system maintain? What operational skills are available?

## Design from an actual query

For "show a customer's newest paid orders," model `customerId`, `status`, and `createdAt` explicitly. Plan an index that matches filtering and sorting. Store money in an appropriate exact representation, such as integer minor units with currency rules or Decimal128; avoid casually using binary floating point.

ObjectId is a useful identifier but is not a precise, globally ordered business timestamp. Use explicit timestamps and deterministic tie-breakers for pagination.

## Self-checks

<details><summary>1. Does MongoDB mean schema-free?</summary>
<p>No. Documents can vary, but readers and business rules still require a schema. Enforce it through collection validation, application checks, and managed evolution.</p>
</details>
<details><summary>2. Why embed order items but reference the customer?</summary>
<p>Items form a bounded purchase snapshot owned by the order. The customer is independently managed and shared across orders. The exact design still depends on access patterns and historical requirements.</p>
</details>
<details><summary>3. Why is "NoSQL scales, SQL does not" a poor answer?</summary>
<p>Both families have multiple scaling techniques and tradeoffs. The data model, access patterns, partitioning strategy, consistency needs, and operational design determine the result.</p>
</details>

## Sources

- [MongoDB data modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- [BSON types](https://www.mongodb.com/docs/manual/reference/bson-types/)
- [Document size limit](https://www.mongodb.com/docs/manual/reference/limits/#bson-document-size)
