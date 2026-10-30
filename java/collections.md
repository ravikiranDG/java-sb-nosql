# Collections and generics

> **Interview answer:** Choose collections by required operations, ordering, uniqueness, concurrency, and cost. `ArrayList` is usually a good general list; `HashMap` provides expected constant-time key access with suitable hashing; a sorted map trades that for ordering and logarithmic operations.

## Choose deliberately

| Collection | Good for | Important cost or constraint |
|---|---|---|
| `ArrayList` | Indexed reads, appends, iteration | Read O(1); append amortized O(1); middle insertion/removal O(n) |
| `LinkedList` | Specialized node-based operations | Indexed access O(n); finding a node is not free |
| `ArrayDeque` | Stack or queue | Amortized O(1) end operations; rejects null |
| `HashMap` / `HashSet` | Lookup / uniqueness | Expected O(1) with good hashes; no iteration-order guarantee |
| `LinkedHashMap` | Predictable encounter order | Extra links and memory; can support access order |
| `TreeMap` / `TreeSet` | Sorted keys and range queries | O(log n) basic operations; comparator defines key equivalence |
| `PriorityQueue` | Repeated smallest/largest selection | Peek O(1), offer/poll O(log n); iteration is not sorted |
| `ConcurrentHashMap` | Shared concurrent key-value state | No null keys/values; use atomic compound operations |

These costs exclude user-supplied equality/comparator work. A linked list is not automatically faster for insertion if you first search for the position.

## HashMap under the hood

A hash chooses a bucket. Colliding keys require further comparison. Resizing redistributes entries when the load threshold is crossed, so a single insertion can be expensive even when average cost is small.

Modern OpenJDK can turn sufficiently crowded buckets into balanced trees under implementation-specific conditions. Do not promise unconditional O(1), depend on exact thresholds without a version, or assume hashes are unique.

```java
var counts = new java.util.HashMap<String, Integer>();
for (String word : java.util.List.of("java", "spring", "java")) {
    counts.merge(word, 1, Integer::sum);
}
System.out.println(counts.get("java")); // 2
```

`get()` returning null may mean absent or a present null value in `HashMap`. Use `containsKey()` when the distinction matters. Prefer [immutable keys](equality.md#why-mutable-keys-break-lookups).

## Generics and wildcard bounds

`List<Integer>` is **not** a subtype of `List<Number>`. Otherwise a caller could insert a `Double` into an integer list.

```java
static double total(java.util.List<? extends Number> values) {
    double sum = 0;
    for (Number value : values) sum += value.doubleValue();
    return sum;
}

static void addDefaults(java.util.List<? super Integer> target) {
    target.add(1);
    target.add(2);
}
```

**Producer extends, consumer super:** read number values from `? extends Number`; insert integers into `? super Integer`. Reading from the latter only guarantees `Object`. An extends wildcard is not immutable: operations such as `clear()` can still be allowed.

Type erasure removes most generic type arguments at runtime. It explains why you cannot do `new T()` or `instanceof List<String>`. Avoid raw types: they discard compile-time checks.

## Iteration and concurrent changes

For supported collections, remove during iteration using the iterator's own `remove()`, or use `removeIf()`. Structural changes behind a fail-fast iterator can produce `ConcurrentModificationException`, even in one thread.

Fail-fast detection is best effort, not a synchronization mechanism. `ConcurrentHashMap` iterators are weakly consistent, not an atomic snapshot of the entire map.

## Self-checks

<details><summary>1. Is contains() on an ArrayList constant-time?</summary>
<p>No. It generally scans elements, so it is O(n). Fast indexed access does not imply fast search by value.</p>
</details>
<details><summary>2. Why can TreeSet disagree with HashSet about duplicates?</summary>
<p>TreeSet treats comparator result zero as equivalent for membership; HashSet uses hashCode and equals. An ordering inconsistent with equals, such as BigDecimal's natural ordering, can produce different set sizes.</p>
</details>
<details><summary>3. Does ConcurrentHashMap make get-then-put atomic?</summary>
<p>No. Each operation can be safe while the sequence races. Use merge, compute, putIfAbsent, or a suitable lock for the complete invariant.</p>
</details>

## Sources

- [Java collections package](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)
- [HashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [ConcurrentHashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html)
