# Spring, Spring Boot, and dependency injection

> **Interview answer:** Spring provides a container that creates, configures, and connects application objects called beans. Spring Boot builds on Spring with conditional auto-configuration, starter dependencies, embedded server support, and production integrations. Boot reduces setup; it does not replace Spring.

## Inversion of control and dependency injection

**Inversion of Control (IoC)** means the framework owns parts of object creation and lifecycle that your code would otherwise manage. **Dependency injection** supplies an object's collaborators instead of making the object locate or construct them.

```java
public interface ReceiptSender {
    void send(String orderId);
}

@org.springframework.stereotype.Service
public class CheckoutService {
    private final ReceiptSender sender;

    public CheckoutService(ReceiptSender sender) {
        this.sender = sender;
    }

    public void complete(String orderId) {
        sender.send(orderId);
    }
}
```

These are separate source files in a Spring application, and a `ReceiptSender` implementation must be registered as a bean. With one constructor, `@Autowired` is normally unnecessary.

Constructor injection exposes required dependencies, permits final fields, and makes isolated unit tests straightforward. Field injection hides requirements and generally needs reflection or a container to supply fields.

## How beans are discovered

| Annotation | Role |
|---|---|
| `@Component` | General component stereotype |
| `@Service` | Service-layer intent |
| `@Repository` | Persistence-layer intent; participates in exception translation when configured |
| `@Controller` | Web controller |
| `@RestController` | Controller with response-body semantics |
| `@Configuration` + `@Bean` | Explicit construction, useful for third-party classes |

`@SpringBootApplication` combines Boot configuration, auto-configuration enablement, and component scanning. Put the application class in a sensible root package so its default scan reaches your application components. It does not scan every package in the universe.

If two beans satisfy the same dependency, use a qualifier for a specific choice or `@Primary` for a default. Do not rely on accidental registration order.

## Auto-configuration is conditional

Boot checks factors such as classes on the classpath, properties, and existing beans. For example, a relevant starter can make database configuration eligible, but the application still needs valid connection settings and runtime access.

Many auto-configurations back off when a user-defined bean is present; the exact condition is configuration-specific. Inspect the condition evaluation report with debug logging when asking "why did this bean get created?"

A starter is a curated dependency set. Dependency management aligns versions; it is not itself a running service. An embedded servlet container still has connectors, threads, and resource limits.

## Version awareness

Examples in this guide use Java 21 and Spring Boot 3.x conventions, including `jakarta.*` packages. Boot 3 requires Java 17 or later. Boot 2-era examples often use `javax.*`. Boot 4 and its underlying framework introduce further changes: use the documentation matching your project instead of mixing imports and test modules across major versions.

## Self-checks

<details><summary>1. Is every object in a Spring application a bean?</summary>
<p>No. Objects created outside the container are ordinary objects unless explicitly registered or integrated. Calling new on a service does not automatically apply transactional, caching, or other container-managed proxy behavior.</p>
</details>
<details><summary>2. Why does a class annotated with Service sometimes not get injected?</summary>
<p>It may be outside the scan path, excluded by a profile or condition, not instantiated by the active context, or have an unsatisfied dependency. Read the actual bean-creation error rather than adding annotations at random.</p>
</details>
<details><summary>3. What is the difference between Spring and Spring Boot?</summary>
<p>Spring supplies core programming and infrastructure facilities. Boot assembles and configures those facilities through conventions, starters, conditional configuration, and application lifecycle support.</p>
</details>

## Sources

- [Spring container](https://docs.spring.io/spring-framework/reference/core/beans.html)
- [Spring Boot 3.5 auto-configuration](https://docs.spring.io/spring-boot/3.5/reference/using/auto-configuration.html)
- [Boot 3.5 system requirements](https://docs.spring.io/spring-boot/3.5/system-requirements.html)
