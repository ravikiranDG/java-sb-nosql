# Exceptions and resource handling

> **Interview answer:** Checked exceptions generally must be caught or declared. Runtime exceptions do not have that compile-time requirement. Choose exceptions according to the API contract and recovery responsibility, preserve the cause, and release resources deterministically.

## Checked versus unchecked

| Type | Example | Reason about it this way |
|---|---|---|
| Checked exception | `IOException` | Caller must explicitly handle or propagate |
| Runtime exception | `IllegalArgumentException` | Often invalid input or violated usage contract |
| Error | `OutOfMemoryError` | Serious runtime condition; not normal business control flow |

The compiler's rule does not mean all checked failures are recoverable or all runtime failures are programmer errors. Frameworks often translate storage failures into unchecked exceptions.

Avoid `catch (Exception e) { return null; }`: it erases the difference between "not found" and "dependency failed."

## Close resources reliably

```java
static String readFirstLine(java.nio.file.Path path) throws java.io.IOException {
    try (var reader = java.nio.file.Files.newBufferedReader(path)) {
        return reader.readLine();
    }
}
```

Try-with-resources closes `AutoCloseable` resources when the block exits, including exceptional exit. Multiple resources close in reverse declaration order.

If the body throws and closing also throws, the body's exception stays primary; close failures are attached as suppressed exceptions. This preserves the main failure without hiding cleanup failures.

## finally does not mean absolutely always

A `finally` block usually executes when control leaves a `try`, including a return. It is not guaranteed after forced process termination or runtime shutdown.

Never return from `finally`: it can replace an earlier return or suppress an exception. Avoid catching a failure only to log it and rethrow it repeatedly through every layer. Log once where context and ownership are sufficient.

When translating an exception, preserve the cause:

```java
throw new IllegalStateException("Could not load catalog", originalException);
```

The line assumes `originalException` is the caught failure. Do not include passwords, tokens, or unrestricted request data in error messages.

## Optional is absence, not failure

`Optional<T>` makes an absent result explicit. It does not replace exceptions for infrastructure failure.

```java
java.util.Optional<String> value = java.util.Optional.of("java");
String result = value.orElseGet(() -> "fallback");
```

`orElse(expensiveCall())` evaluates the argument even when the optional is present. `orElseGet()` invokes its supplier only when absent. Avoid calling `get()` without establishing presence.

## Self-checks

<details><summary>1. What happens when both a try body and close() throw?</summary>
<p>The body failure remains primary. The close failure is available through getSuppressed(). If only close fails, that close failure is propagated.</p>
</details>
<details><summary>2. Should an API return 404 after a database timeout?</summary>
<p>No. Not found means the lookup succeeded and no resource exists. A timeout is a dependency or service failure and should be represented as such without leaking internal details.</p>
</details>
<details><summary>3. Why preserve an exception's cause?</summary>
<p>The high-level message explains the business context while the cause retains the underlying diagnostic chain. Replacing it with only a message makes troubleshooting much harder.</p>
</details>

## Sources

- [Java exception rules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html)
- [Try-with-resources semantics](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3)
- [Optional](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html)
