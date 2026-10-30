# Queries and atomic updates

> **Interview answer:** A MongoDB filter chooses matching documents, a projection chooses returned fields, and update operators express server-side changes. Single-document writes are atomic, but a client-side read followed by a write is not automatically one atomic operation.

## A compact query vocabulary

These are mongosh examples. Use a disposable practice database, never an existing production collection.

```javascript
db.orders.find(
  { customerId: "customer-7", totalCents: { $gte: 2000 }, status: "PAID" },
  { _id: 1, totalCents: 1, createdAt: 1 }
).sort({ createdAt: -1, _id: -1 }).limit(20)
```

`$gt`, `$gte`, `$lt`, and `$lte` are comparisons. `$in` matches any listed value; `$and` and `$or` combine conditions. Dot notation addresses nested fields.

An inclusion projection normally excludes unspecified fields but includes `_id` unless you explicitly exclude it. Inclusion and exclusion generally cannot be mixed except for `_id`.

## Null is not missing

```javascript
db.users.find({ phone: null })                     // null OR missing
db.users.find({ phone: { $exists: false } })       // missing only
db.users.find({ phone: { $type: "null" } })        // explicit BSON null
```

This distinction affects application behavior, partial indexes, and migrations. An absent field and an explicit null are not interchangeable by default.

For array predicates, use `$elemMatch` when several conditions must match the **same element**. Separate dot-path conditions can match different elements of the array.

```javascript
db.orders.find({
  items: { $elemMatch: { productId: "book-1", quantity: { $gte: 2 } } }
})
```

## Prevent overselling with a conditional update

Suppose a practice inventory document has `_id: "book-1"` and a numeric `stock` field:

```javascript
const result = db.inventory.updateOne(
  { _id: "book-1", stock: { $gte: 1 } },
  { $inc: { stock: -1 } }
)
print(result.matchedCount)
```

The filter and decrement occur as one atomic document update. `matchedCount === 1` means this operation matched an eligible document. Zero means no eligible match: the item may be absent or have insufficient stock. Model the API's error distinction deliberately.

A separate `findOne()`, check, and update can oversell because multiple callers can observe the same stock. For stock reservation **plus order creation across documents**, add a transaction or an explicit reservation workflow; the decrement alone does not make the entire checkout atomic.

## Update versus replacement and upsert

`$set` changes selected fields; `$inc` increments; `$unset` removes fields; `$addToSet` avoids adding an already equal array value; `$push` appends. A replacement replaces the document body rather than patching just the named fields.

`upsert: true` means insert if there is no match. Concurrent upserts can create duplicates unless the logical key is protected by a suitable unique index. An idempotency key is effective only if enforced with durable uniqueness and compatible request semantics.

Use the returned matched/modified/upsert information. A matched update can modify zero documents when the requested value is already present; zero modifications alone is not proof of failure.

## Self-checks

<details><summary>1. Is updateMany atomic across every matching document?</summary>
<p>No. Each document's update is atomic, but the operation as a whole is not an all-or-nothing multi-document transaction. Other operations may interleave.</p>
</details>
<details><summary>2. Why use inc instead of reading and setting a counter?</summary>
<p>The server applies the increment atomically to the current document value. A client read-then-set can overwrite another client's increment.</p>
</details>
<details><summary>3. When do you need elemMatch?</summary>
<p>When multiple array conditions must apply to the same array element. Without it, one element can satisfy one condition while another satisfies a different one.</p>
</details>

## Sources

- [Query documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- [Query null or missing fields](https://www.mongodb.com/docs/manual/tutorial/query-for-null-fields/)
- [Atomicity and transactions](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)
