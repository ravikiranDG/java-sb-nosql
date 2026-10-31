# Spring Boot interview question bank: 24 essential questions

> **Interview answer:** Explain what Spring manages, which boundary a request crosses, and what must be configured for the advertised behavior. An annotation's name is not proof that a transaction, cache, async task, or security policy actually ran.

## How to use this bank

These are curated common preparation topics, not a measured frequency ranking. **Must know** questions cover framework mechanics and application correctness. **Deeper follow-up** questions test production reasoning. Examples use Spring Boot 3.x conventions; confirm the documentation matching your project version.

## Q1. What does Spring Boot add to Spring?

**Priority: Must know. Model answer:** Spring provides dependency injection, web, data-access, and other infrastructure. Boot adds conditional auto-configuration, curated starter dependencies, embedded-server support, and application conventions.

**Example:** Adding a relevant starter makes web configuration eligible; Boot uses classpath, properties, and existing beans to decide what to configure.

**Trap:** Boot does not scan every package or automatically supply a reachable database.

**Follow-up:** What does SpringBootApplication combine, and how do you inspect why an auto-configuration matched? [Container chapter](container.md).

## Q2. What are inversion of control and constructor injection?

**Priority: Must know. Model answer:** Inversion of Control (IoC) gives the container responsibility for object construction and lifecycle. Dependency injection supplies collaborators instead of having a class find or instantiate them.

**Example:** `CheckoutService(PaymentGateway gateway)` exposes a required dependency and can be constructed with a fake in a plain unit test.

**Trap:** Field injection hides required dependencies; calling `new` on a managed-service type does not apply container proxies.

**Follow-up:** Why is Autowired usually unnecessary on a bean's only constructor?

## Q3. Component versus Bean, and what does Configuration do?

**Priority: Must know. Model answer:** Component scanning discovers stereotype-annotated classes. A Bean method explicitly supplies an object, which is useful for third-party types. Configuration groups bean definitions.

**Example:** Service expresses service-layer intent; Repository expresses persistence intent and can participate in exception translation when configured.

**Trap:** Direct calls between Bean methods behave differently with full configuration proxying versus `proxyBeanMethods = false` or other "lite" modes. Do not assume every Java method call retrieves the managed singleton.

**Follow-up:** How would you register a third-party client without modifying its class?

## Q4. What happens when two beans match, or dependencies are circular?

**Priority: Must know. Model answer:** Multiple matching beans require a deliberate choice, such as Qualifier or Primary. A constructor cycle prevents straightforward creation and often signals mixed responsibilities.

**Example:** Qualify the production mail sender instead of relying on registration order.

**Trap:** Adding lazy resolution can hide a design cycle without fixing ownership.

**Follow-up:** When would extracting orchestration into a third service make the dependencies acyclic?

## Q5. Is a singleton bean thread-safe? What about prototype scope?

**Priority: Must know. Model answer:** Singleton is per bean definition per container, not per JVM, and says nothing about thread safety. Prototype creates an instance when resolved by the container.

**Example:** Putting `currentUser` in a singleton controller field shares that state across concurrent requests. Keep request state local.

**Trap:** Injecting a prototype once into a singleton does not produce a fresh instance per method call.

**Follow-up:** How would ObjectProvider support deliberate on-demand creation? [Scopes](lifecycle.md).

## Q6. How do lifecycle callbacks and proxies affect a bean?

**Priority: Must know. Model answer:** Initialization callbacks run after relevant injection. The exposed bean can be a proxy that applies cross-cutting behavior before delegating to the target.

**Example:** PostConstruct can use injected dependencies. A transaction interceptor wraps an externally invoked target method.

**Trap:** Self-invocation normally bypasses proxy advice; final methods cannot be overridden by class-based proxies.

**Follow-up:** Why can the same method behave differently when called from another bean versus `this.method()`?

## Q7. RequestParam, PathVariable, RequestBody, and RestController?

**Priority: Must know. Model answer:** PathVariable binds a path segment, RequestParam binds request parameters, and RequestBody deserializes the body through configured message converters. RestController combines controller behavior with response-body semantics.

**Example:** `/orders/42?includeItems=true` can bind ID from the path and the flag from a query parameter; a create request usually binds a body object.

**Trap:** Binding is not authorization or complete business validation.

**Follow-up:** What happens with malformed JSON, a missing required parameter, or an unsupported content type?

## Q8. Implement custom exception handling and request validation

**Priority: Must know. Model answer:** Validate transport constraints on a Data Transfer Object (DTO), enforce business invariants in the application layer, and map known exceptions with targeted RestControllerAdvice handlers.

**Example:** A withdrawal service raises InsufficientBalanceException; an advice produces a safe ProblemDetail with a deliberate status and stable error code. [Complete custom exception and handler](../java/custom-exceptions.md).

**Trap:** Returning 200 for every failure or exposing `exception.getMessage()` indiscriminately creates a misleading or unsafe contract.

