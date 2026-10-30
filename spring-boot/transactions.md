# Transactions and persistence

> **Interview answer:** `@Transactional` declares a boundary handled by Spring's transaction infrastructure and the selected transaction manager. It does not automatically make arbitrary remote calls, every database, or an entire distributed workflow atomic.

## ACID and rollback

**Atomicity, Consistency, Isolation, Durability (ACID)** describes transaction properties. Consistency means preserving defined invariants; it is not the same term as replica read consistency.

In Spring's ordinary default rollback rules, unchecked exceptions and `Error` trigger rollback; checked exceptions do not unless configured. A project can change those defaults. `rollbackFor` can specify additional rollback-triggering exceptions.

```java
@org.springframework.stereotype.Service
public class TransferService {
    private final AccountRepository accounts;

    public TransferService(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @org.springframework.transaction.annotation.Transactional(
        rollbackFor = java.io.IOException.class
    )
    public void transfer(long from, long to, long cents)
            throws java.io.IOException {
        accounts.debit(from, cents);
        accounts.credit(to, cents);
    }
}
```

`AccountRepository` is an application-specific collaborator, not a built-in type. Both operations must participate in the same correctly configured transaction manager. The repository must also enforce sufficient-balance and concurrency invariants; a transaction annotation alone does not prevent lost updates.

## Propagation is not isolation

| Setting | Meaning |
|---|---|
| `REQUIRED` | Join an existing transaction, otherwise start one |
| `REQUIRES_NEW` | Suspend the outer transaction and use an independent physical transaction where supported |
| `NESTED` | Savepoint-style nesting when supported by the manager/resource |
| Isolation | What concurrent transactions can observe |

`REQUIRES_NEW` can require another connection while the outer transaction retains its connection. Under load, careless use can exhaust a pool. `NESTED` is not universally supported.

An inner `REQUIRED` call that marks the shared transaction rollback-only cannot be made successful simply by catching its exception outside. The eventual commit can raise `UnexpectedRollbackException`.

`readOnly = true` is generally a transaction hint, not a universal write prohibition.

## The proxy and exception traps

- A self-call usually bypasses transactional advice in proxy mode.
- Catching an exception and returning normally can prevent the interceptor from applying exception-based rollback.
- A new async thread does not automatically inherit an imperative thread-bound transaction.
- A successful repository call followed by a failed HTTP payment call is not a distributed rollback.

For a database change plus an event, consider a transactional outbox: store business state and an event record in one database transaction, then publish with retries and idempotent consumption. Delivery can still be duplicated; do not claim magical exactly-once effects.

## JPA, Hibernate, and the N+1 problem

The **Jakarta Persistence API (JPA)** is a specification; Hibernate is a common implementation. A persistence context tracks managed entities and can flush changes through dirty checking. `save()` is not always an immediate database commit, and flush is not commit.

N+1 means loading a page of N parent records, then lazily fetching children once per parent, creating roughly N additional queries. Fetch joins, entity graphs, projections, and batching can help. Fetching multiple collections or combining collection fetch joins with pagination needs care: row multiplication can invalidate assumptions or force in-memory work.

Optimistic locking uses a version condition and detects competing updates; pessimistic locking acquires database locks and can increase contention or deadlock risk.

## MongoDB is a different transaction manager

`MongoRepository` is not JPA. MongoDB already makes a single-document write atomic. Multi-document transactions require a supported replica set or sharded deployment and appropriate Spring Mongo transaction configuration, commonly `MongoTransactionManager`.

Two transaction managers do not imply one global atomic transaction. A relational database transaction and a MongoDB transaction are not automatically coordinated.

## Self-checks

<details><summary>1. Why did a checked exception not roll back?</summary>
<p>The default Spring rollback rules do not roll back for checked exceptions unless configured. Also verify the call crossed the proxy and used the intended transaction manager.</p>
</details>
<details><summary>2. Does a database transaction undo a successful payment API call?</summary>
<p>No. An external system's side effect is outside the local transaction. Use explicit workflow state, idempotency, and compensating actions where appropriate.</p>
</details>
<details><summary>3. Does making every association eager solve N+1?</summary>
<p>No. It can cause excessive loading and still produce multiple queries. Design fetching for the specific use case and inspect generated queries and execution plans.</p>
</details>

## Sources

- [Declarative transactions](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)
- [Transaction propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)
- [Spring Data MongoDB transactions](https://docs.spring.io/spring-data/mongodb/reference/mongodb/client-session-transactions.html)
