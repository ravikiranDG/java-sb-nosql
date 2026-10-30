# Threads and concurrency

> **Interview answer:** Concurrency is managing overlapping work; parallelism is executing work simultaneously. Correct concurrent code must preserve invariants and establish visibility between threads. A thread-safe collection does not make an arbitrary sequence of operations atomic.

## Atomicity, visibility, and ordering

| Tool | Guarantees | Does not guarantee |
|---|---|---|
| `synchronized` | Mutual exclusion and visibility via the same monitor | Protection for accesses that bypass the locking discipline |
| `volatile` | Visibility and ordering for accesses to that variable | Atomicity of `count++` or multi-field invariants |
| `AtomicInteger` | Atomic single-variable operations | An atomic workflow spanning independent variables |
| `Lock` | Explicit coordination; options such as timed acquisition | Automatic unlock when you forget `finally` |

`count++` is a read-modify-write sequence. Two threads can read the same old value and overwrite each other's increments.

```java
var count = new java.util.concurrent.atomic.AtomicInteger();
try (var executor = java.util.concurrent.Executors.newFixedThreadPool(4)) {
    for (int i = 0; i < 1000; i++) {
        executor.submit(() -> count.incrementAndGet());
    }
}
System.out.println(count.get()); // 1000; Java 21 close waits for completion
```

In Java 21, `ExecutorService` supports try-with-resources. For larger workloads, also choose bounded submission or admission control: fixed-thread-pool factories use an unbounded queue.

## The happens-before mental model

Unlocking a monitor happens-before a later lock of the same monitor. A volatile write happens-before a subsequent read of that variable. These rules make preceding writes visible under the specified synchronization.

Do not explain volatile as "all variables always come from main memory." That is not the language-level model. Neither `Thread.sleep()` nor repeated polling of an ordinary field establishes visibility.

## Deadlocks and interruption

A deadlock can occur when thread A holds lock 1 and waits for lock 2 while thread B holds lock 2 and waits for lock 1. Use a consistent lock-acquisition order; keep critical sections short; avoid external calls while holding locks.

`wait()` releases the monitor and must be called while owning it. Check the condition in a `while` loop because wakeups can be spurious and conditions can change. `sleep()` does not release a held monitor.

Interruption is cooperative cancellation. If you cannot propagate `InterruptedException`, restore the flag and stop the operation appropriately:

```java
try {
    Thread.sleep(100);
} catch (InterruptedException interrupted) {
    Thread.currentThread().interrupt();
    throw new IllegalStateException("Operation interrupted", interrupted);
}
```

## Virtual threads: cheaper waiting, not unlimited capacity

Java 21 virtual threads let many blocking tasks share fewer operating-system threads. They benefit high-concurrency waiting workloads; they do not make a processor-bound calculation intrinsically faster.

Do not pool virtual threads merely to reuse them. Limit scarce dependencies separately with connection pools, semaphores, and request admission limits. A database with 50 connections still has 50 connections.

Version matters: blocking while holding certain monitors can pin virtual threads in Java 21. Later JDKs change important pinning behavior; do not generalize a Java 21 limitation to every release.

## Self-checks

<details><summary>1. Does volatile int count make count++ safe?</summary>
<p>No. It gives visibility and ordering, but the increment is still multiple steps. Use an atomic increment or lock around the full operation.</p>
</details>
<details><summary>2. Is a Spring singleton automatically thread-safe?</summary>
<p>No. Concurrent requests share the same bean instance. Keep request-specific mutable state local, use immutable collaborators, and synchronize genuinely shared state.</p>
</details>
<details><summary>3. Why can adding threads make latency worse?</summary>
<p>Threads can contend for processor time, locks, memory, or a limited connection pool. Unbounded queues also hide overload until tail latency and memory usage grow dramatically.</p>
</details>

## Sources

- [Java memory model](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html)
- [Concurrency package](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [Virtual threads in Java 21](https://openjdk.org/jeps/444)
- [Later monitor-pinning improvements](https://openjdk.org/jeps/491)
