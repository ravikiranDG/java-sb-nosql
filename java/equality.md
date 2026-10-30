# ==, equals(), and hashCode()

> **Interview answer:** For primitives, `==` compares values after the applicable numeric conversions. For references, it compares object identity: do both references point to the same object? `equals()` is an instance method for logical equality, but a class must define that meaning. `Object.equals()` defaults to identity.

## Trace the difference

These statements can be run in Java's interactive shell, JShell:

```java
String a = "java";
String b = "java";
String c = new String("java");

System.out.println(a == b);       // true: same pooled literal
System.out.println(a == c);       // false: different objects
System.out.println(a.equals(c));  // true: same characters
System.out.println(java.util.Objects.equals(null, a)); // false
```

The string pool canonicalizes string literals and constant expressions. It does **not** make `==` a safe content comparison. A string read from a request may have the same content without being the same object. `intern()` returns a canonical representation, but is not a substitute for `equals()`.

For arrays, use `Arrays.equals()` for element equality, or `Arrays.deepEquals()` for nested reference arrays. An array's inherited `equals()` checks identity.

## The equals and hashCode contract

Equality must be reflexive, symmetric, transitive, consistent while relevant state is unchanged, and false for a non-null object's comparison to null.

**Equal objects must have equal hash codes. Unequal objects may have the same hash code.** A collision is not proof of equality.

```java
record EmployeeId(long value) {}

var first = new EmployeeId(7);
var second = new EmployeeId(7);
var employees = new java.util.HashMap<EmployeeId, String>();
employees.put(first, "Riya");
System.out.println(employees.get(second)); // Riya
```

A record generates component-based `equals()` and `hashCode()`. In a normal value class, override both together and use the same equality-relevant fields. Hash collections first narrow candidates using hashes and then check equality.

## Why mutable keys break lookups

Imagine inserting a key whose hash is based on `email`, then changing that email. The entry remains in the bucket chosen by the old hash. A later lookup computes the new hash and may search a different bucket.

The map did not lose the object. Your mutation violated the assumption that a stored key's equality and hash remain stable. Prefer immutable identifiers as keys.

## Boxed values and BigDecimal traps

```java
Integer x = 127, y = 127;
System.out.println(x == y); // true: required caching for these boxed constants
Integer p = 128, q = 128;
System.out.println(p.equals(q)); // true; do not rely on p == q

var amount1 = new java.math.BigDecimal("1.0");
var amount2 = new java.math.BigDecimal("1.00");
System.out.println(amount1.equals(amount2));    // false: scale matters
System.out.println(amount1.compareTo(amount2)); // 0: numerically equal
```

Unboxing a null `Integer` throws `NullPointerException`. `Objects.equals(a, b)` handles null references, but still uses the class's equality semantics. Do not compare monetary amounts using binary floating-point equality.

## Self-checks

<details><summary>1. Can two unequal objects have the same hashCode?</summary>
<p>Yes. Hash codes have a limited range. HashMap resolves collisions using equality; a hash is an indexing aid, not a unique identifier.</p>
</details>
<details><summary>2. Why should a String request parameter be compared with equals?</summary>
<p>Its identity depends on how it was created. Content equality must not depend on pooling. Use "admin".equals(value) when null is possible, while keeping authentication decisions separate from a raw string comparison.</p>
</details>
<details><summary>3. What if a class overrides equals but not hashCode?</summary>
<p>Two logically equal instances can inherit different identity-based hashes. HashMap or HashSet can then fail to find or deduplicate them as expected.</p>
</details>

## Read next and sources

Continue with [memory](memory.md) and [collections](collections.md).

- [Object equality and hashCode contracts](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html)
- [String API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)
- [BigDecimal equality](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html)
