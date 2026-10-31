# Custom exceptions: implement, throw, catch, and expose safely

> **Interview answer:** Define a custom exception when callers need a meaningful domain failure type or structured context. Extend `Exception` for a checked contract or `RuntimeException` for an unchecked contract. Preserve the cause when translating an underlying failure, and handle it only at a layer that can recover or map it appropriately.

## Interview question: implement an insufficient-balance exception

The example implements both unchecked and checked custom exceptions, prevents invalid withdrawal, and demonstrates cause preservation. Save as `CustomExceptionDemo.java`; run `javac CustomExceptionDemo.java` and `java CustomExceptionDemo`.

```java runnable=CustomExceptionDemo
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

class InsufficientBalanceException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private final long requested;
    private final long available;

    InsufficientBalanceException(long requested, long available) {
        super("Insufficient balance: requested " + requested
            + ", available " + available);
        this.requested = requested;
        this.available = available;
    }

    long requested() { return requested; }
    long available() { return available; }
}

class CatalogLoadException extends Exception {
    private static final long serialVersionUID = 1L;

    CatalogLoadException(String message, Throwable cause) {
        super(message, cause);
    }
}

public class CustomExceptionDemo {
    static long withdraw(long balance, long amount) {
        if (balance < 0 || amount <= 0) {
            throw new IllegalArgumentException("Invalid withdrawal input");
        }
        if (amount > balance) {
            throw new InsufficientBalanceException(amount, balance);
        }
        return balance - amount;
    }

    static String readCatalog(Path path) throws CatalogLoadException {
        try {
            return Files.readString(path);
        } catch (IOException failure) {
            throw new CatalogLoadException("Catalog could not be loaded", failure);
        }
    }

    public static void main(String[] args) throws IOException {
        long balance = 50;
        try {
            balance = withdraw(balance, 75);
        } catch (InsufficientBalanceException failure) {
            System.out.println(failure.getMessage());
            System.out.println("Requested: " + failure.requested());
        }
        System.out.println("Balance unchanged: " + balance);

        Path directory = Files.createTempDirectory("catalog-demo-");
        try {
            readCatalog(directory.resolve("missing.txt"));
        } catch (CatalogLoadException failure) {
            System.out.println("Cause is IOException: "
                + (failure.getCause() instanceof IOException));
        } finally {
            Files.delete(directory);
        }
    }
}
```

Expected output:

```text
Insufficient balance: requested 75, available 50
Requested: 75
Balance unchanged: 50
Cause is IOException: true
```

This is single-threaded mechanics, not a concurrent bank implementation. Real balance changes need atomic database conditions or correctly designed locking/transactions. In production, financial details may be sensitive; do not expose the example's detailed message indiscriminately.

## Interview question: checked or unchecked?

Choose a checked exception when the method contract intentionally requires callers to acknowledge a failure, such as a catalog-loading operation whose caller can choose an alternate source.

Choose an unchecked exception for a violated usage contract or a domain failure your application handles centrally. A business failure can be recoverable even if unchecked. The compiler's rule does not decide business recoverability.

`throw` raises an instance now; `throws` declares possible propagation in a method signature. A checked exception must ordinarily be caught or declared. Runtime exceptions can be declared for clarity but do not require it.

## Interview question: which constructors should I provide?

Common constructors accept a message, a cause, or both. Call `super(message, cause)` rather than copying only `cause.getMessage()`: the latter loses the diagnostic chain and can itself fail if the cause is null.

Add immutable structured fields only when callers need them. Avoid storing entire requests, mutable entities, or secret credentials in an exception. Exceptions can remain reachable through logs, futures, or error tracking.

`serialVersionUID` controls compatibility if this serializable exception is serialized; it does not make Java native serialization an appropriate public API format.

## Interview question: catch order and multi-catch

Catch a specific subtype before its parent. Catching `Exception` first makes a later subtype catch unreachable. Multi-catch can combine unrelated alternatives, but cannot combine a type with its own subtype.

Do not catch a domain exception only to return an empty success. The demo's main method is the boundary that reports the failure; the withdrawal function propagates it without duplicating logs.

## Interview question: map a custom exception in Spring Boot

In a Boot 3.x application, extract `InsufficientBalanceException` into its own appropriately visible class. This handler assumes it is accessible in the handler package:

```java
@org.springframework.web.bind.annotation.RestControllerAdvice
public class ApiExceptionHandler {
    @org.springframework.web.bind.annotation.ExceptionHandler(
        InsufficientBalanceException.class)
    public org.springframework.http.ProblemDetail insufficientBalance(
            InsufficientBalanceException failure) {
        var problem = org.springframework.http.ProblemDetail.forStatusAndDetail(
            org.springframework.http.HttpStatus.CONFLICT,
            "The withdrawal cannot be completed with the current balance."
        );
        problem.setTitle("Insufficient balance");
        problem.setProperty("code", "INSUFFICIENT_BALANCE");
        return problem;
    }
}
```

409 is a deliberate choice for a conflict with current resource state, not a universal code for every business exception. Define your API's contract consistently. The response does not expose the internal balance, stack trace, or infrastructure cause.

Handle validation errors separately and log unexpected failures at an appropriate server boundary. Do not introduce a broad catch that converts all exceptions into this business error.

## Interview question: will this roll back a transaction?

Under ordinary Spring defaults, the unchecked insufficient-balance exception triggers rollback **if it leaves the transactional method and the call crosses the transaction proxy**. The checked catalog exception needs configured rollback rules if it should roll back. Catching and returning normally can change what the interceptor observes.

An exception does not undo mutations automatically in plain Java. The demo preserves the balance because validation happens before the result is assigned, not because RuntimeException magically rolls back memory.

## Self-checks

<details><summary>1. Why call super(message, cause)?</summary>
<p>The custom message adds domain context while the cause preserves the underlying type and diagnostic chain. Copying only a message discards evidence about the original failure.</p>
</details>
<details><summary>2. Does throwing a custom exception undo earlier field mutations?</summary>
<p>No. Plain Java has no automatic memory rollback. Validate before mutation or design explicit atomic operations. Database transactions are a separate configured mechanism.</p>
</details>
<details><summary>3. Should a controller catch every exception and return 200 with success=false?</summary>
<p>No. That creates misleading success-shaped responses and loses useful HTTP semantics. Map known failures deliberately and keep unexpected failures observable without exposing secrets.</p>
</details>

## Read next and sources

Continue with [resource handling](exceptions.md), [Spring transactions](../spring-boot/transactions.md), and [REST errors](../spring-boot/rest.md).

- [Throwable constructors and causes](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html)
- [Java exception checking](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html)
- [Spring structured error responses](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html)
