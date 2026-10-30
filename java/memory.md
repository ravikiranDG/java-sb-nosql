# Java memory and garbage collection

> **Interview answer:** The Java Virtual Machine (JVM) executes bytecode and manages runtime memory. Each thread has a stack of method frames. Objects are conceptually allocated on the shared heap. Garbage collection reclaims heap objects that are no longer reachable; it does not prevent leaks caused by unwanted references.

## The memory map

| Area | What belongs here | Typical failure |
|---|---|---|
| Thread stack | Frames, local variables, operand stacks | Deep recursion causes `StackOverflowError` |
| Heap | Objects and arrays | Retained objects exhaust heap: `OutOfMemoryError` |
| Metaspace in HotSpot | Class metadata, largely outside Java heap | Class-loader leaks can exhaust native memory |
| Other native memory | Thread stacks, direct buffers, code cache, runtime overhead | Container can run out of memory even with heap space left |

A local reference can be in a stack frame while the object it points to is on the heap. An object's primitive fields are part of the object, not automatically separate stack variables. Runtime optimizations can eliminate allocations, so this is a programming model, not an instruction-by-instruction physical guarantee.

`-Xmx` limits the maximum Java heap, not the total process memory.

## Java is always pass-by-value

```java
class Box {
    int value;
    Box(int value) { this.value = value; }
}
void change(Box box) {
    box.value = 2;
    box = new Box(3);
}
Box original = new Box(1);
change(original);
System.out.println(original.value); // 2, not 3
```

The copied value is a reference. Both references initially point to the same object, so mutation is visible. Reassigning the parameter changes only the local copy. The snippet uses JShell-style declarations.

## What makes an object collectible?

Collectors trace reachability from roots such as live-thread references, static fields of reachable classes, and native references. An unreachable cycle is collectible: reference counting is not Java's general collection model.

Collection is not immediate when a local variable goes out of scope, and `System.gc()` is only a request. Do not depend on it for timely resource cleanup.

The HotSpot Garbage-First (G1) collector is generational and balances throughput with pause targets. The Z Garbage Collector (ZGC) targets low pauses using more concurrent work. Exact defaults, implementation details, and tuning options depend on the Java version and environment. Measure before choosing flags.

## A leak without manual memory management

```java
// Illustrative anti-pattern: no size bound or expiry.
static final java.util.Map<String, byte[]> CACHE =
    new java.util.concurrent.ConcurrentHashMap<>();
```

If every request stores a new key forever, every value stays reachable. Other common causes include unremoved listeners, long-lived thread-local values, and queues that grow faster than consumers can drain them.

Fix retention: bounded caches with expiry, explicit listener cleanup, `ThreadLocal.remove()` in `finally`, and bounded queues with backpressure. Increasing heap can delay the failure without addressing it.

## Diagnose before tuning

1. Establish whether the problem is heap retention, excessive allocation, native memory, or thread growth.
2. Compare memory and garbage-collection pause metrics over time. A rising post-collection heap is different from temporary allocation spikes.
3. Use Java Flight Recorder (JFR) for allocation and runtime evidence; use heap dumps to inspect retained objects and paths to roots.
4. Inspect the retaining owner, fix it, and compare the same workload again.

Commands such as `jcmd <pid> GC.heap_info` and `jcmd <pid> JFR.start duration=60s filename=recording.jfr` require access to the target JVM. Heap dumps and recordings can contain sensitive application data; collect and store them securely. Heap dumps can also pause applications and need substantial disk space.

## Self-checks

<details><summary>1. Can an unreachable pair of objects pointing at each other be collected?</summary>
<p>Yes. If no root can reach either object, the cycle does not keep them alive.</p>
</details>
<details><summary>2. Why can a container be killed even when heap usage is below Xmx?</summary>
<p>Its memory budget also includes native stacks, direct buffers, metaspace, code cache, and runtime overhead. The container limit is not a heap-only limit.</p>
</details>
<details><summary>3. Is garbage collection responsible for closing a database connection?</summary>
<p>No. Close connections, streams, and other resources deterministically, normally using try-with-resources. A connection leak can exhaust a pool before heap memory becomes a problem.</p>
</details>

## Sources

- [JVM runtime data areas](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)
- [Java 21 garbage collection guide](https://docs.oracle.com/en/java/javase/21/gctuning/)
- [jcmd diagnostics](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)
