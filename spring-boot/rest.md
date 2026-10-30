# REST APIs, validation, and error handling

> **Interview answer:** A good Hypertext Transfer Protocol (HTTP) API has resource-oriented contracts, validated input, deliberate status codes, stable error responses, and authorization on the affected resource. Separate transport models from persistence models so storage details do not accidentally become the public contract.

## Follow a request

For a typical servlet-based Spring Web MVC application:

```text
Request
  -> security / servlet filters
  -> DispatcherServlet
  -> handler mapping and argument binding
  -> validation and controller
  -> service and repository
  -> response serialization
```

Spring Web MVC uses the servlet stack. WebFlux uses a reactive processing model; adding `Mono` to a controller does not make a blocking database driver non-blocking.

A **Data Transfer Object (DTO)** carries an API contract. Do not bind a persistence entity directly to an unrestricted update request: a client might overwrite fields such as role or owner.

## A small validated controller

The following types belong in separate files. The example requires the Boot web and validation starters:

```java
public record QuoteRequest(
    @jakarta.validation.constraints.Positive long unitPrice,
    @jakarta.validation.constraints.Min(1)
    @jakarta.validation.constraints.Max(1000) int quantity
) {}

public record QuoteResponse(long total) {}

@org.springframework.web.bind.annotation.RestController
@org.springframework.web.bind.annotation.RequestMapping("/quotes")
public class QuoteController {
    @org.springframework.web.bind.annotation.PostMapping
    public QuoteResponse quote(
        @jakarta.validation.Valid
        @org.springframework.web.bind.annotation.RequestBody QuoteRequest request
    ) {
        return new QuoteResponse(
            Math.multiplyExact(request.unitPrice(), request.quantity())
        );
    }
}
```

This shows transport validation, not a complete checkout. Currency, amount bounds, overflow handling, authentication, and business rules must be defined for a real payment API. An arithmetic overflow must not be silently turned into a successful total.

## Status codes and idempotency

| Situation | Typical response |
|---|---|
| Successful read | 200 |
| Resource created | 201, normally with a `Location` |
| Successful operation with no response body | 204 |
| Malformed request or validation failure | 400 |
| Missing or invalid authentication | 401 |
| Authenticated but not permitted | 403 |
| Missing resource | 404 |
| Conflict such as an incompatible version | 409 |
| Rate limited | 429 |
| Temporary service unavailability | 503 |

Representational State Transfer (REST) is an architectural style, not a synonym for any JSON endpoint. A GET must not perform a business mutation. PUT is intended to be idempotent; POST is not inherently idempotent. PATCH is not inherently idempotent either.

For retryable creation, an idempotency key needs durable deduplication, a uniqueness constraint, and rules for the same key with a different payload. A local in-memory map fails across replicas and restarts.

## Centralize expected errors

Use `@RestControllerAdvice` and targeted `@ExceptionHandler` methods. Spring's `ProblemDetail` supports a structured problem response. Map validation, missing resources, and conflicts deliberately; do not map every exception to 200 or every exception to 400.

Expose a safe message and correlation identifier, not stack traces, database commands, or secrets. Log unexpected failures server-side with context.

For pagination, cap page sizes and specify a deterministic sort. Cursor pagination is often preferable for large or rapidly changing datasets; it is not automatically a consistent snapshot.

## Self-checks

<details><summary>1. Does Valid prove that a user owns the resource?</summary>
<p>No. Bean validation checks declared constraints, not authorization. Resolve identity from trusted authentication and check access to the actual resource in the application policy.</p>
</details>
<details><summary>2. Why separate request DTOs from database entities?</summary>
<p>It prevents accidental exposure and mass assignment, keeps validation specific to the endpoint, and lets the persistence model evolve without silently changing the API.</p>
</details>
<details><summary>3. Can a retried POST create duplicate orders?</summary>
<p>Yes. The server may have committed the first request before its response was lost. Durable idempotency handling is needed to recognize the retry rather than repeating the business effect.</p>
</details>

## Sources

- [Spring MVC controllers](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html)
- [Error responses](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html)
- [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110)
