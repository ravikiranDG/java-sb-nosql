# Replication, consistency, and transactions

> **Interview answer:** A replica set maintains copies of the same dataset for redundancy and failover. Writes normally go to the primary and replicate to secondaries. Read preference chooses where reads go; read concern controls read guarantees; write concern controls acknowledgment. These are separate decisions.

## Replica sets and failover

A primary accepts normal writes. Data-bearing secondaries replicate its operations. If the primary becomes unavailable, eligible voting members can elect a new primary when the required voting conditions are met.

Failover is not zero interruption. Drivers may discover a new primary and retry eligible operations, but applications still need deadlines and a plan for ambiguous outcomes.

Replication is not backup. An accidental delete can replicate too. Backups and tested restore procedures protect against different failures.

## Three settings interviewers often mix up

| Setting | Question it answers | Example |
|---|---|---|
| Read preference | Which member should serve this read? | Primary, secondary |
| Read concern | Which visibility/consistency guarantee is requested? | Local, majority, snapshot where supported |
| Write concern | What acknowledgment is required? | `w: 1`, `w: "majority"` |

Reading from a secondary can return stale data. Majority read concern alone does not promise that any arbitrarily chosen secondary has the very latest write.

A write acknowledged only by the old primary can be rolled back after failover if it did not reach the required durable replicated state. Majority acknowledgment improves failover durability, with details depending on journaling and deployment configuration.

## A timeout is an uncertain outcome

If the server applies a write but the response is lost, the client can see a timeout while the write exists. A write-concern timeout does not mean the server undid the write.

Use stable operation IDs, unique constraints, conditional transitions, or other deduplication to make retries safe. Driver retryable writes cover eligible cases; they do not make an entire multi-step business workflow exactly once.

For "write, then read my write" across members, a causally consistent session combined with appropriate read and write concerns provides relevant guarantees. Do not equate any single setting with global linearizability. Linearizable reads are a separate feature with restrictions and cost.

## When transactions are necessary

Single-document operations are atomic. If inventory and order records must commit together across documents, a multi-document transaction can express that invariant.

Transactions require a supported replica set or sharded deployment, not a standalone server. They add coordination and resource cost, have operational limits, and do not replace good data modeling.

Transaction callbacks can be retried by driver helpers for eligible errors. Do not send an email or charge a card inside a callback assuming it executes exactly once. Store an outbox event or perform a carefully designed external workflow.

## CAP without the oversimplification

The **Consistency, Availability, Partition tolerance (CAP)** result concerns behavior during a network partition, using precise meanings for consistency and availability. It does not say "choose any two features" for every normal database operation.

During a partition, refusing writes without the required majority protects certain consistency guarantees but reduces write availability for isolated members. Weakening concerns changes guarantees, not the laws of distributed systems.

## Self-checks

<details><summary>1. Is a secondary read guaranteed to include the latest primary write?</summary>
<p>No. Replication can lag. Choose read preference, read concern, and session guarantees based on the actual requirement.</p>
</details>
<details><summary>2. Does a timeout prove that retrying a payment-related write is safe?</summary>
<p>No. The original write may have succeeded. Use an idempotent operation identity or a conditional state transition before repeating an externally visible effect.</p>
</details>
<details><summary>3. Does a replica set replace backups?</summary>
<p>No. Replicas copy current changes, including accidental destructive ones. Backups, retention, recovery objectives, and restore drills address recovery from historical mistakes and broader failures.</p>
</details>

## Sources

- [Replication](https://www.mongodb.com/docs/manual/replication/)
- [Read concern](https://www.mongodb.com/docs/manual/reference/read-concern/)
- [Write concern](https://www.mongodb.com/docs/manual/reference/write-concern/)
- [Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [Causal consistency](https://www.mongodb.com/docs/manual/core/causal-consistency-read-write-concerns/)