**Follow-up:** Why must validation errors, missing resources, and infrastructure failures have distinct handling?

## Q9. Why did Transactional not work or fail to roll back?

**Priority: Must know. Model answer:** Verify that the object is managed, the call crosses the proxy, the intended transaction manager exists, and rollback rules apply. Ordinary defaults roll back for unchecked exceptions and Error, not checked exceptions unless configured.

**Example:** A self-call bypasses advice. Catching a failure and returning normally changes what the interceptor observes.

**Trap:** Annotation presence is not evidence a physical transaction started.

**Follow-up:** What if an inner REQUIRED call marks the shared transaction rollback-only but the outer method catches its exception? [Transaction traps](transactions.md).

## Q10. Propagation versus isolation?

**Priority: Must know. Model answer:** Propagation chooses how a call relates to an existing transaction. Isolation controls which effects of concurrent transactions are visible. REQUIRED joins or starts; REQUIRES_NEW uses an independent transaction when supported.

**Example:** REQUIRES_NEW can retain the outer connection while acquiring another.

**Trap:** NESTED savepoints are not universally supported, and readOnly is normally a hint, not a universal write prohibition.

**Follow-up:** How can nested calls exhaust a connection pool? What isolation and concurrency control does your database actually implement?

## Q11. JPA versus Hibernate, and save versus flush versus commit?

**Priority: Must know. Model answer:** The Jakarta Persistence API (JPA) is a specification; Hibernate is an implementation. A persistence context tracks managed entities and can flush dirty changes. Flush sends pending database work; commit finalizes a successful transaction.

**Example:** A managed entity mutation can be written by dirty checking without an explicit save call.

**Trap:** A successful save or flush does not guarantee the transaction eventually commits.

**Follow-up:** How does a detached entity differ from a managed one? What failure might appear only at flush or commit?

## Q12. What is N+1, and how do you fix it?

**Priority: Must know. Model answer:** One parent query followed by one child query per parent creates N additional queries. Measure generated SQL, then choose use-case-specific fetch joins, entity graphs, projections, or batching.

**Example:** Returning 50 orders while lazily fetching each customer's details can issue many extra queries.

**Trap:** Making everything eager can overfetch and still leave expensive query behavior. Collection fetch joins can complicate pagination through row multiplication.

**Follow-up:** How would you prove your fix preserves page size and reduces queries?

## Q13. Optimistic versus pessimistic locking?

**Priority: Must know. Model answer:** Optimistic locking checks an expected version and reports conflict. Pessimistic locking acquires database locks that competing operations must respect.

**Example:** Two writers read version 5; the first updates to 6; the second update with expected version 5 fails.

**Trap:** Retrying an optimistic conflict by blindly overwriting the winner defeats the protection.

**Follow-up:** When can high contention favor a different strategy? Discuss lock duration, deadlocks, retries, and conditional updates.

## Q14. Can one Transactional method atomically update SQL and MongoDB?

**Priority: Deeper follow-up. Model answer:** Not automatically. Different transaction managers do not create one coordinated distributed transaction. MongoDB needs its own supported deployment and transaction configuration.

**Example:** A committed relational update followed by a failed MongoDB write can leave partial business progress.

**Trap:** Adding a second annotation or catching an exception does not undo already committed effects in another resource.

**Follow-up:** Explain an outbox, idempotent consumption, and a compensating workflow. State where atomicity actually ends.

## Q15. JWT versus session authentication, and where is authorization checked?

**Priority: Must know. Model answer:** A session usually uses an opaque identifier backed by server state. A bearer token is a credential whose validated claims establish identity; a JSON Web Token (JWT) is one possible format.

**Example:** A valid token for user A does not entitle A to user B's order. Enforce object-level ownership or policy.

**Trap:** A signed JWT is not normally encrypted. Parsing it is not validating signature, issuer, audience, and expiry.

**Follow-up:** How do logout, revocation, and changed permissions behave before token expiry? [Security](security.md).

## Q16. CORS versus CSRF?

**Priority: Must know. Model answer:** Cross-Origin Resource Sharing (CORS) is a browser policy controlling cross-origin response access. Cross-Site Request Forgery (CSRF) abuses credentials automatically attached to requests, often cookies.

**Example:** A browser-cookie-authenticated stateless endpoint can still require CSRF protection.

**Trap:** CORS does not authenticate a caller or protect against non-browser clients.

**Follow-up:** Why can explicit Authorization-header bearer transport change the CSRF analysis, while "stateless" alone does not?

## Q17. Filter versus interceptor versus AOP?

**Priority: Must know. Model answer:** Servlet filters operate around the servlet request pipeline. MVC interceptors surround mapped handler execution. Aspect-oriented programming (AOP) advice surrounds supported bean method invocations.

**Example:** Spring Security's servlet integration uses filters; an MVC interceptor can add handler-level timing; a service proxy can apply transaction advice.

**Trap:** These are different boundaries, and request processing can stop before a controller runs.

