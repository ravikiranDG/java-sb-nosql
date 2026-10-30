# Bean lifecycle, scopes, and proxies

> **Interview answer:** A Spring singleton is one bean instance per bean definition per container, not one instance per JVM. Scope controls instance lifetime; it does not confer thread safety. Many Spring features are applied through proxies, so the path a method call takes matters.

## Lifecycle in useful order

At a high level, the container instantiates a bean, injects dependencies, runs initialization callbacks with bean post-processors involved, and exposes the resulting bean, which may be a proxy. On context shutdown, it invokes configured destruction callbacks for managed scopes.

Use `@PostConstruct` for initialization requiring injected dependencies, not constructors that access fields still awaiting injection. Use `@PreDestroy` for appropriate shutdown cleanup. Exact lifecycle details vary for factory-created beans, early references, and custom post-processors.

For Boot 3.x, these annotations are in `jakarta.annotation`. Avoid long, failure-prone external workflows in initialization unless they are an intentional startup requirement.

## Scope and shared state

| Scope | Instance lifetime | Common trap |
|---|---|---|
| Singleton | Per bean definition per container | Request-specific mutable fields shared across requests |
| Prototype | New instance per container resolution | Injecting once into a singleton does not create one per call |
| Request | Per web request | Requires an active request context |
| Session | Per web session | Can retain large objects across requests |

```java
@org.springframework.stereotype.Service
public class PriceService {
    public long total(long unitPrice, int quantity) {
        return Math.multiplyExact(unitPrice, quantity);
    }
}
```

This bean keeps calculations in local variables rather than a mutable `currentCustomer` field. Stateless beans are much easier to use safely across requests.

For on-demand prototype instances, use `ObjectProvider<T>` or another deliberate lookup strategy. The container does not automatically run normal destruction callbacks for every prototype instance it hands out; the client may own cleanup.

## What a proxy does

**Aspect-oriented programming (AOP)** wraps cross-cutting behavior around selected method executions: transactions, caching, authorization, metrics, and asynchronous dispatch.

A caller invokes the proxy. The proxy applies advice and delegates to the target. JDK dynamic proxies work through interfaces; class-based proxies subclass the target. Final classes cannot be subclassed, and final methods cannot be overridden for class-based advice.

```text
Other bean --> proxy --> transaction advice --> target method
Target method --> this.otherMethod() --> target directly
```

In the usual proxy mode, **self-invocation bypasses the proxy**. Adding `@Transactional`, `@Async`, or `@Cacheable` to the called method does not fix that call path. Moving the boundary to a separate collaborating bean is often the clearest solution.

Visibility rules depend on proxy type and framework version. Public externally invoked methods are a simple, predictable convention for transaction boundaries.

## Circular dependencies

Constructor A needs B while constructor B needs A: neither can be fully created first. This often signals tangled responsibilities. Refactor orchestration or extract a smaller shared collaborator instead of hiding the cycle with field injection or lazy resolution by default.

## Self-checks

<details><summary>1. Can two application contexts contain different instances of the same singleton bean?</summary>
<p>Yes. Spring's singleton scope is container-scoped. It is not the global singleton design pattern enforced across the JVM.</p>
</details>
<details><summary>2. Why does an annotated method work from another bean but not from this.method()?</summary>
<p>The external call passes through the proxy; self-invocation goes directly to the target. Proxy advice is not applied on that internal call in normal proxy mode.</p>
</details>
<details><summary>3. Does injecting a prototype into a singleton create a fresh object per request?</summary>
<p>No. Ordinary injection resolves it while constructing the singleton. Request a fresh instance through an appropriate provider or scoped mechanism when that lifetime is actually required.</p>
</details>

## Sources

- [Bean scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- [Lifecycle callbacks](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)
- [AOP proxying](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
