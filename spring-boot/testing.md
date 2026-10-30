# Testing Spring applications

> **Interview answer:** Use unit tests for isolated logic, focused framework tests for boundary behavior, and integration tests for assumptions that mocks cannot prove. Test the behavior most likely to fail, not merely whether a context starts.

## Choose the smallest meaningful boundary

| Test | What it proves | What it does not prove |
|---|---|---|
| Plain unit test | Business behavior with controlled dependencies | Spring wiring, serialization, real database behavior |
| `@WebMvcTest` with MockMvc | Focused servlet controller binding, validation, responses | Full application or real network |
| `@DataJpaTest` / `@DataMongoTest` | Focused persistence configuration and mapping | Entire deployed application |
| `@SpringBootTest` | Broad application integration | Real server traffic unless configured for it |
| Container-backed integration | Behavior with a representative real dependency | Production topology, scale, or failure behavior by itself |

MockMvc exercises the MVC request-processing infrastructure without starting an actual HTTP server. A full application context is not automatically a real-server test; choose a random-port web environment when that is what you need.

## A plain unit test

This uses JUnit Jupiter and assumes the `PriceService` from the [bean chapter](lifecycle.md) is in the test package or imported:

```java
class PriceServiceTest {
    private final PriceService prices = new PriceService();

    @org.junit.jupiter.api.Test
    void multipliesUnitPriceByQuantity() {
        org.junit.jupiter.api.Assertions.assertEquals(750, prices.total(250, 3));
    }

    @org.junit.jupiter.api.Test
    void exposesOverflowInsteadOfReturningAWrongTotal() {
        org.junit.jupiter.api.Assertions.assertThrows(
            ArithmeticException.class,
            () -> prices.total(Long.MAX_VALUE, 2)
        );
    }
}
```

No application context is needed for this deterministic calculation. Invalid quantities are a separate contract: validate them at the appropriate layer and test that contract too.

## What to test at each boundary

For controllers: successful shape, malformed payloads, validation errors, missing authentication, forbidden access, and safe error bodies.

For services: invariants, missing records, conflicts, failed dependencies, duplicate submissions, and transaction boundaries.

For MongoDB: serialization, unique indexes, null versus missing fields, query behavior, concurrent conditional updates, and transaction deployment requirements.

Mocks can return results that a real database would never produce. Testcontainers provides disposable real services, but requires a working compatible container runtime and explicitly configured versions. Multi-document MongoDB transaction tests need a replica-set-capable setup, not an arbitrary standalone database.

## Common misleading tests

- A transactional test that rolls back after execution can hide commit-time failures.
- A test that bypasses the proxy does not prove `@Transactional` or `@Async` behavior.
- An in-memory relational database can differ from production in syntax, locking, and constraints.
- A security-disabled controller test does not prove authorization.
- A test that verifies mock call counts but not business results can pass while the requirement is broken.

Prefer deterministic fixtures and assertions over sleeps. For asynchronous completion, wait on a defined condition with a bounded timeout. Avoid dependencies on test execution order.

## Version notes

Testing annotations, mock-bean facilities, and package organization evolve across Spring releases. For example, newer Spring versions introduce `@MockitoBean` while older Boot examples commonly use `@MockBean`. Use the documentation for your exact Boot/Framework combination rather than combining snippets from different generations.

## Self-checks

<details><summary>1. Why not use SpringBootTest for every test?</summary>
<p>It adds startup cost and couples simple logic tests to unrelated configuration. Use broad integration where integration is the requirement; keep pure calculations and decisions easy to test in isolation.</p>
</details>
<details><summary>2. Can a passing repository mock test prove a compound index works?</summary>
<p>No. A mock does not execute the query planner or enforce the index. Use a representative database, create the index deliberately, and inspect behavior and execution plans.</p>
</details>
<details><summary>3. What should a retry test prove beyond eventual success?</summary>
<p>That attempts are bounded, non-retryable failures are not retried, idempotency is preserved, backoff is applied appropriately, and the final failure remains visible when recovery is exhausted.</p>
</details>

## Sources

- [Boot 3.5 testing](https://docs.spring.io/spring-boot/3.5/reference/testing/index.html)
- [MockMvc](https://docs.spring.io/spring-framework/reference/testing/mockmvc.html)
- [Testcontainers MongoDB module](https://java.testcontainers.org/modules/databases/mongodb/)
