# Configuration and production readiness

> **Interview answer:** Production readiness means bounded resource use, explicit failure behavior, safe configuration, and enough evidence to diagnose incidents. A successful startup and a health endpoint do not prove an application can handle traffic safely.

## Configuration and profiles

Externalized configuration separates deploy-time values from code. Use validated `@ConfigurationProperties` for related settings rather than scattered string lookups. Profiles select configuration groups; do not use profiles as a secret store.

Property precedence depends on the source: command-line arguments, environment variables, config files, and test overrides can replace one another. Inspect effective settings safely when debugging, without printing secrets.

Configure timeouts explicitly. Connection establishment, waiting for a pooled connection, reading a response, and an overall request deadline are different limits.

## Observe requests end to end

**Actuator** supplies operational endpoints. **Micrometer** supports metrics instrumentation. Use logs, metrics, and distributed traces together:

- Logs explain discrete events with safe contextual fields.
- Metrics show rates, latency distributions, saturation, and errors over time.
- Traces connect work across service boundaries.

Do not use user IDs, order IDs, or full URLs as unbounded metric labels: high cardinality can overwhelm the monitoring system. Put suitable identifiers in controlled logs or trace attributes instead.

Liveness asks whether the process should be restarted. Readiness asks whether it should receive traffic. Making liveness depend on a temporarily unavailable database can trigger restart loops without fixing the dependency.

Expose operational endpoints narrowly. Detailed configuration, heap dumps, and environment endpoints can reveal sensitive information.

## Pools, queues, and overload

A connection pool is a concurrency limit on database work, not an unlimited accelerator. Increasing it can worsen database contention. Measure active connections, wait time, query time, and database saturation.

Bound executor queues and admission. If requests arrive faster than they can complete, an unbounded queue turns overload into memory growth and long tail latency. Reject deliberately or shed load instead of pretending it is safely buffered forever.

Graceful shutdown stops accepting new work, allows in-flight work a bounded completion window, and closes resources. Background jobs need their own interruption and ownership rules.

## Caching and async are proxy features too

`@Cacheable` needs caching enabled and a configured cache implementation. Define keys, time to live, size bounds, invalidation, and acceptable staleness. A cache entry is not automatically evicted when unrelated code updates MongoDB. Prevent sensitive data from being shared across tenants through an incomplete key.

`@Async` needs async support enabled and a deliberate executor. Self-invocation normally bypasses its proxy. Security, logging, and transaction context do not automatically propagate to another thread. Observe failures from returned futures; `void` async methods need explicit uncaught-exception handling.

## Retry and circuit breaker are different

Retry repeats a potentially transient failure with bounded attempts, backoff, jitter, and a total deadline. It is dangerous for non-idempotent actions. Nested retry layers can multiply traffic dramatically.

A circuit breaker temporarily rejects calls after a failure policy is met, then probes recovery. It does not add capacity or replace timeouts. A fallback must preserve a valid business meaning and be visible in monitoring; do not return a fabricated success.

## Self-checks

<details><summary>1. Why can average latency look healthy during an incident?</summary>
<p>A small fraction of requests can experience very large delays while the mean stays moderate. Inspect tail percentiles, errors, request volume, and saturation together.</p>
</details>
<details><summary>2. Will Cacheable work on a method called from the same object?</summary>
<p>Not through ordinary proxy advice. The call must cross the cache-enabled proxy boundary, or the design must use another explicitly supported mechanism.</p>
</details>
<details><summary>3. Should every database timeout be retried?</summary>
<p>No. The original write may already have succeeded, retries may worsen overload, and the request may have exhausted its deadline. Analyze idempotency, error type, retry budget, and current system health.</p>
</details>

## Sources

- [Boot 3.5 production features](https://docs.spring.io/spring-boot/3.5/reference/actuator/index.html)
- [External configuration](https://docs.spring.io/spring-boot/3.5/reference/features/external-config.html)
- [Spring caching](https://docs.spring.io/spring-framework/reference/integration/cache.html)
- [Spring asynchronous execution](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)
