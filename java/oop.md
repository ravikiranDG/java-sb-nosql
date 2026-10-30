# Object-oriented design

> **Interview answer:** Encapsulation protects invariants behind an object's operations. Abstraction exposes the useful contract while hiding implementation detail. Inheritance expresses a substitutable "is-a" relationship. Polymorphism lets callers use one contract while implementations provide different behavior.

## Explain it with a checkout

```java
interface PaymentGateway {
    String charge(long amountInMinorUnits);
}

final class CheckoutService {
    private final PaymentGateway gateway;

    CheckoutService(PaymentGateway gateway) {
        this.gateway = java.util.Objects.requireNonNull(gateway);
    }

    String checkout(long amountInMinorUnits) {
        if (amountInMinorUnits <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        return gateway.charge(amountInMinorUnits);
    }
}
```

The service depends on a capability, not a specific payment vendor. A test can supply a fake gateway. The constructor establishes a non-null dependency; the method protects the positive-amount invariant. This is composition and dependency injection without any Spring annotation.

## Overloading versus overriding

| Concept | Meaning | Selection |
|---|---|---|
| Overloading | Same name, different parameter lists | Compile time, based on declared types |
| Overriding | Subclass supplies an inherited instance method implementation | Runtime, based on receiver object |
| Static method hiding | Subclass declares a static method with same signature | Based on declared class/reference type |

```java
class Parent {
    String label() { return "parent"; }
}
class Child extends Parent {
    @Override String label() { return "child"; }
}
Parent value = new Child();
System.out.println(value.label()); // child
```

A return type alone cannot distinguish overloads. Private methods are not overridden. Final methods cannot be overridden. Constructors are not inherited.

## Interface versus abstract class

Use an interface for a capability that unrelated classes can implement. Interfaces can have default and static methods, but not per-instance mutable fields. A class can implement multiple interfaces.

Use an abstract class when implementations genuinely share state, protected implementation, and construction rules. Java supports only one superclass. Avoid choosing inheritance simply to save a few duplicated lines.

**Composition over inheritance:** a checkout *has a* gateway. It is not a kind of gateway. Composition reduces coupling to a parent's internal implementation.

## SOLID without slogans

SOLID groups five design guidelines:

- **Single responsibility:** separate pricing rules from email delivery because they change for different reasons.
- **Open/closed:** add a payment implementation through the interface rather than extending a growing type-switch everywhere.
- **Liskov substitution:** any gateway implementation must honor the contract; a subclass must not quietly reject inputs the parent promises to accept.
- **Interface segregation:** a read-only reporting client should not depend on write and delete operations.
- **Dependency inversion:** high-level checkout policy depends on a gateway abstraction, not a vendor library.

These are tradeoffs, not a demand to add an interface for every class. A premature abstraction can make a small program harder to understand.

## Self-checks

<details><summary>1. Is encapsulation just generating getters and setters?</summary>
<p>No. Unrestricted setters can expose every invalid state. Encapsulation is about keeping invariants intact through meaningful operations, such as reserveSeats(count), not merely hiding field syntax.</p>
</details>
<details><summary>2. Why can inheritance violate substitutability?</summary>
<p>A child may strengthen preconditions, weaken guarantees, or throw unsupported-operation errors for behavior callers expect from the parent. Shared method names alone do not prove an is-a relationship.</p>
</details>
<details><summary>3. Does dependency injection require a framework?</summary>
<p>No. Passing a dependency into a constructor is dependency injection. Spring automates object creation and wiring; it does not invent the underlying design principle.</p>
</details>

## Sources

- [Java classes and overriding](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html)
- [Java interfaces](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html)
