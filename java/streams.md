# Streams, lambdas, and modern Java

> **Interview answer:** A stream is a pipeline over data, not a data structure. Intermediate operations describe lazy transformations; a terminal operation triggers traversal. Prefer clear, side-effect-free transformations, and do not assume parallel streams are automatically faster.

## map, filter, and flatMap

```java
var names = java.util.List.of("java", "spring", "java");
var result = names.stream()
    .filter(name -> name.length() > 3)
    .map(String::toUpperCase)
    .distinct()
    .toList();
System.out.println(result); // [JAVA, SPRING]

var groups = java.util.List.of(java.util.List.of(1, 2), java.util.List.of(3));
System.out.println(groups.stream()
    .flatMap(java.util.Collection::stream)
    .toList()); // [1, 2, 3]
```

`map` transforms each element into one result. `flatMap` turns each element into a stream and flattens those streams. A stream can be consumed only once.

`Stream.toList()` returns an unmodifiable list. `Collectors.toList()` does not promise a particular implementation or mutability; use `toCollection(ArrayList::new)` when you require a mutable `ArrayList`.

## Collectors and duplicate keys

```java
var words = java.util.List.of("java", "spring", "java");
var frequencies = words.stream().collect(
    java.util.stream.Collectors.groupingBy(
        word -> word,
        java.util.stream.Collectors.counting()
    )
);
System.out.println(frequencies.get("java")); // 2
```

`Collectors.toMap(keyMapper, valueMapper)` throws on duplicate keys. Provide a merge function only after deciding the business meaning of a collision; silently keeping an arbitrary value may hide a data error.

Do not mutate a shared `ArrayList` from a parallel `forEach`. Use a collector or an explicitly designed concurrency strategy. Stateful operations such as sorting need buffering; a stream is not automatically constant-memory.

## Lambdas and method references

A functional interface has one abstract method. `Predicate<T>` tests a value; `Function<T,R>` transforms it; `Consumer<T>` performs an action; `Supplier<T>` creates a result.

Captured local variables must be final or effectively final. This restricts reassignment of the variable, not mutation of a captured object. A method reference such as `String::length` is a compact way to express a compatible lambda.

## CompletableFuture: compose dependent work

`thenApply` maps a completed value. `thenCompose` flattens a function returning another future. `thenCombine` joins independent results. Non-async callbacks may run in the completing thread.

Choose an executor for blocking work; do not casually block the shared common pool. Set dependency-level timeouts as well as future-level timeouts. Timing out a future does not necessarily stop the underlying network request.

```java
try (var executor = java.util.concurrent.Executors.newFixedThreadPool(2)) {
    var first = java.util.concurrent.CompletableFuture.supplyAsync(() -> 20, executor);
    var second = java.util.concurrent.CompletableFuture.supplyAsync(() -> 22, executor);
    System.out.println(first.thenCombine(second, Integer::sum).join()); // 42
}
```

This is a mechanics example, not evidence that trivial arithmetic needs asynchronous execution. Preserve exceptional completion unless a fallback is valid and observable.

## Two interview coding patterns

**Longest distinct substring:** expand the right boundary, add its character, shrink from the left until the repeated character's count is one, then update `right - left + 1`. A 26-slot count array is valid only for lowercase English letters.

**Triangle triplets:** after sorting non-negative sides, fixing the largest lets you count `right - left` pairs when `nums[left] + nums[right] > largest`. Otherwise move `left`. Widen the sum to `long` to avoid integer overflow.

State the invariant before writing pointer movements. A plausible count formula without a justified set of distinct counted answers is not enough.

## Self-checks

<details><summary>1. Why might a stream pipeline do nothing?</summary>
<p>Intermediate operations are lazy. Without a terminal operation, no result is requested. Also avoid depending on side effects in intermediate operations; implementations can optimize away work not needed for the result.</p>
</details>
<details><summary>2. When is a parallel stream a bad fit?</summary>
<p>Small tasks, blocking calls, shared mutable state, costly splitting, or workloads competing for the common pool can be slower or unsafe. Benchmark the actual workload and consider explicit executors for service orchestration.</p>
</details>
<details><summary>3. What is the difference between thenApply and thenCompose?</summary>
<p>thenApply transforms T to U. If U is itself a future, the result is nested. thenCompose accepts a future-returning function and exposes the eventual value without that extra nesting.</p>
</details>

## Sources

- [Streams package](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html)
- [Collectors](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html)
- [CompletableFuture](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