**Follow-up:** Where would you put correlation IDs, object-level business authorization, and transaction boundaries, and why?

## Q18. Unit test, WebMvcTest, or SpringBootTest?

**Priority: Must know. Model answer:** Use isolated unit tests for pure logic, a focused MVC test for binding/validation/response behavior, and integration tests when wiring or real dependency behavior is the requirement.

**Example:** MockMvc does not require a real network server. A random-port full application test does.

**Trap:** A mocked repository cannot prove unique indexes, isolation, or query-planner behavior.

**Follow-up:** How can a rollback-after-test hide commit-time errors? Use a representative database for persistence assumptions. [Testing](testing.md).

## Q19. How do profiles and configuration precedence work?

**Priority: Must know. Model answer:** Profiles select configuration groups; external property sources supply deploy-time values with defined precedence. Use validated ConfigurationProperties for coherent typed settings.

**Example:** An environment variable or command-line argument can override a packaged configuration value.

**Trap:** Profiles are not a secret store. Dumping effective configuration can leak credentials.

**Follow-up:** How would you diagnose a wrong timeout value without printing secrets? Explain separate connection, pool-wait, response, and total deadlines.

## Q20. What are Actuator, metrics, tracing, readiness, and liveness?

**Priority: Must know. Model answer:** Actuator exposes operational facilities. Metrics show aggregate rates and distributions; logs explain events; traces connect work across boundaries. Readiness decides traffic eligibility; liveness decides whether restarting the process is appropriate.

**Example:** A transient database outage can make readiness false without implying the process must restart.

**Trap:** Publicly exposing all operational endpoints or using user IDs as metric tags creates security or cardinality problems.

**Follow-up:** Why can healthy mean latency hide severe tail latency?

## Q21. How does Cacheable work, and when does it return stale data?

**Priority: Must know. Model answer:** Cache advice needs enablement, a configured cache, and a proxy-crossing invocation. Define keys, bounds, expiry, invalidation, and acceptable staleness explicitly.

**Example:** Updating a product directly in MongoDB does not automatically evict a previously cached product response.

**Trap:** A key omitting tenant identity can return another tenant's data. Self-invocation can bypass advice.

**Follow-up:** How do you prevent a cache stampede and verify invalidation after writes? [Production](production.md#caching-and-async-are-proxy-features-too).

## Q22. How does Async work, and what happens to its failures?

**Priority: Must know. Model answer:** Async support dispatches supported proxy calls to an executor. Choose capacity and observe futures or configure uncaught handling for void methods.

**Example:** A transaction bound to the request thread does not automatically transfer to the async thread.

**Trap:** Calling an Async method through `this` normally executes directly, and ignoring its future can hide failure.

**Follow-up:** How do security identity, logging context, cancellation, and shutdown behave on the worker?

## Q23. Retry versus circuit breaker, and when is retry unsafe?

**Priority: Deeper follow-up. Model answer:** Retry repeats an eligible transient failure with bounded attempts, backoff, jitter, and a deadline. A circuit breaker rejects calls temporarily according to failure state and recovery probes.

**Example:** A timeout after order creation can mean the write succeeded but the reply was lost. An idempotency key prevents duplicate creation only if durably enforced.

**Trap:** Nested retries multiply load; a fallback must not fabricate success.

**Follow-up:** Which failures are non-retryable, and how would you test exhausted recovery?

## Q24. Why can increasing a connection pool or thread pool worsen latency?

**Priority: Deeper follow-up. Model answer:** More concurrency can increase contention at the database or downstream service. An unbounded queue hides overload as pending work and memory growth.

**Example:** If the database can efficiently serve 30 concurrent queries, admitting 300 does not create ten times the capacity.

**Trap:** A bounded worker count does not imply a bounded submission queue.

**Follow-up:** Measure queue wait, connection wait, execution time, saturation, and tail latency. Explain admission control and graceful rejection rather than guessing a pool size.

## Self-checks

<details><summary>1. Name four reasons an annotated transaction might not behave as expected.</summary>
<p>The call bypassed a proxy, the object is not managed, the selected transaction manager does not cover the resource, or rollback rules/exception handling differ from the assumption.</p>
</details>
<details><summary>2. How would you implement a useful error contract?</summary>
<p>Separate input validation, domain conflicts, missing resources, and unexpected dependency failures. Use targeted advice, safe ProblemDetail responses, stable codes, and server-side diagnostic context.</p>
</details>
<details><summary>3. What distinguishes a production answer from naming annotations?</summary>
<p>Explaining enablement, call boundaries, concurrency, deadlines, observability, failure semantics, and a test that proves the actual behavior under representative conditions.</p>
</details>

## Sources

- [Spring container reference](https://docs.spring.io/spring-framework/reference/core/beans.html)
- [Spring transaction reference](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)
- [Spring MVC](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
- [Spring Security](https://docs.spring.io/spring-security/reference/index.html)
- [Spring Boot 3.5 reference](https://docs.spring.io/spring-boot/3.5/reference/index.html)
