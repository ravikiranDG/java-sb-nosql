# Java interview question bank: 24 essential questions

> **Interview answer:** Strong Java answers combine the language contract, a concrete example, and a boundary where the usual shortcut stops being true. Practice the model answers aloud, then answer each follow-up without memorizing only the first sentence.

## How to use this bank

These are curated, commonly encountered preparation topics, not a measured ranking of interview frequency. **Must know** marks foundational questions; **Deeper follow-up** marks questions often used to probe experience. The implementation chapters are linked where a complete worked example is more useful than a short answer.

## Q1. What is the difference between ==, equals(), and hashCode()?

**Priority: Must know. Model answer:** `==` compares primitive values or reference identity. `equals()` compares logical equality as defined by the class; its default implementation is identity. Equal objects must have equal hash codes, but equal hashes do not prove equality.

**Example:** Two separately constructed strings can be `equals()`-equal while `==` is false. A HashMap locates candidates using hashes, then checks equality.

**Trap:** Overriding only `equals()` can break hash-based lookup.

**Follow-up:** Why does changing an equality-relevant field of a stored key break lookup? Explain the bucket chosen at insertion. [Worked examples](equality.md).

## Q2. Comparable versus Comparator: which should I implement?

**Priority: Must know. Model answer:** Comparable gives the type one natural ordering through `compareTo`. Comparator supplies a separate policy through `compare`, allowing salary, name, or other orderings without changing the class.

**Example:**

```java
Comparator<Employee> order = Comparator.comparingInt(Employee::salary)
    .reversed().thenComparing(Employee::name);
```

This assumes the `Employee` type from the [ordering implementation](ordering.md). Salary is descending; names within a salary are ascending.

**Trap:** Subtraction can overflow, and comparator result zero can deduplicate different objects in TreeSet.

**Follow-up:** What happens if `reversed()` is applied after the entire chain?

## Q3. How does HashMap work, and why can a key become unreachable?

**Priority: Must know. Model answer:** A hash chooses a bucket; collision handling compares candidate keys. HashMap can resize and redistribute entries. Expected basic-operation cost is constant with suitable hashing, not an unconditional guarantee.

**Example:** Insert a key whose hash depends on email, then change its email. The entry stays positioned using the old hash while lookup can use the new one.

**Trap:** A hash code is not a unique ID.

**Follow-up:** Explain load factor, resizing cost, and why implementation-specific treeification does not justify promising every operation is O(1). [Collections](collections.md).

## Q4. ArrayList versus LinkedList: when is insertion faster?

**Priority: Must know. Model answer:** ArrayList has constant-time indexed access and amortized constant-time append; middle changes shift elements. LinkedList has linear indexed access. Inserting at a known node can be cheap, but finding that node is not.

**Example:** Repeated `get(i)` traversal over LinkedList can become quadratic. ArrayList usually offers better locality for ordinary iteration.

**Trap:** "LinkedList insertion is O(1)" omits the cost of locating the position.

**Follow-up:** Which collection would you choose for a queue? Explain why ArrayDeque is often preferable.

## Q5. What are fail-fast and so-called fail-safe iterators?

**Priority: Must know. Model answer:** Fail-fast iterators may detect unsupported structural changes and throw `ConcurrentModificationException`. Detection is best effort. "Fail-safe" is informal terminology; Java APIs instead document specific behavior, such as snapshot iteration or weak consistency.

**Example:** CopyOnWriteArrayList iterators see a snapshot. ConcurrentHashMap iterators are weakly consistent, not one atomic map snapshot.

**Trap:** The exception can occur in one thread; it does not mean two threads must be involved.

**Follow-up:** Why are copy-on-write collections expensive for frequent writes? [Iteration details](collections.md#iteration-and-concurrent-changes).

## Q6. What is the difference between final, finally, and finalize()?

**Priority: Must know. Model answer:** `final` restricts reassignment, overriding, or inheritance depending on its location. `finally` is a cleanup block normally executed when leaving a try. `finalize()` is an obsolete cleanup mechanism, deprecated for removal.

**Example:** A final list reference can still point to a mutable list.

**Trap:** Neither finally nor finalization is a guarantee after forced process termination. Do not use finalization to close a database connection.

**Follow-up:** Why can returning from finally suppress a failure? Prefer try-with-resources for closeable resources.

## Q7. How do you implement an immutable class?

**Priority: Must know. Model answer:** Validate construction, prevent unsafe subclass changes, keep state private, expose no mutators, and defensively copy mutable inputs and outputs. Consider referenced elements, not only the container.

**Example:** `List.copyOf(members)` protects the list structure, but does not freeze mutable member objects.

**Trap:** A record is shallowly immutable; generated final component fields do not deep-copy objects.

**Follow-up:** How does an unmodifiable view differ from a defensive copy? [Worked record example](strings.md).

## Q8. Is Java pass-by-value or pass-by-reference?

**Priority: Must know. Model answer:** Always pass-by-value. For an object argument, the copied value is a reference. The caller and parameter can initially point to the same object.

**Example:** Updating `box.value` is visible through the caller's reference. Assigning `box = new Box(...)` only changes the parameter.

**Trap:** Visible mutation does not prove pass-by-reference.

**Follow-up:** Can a method swap two caller variables by swapping its object parameters? Explain why not. [Runnable-style trace](memory.md#java-is-always-pass-by-value).

## Q9. Overloading versus overriding, and what about static methods?

**Priority: Must know. Model answer:** Overloads are selected at compile time using declared types and signatures. Overridden instance methods dispatch at runtime based on the receiver. Static methods are hidden, not overridden polymorphically.

**Example:** A parent reference containing a child calls the child's overridden instance method.

**Trap:** Changing only the return type does not create an overload. Private methods are not overridden.

**Follow-up:** What changes if the chosen method is final? [Object-oriented design](oop.md).

## Q10. Interface versus abstract class?

**Priority: Must know. Model answer:** An interface expresses a capability implemented by unrelated types. An abstract class can share instance state, construction rules, and implementation. Java allows multiple implemented interfaces but only one superclass.

**Example:** A checkout has a PaymentGateway; it is not a type of PaymentGateway. Constructor injection expresses composition.

**Trap:** Interfaces can have default methods, so "interfaces have no implementations" is outdated.

**Follow-up:** How can two conflicting default methods be resolved by the implementing class?

## Q11. How do you implement and choose a custom exception?

**Priority: Must know. Model answer:** Extend Exception for a checked contract or RuntimeException for an unchecked contract. Supply meaningful constructors, preserve causes, and add immutable domain fields only when callers need them.

**Example:** An InsufficientBalanceException can carry the requested amount; a CatalogLoadException can wrap IOException using `super(message, cause)`.

**Trap:** Extending RuntimeException does not make every failure unrecoverable or automatically undo field mutations.

**Follow-up:** Where should the exception be caught, logged, or mapped to an HTTP response? [Complete implementation](custom-exceptions.md).

## Q12. What happens if both the try body and resource close fail?

**Priority: Must know. Model answer:** In try-with-resources, the body exception stays primary and close failures are suppressed. Multiple resources close in reverse declaration order.

**Example:** Inspect `failure.getSuppressed()` when debugging a failed body followed by a failed close.

**Trap:** Returning a default from a broad catch can hide both failures as an apparently successful result.

**Follow-up:** Why should a translated exception preserve its cause rather than only its message? [Resource handling](exceptions.md).

## Q13. Can Java leak memory despite garbage collection?

**Priority: Must know. Model answer:** Yes. Garbage collection reclaims unreachable objects, not unwanted reachable ones. An unbounded static cache, listeners, or retained thread-local state can keep unused data alive.

**Example:** If a cache adds a unique request key forever, every cached value remains reachable.

**Trap:** Increasing heap may postpone the outage without fixing retention.

**Follow-up:** Explain how heap dumps, retained sizes, and paths to roots identify the owner. Distinguish heap exhaustion from stack overflow and native-memory pressure.

## Q14. What are JDK, JRE, JVM, and class loading?

**Priority: Must know. Model answer:** The Java Development Kit (JDK) supplies development tools and runtime components. Java Runtime Environment (JRE) describes runtime components; modern distributions and custom runtime images differ from older separate-JRE packaging. The Java Virtual Machine (JVM) executes bytecode and manages runtime facilities.

Class loading finds class definitions; linking verifies and prepares them; initialization executes class initialization when required. Parent delegation is common but custom loaders can change loading policies.

**Trap:** Two classes with the same name loaded by different defining class loaders can be different runtime types.

**Follow-up:** Why can a retained class loader prevent its classes' metadata from being released?

## Q15. Is volatile enough to make a counter thread-safe?

**Priority: Must know. Model answer:** No. Volatile establishes visibility and ordering for that variable; increment is a read-modify-write sequence. Use AtomicInteger or a lock for an atomic increment.

**Example:** Two threads can read 5 and both write 6, losing one update.

**Trap:** Sleeping or polling an ordinary field does not establish the required visibility guarantees.

**Follow-up:** What if you must update both a balance and a reservation count consistently? A single atomic variable does not protect a multi-field invariant.

## Q16. ConcurrentHashMap versus synchronized HashMap?

**Priority: Must know. Model answer:** ConcurrentHashMap supports concurrent access with documented per-operation guarantees and rejects null keys and values. A synchronized wrapper serializes its wrapped methods, and iteration typically needs external synchronization on the wrapper.

**Example:** Use `merge(key, 1, Integer::sum)` for an atomic per-key count rather than get-then-put.

**Trap:** A thread-safe map does not make a sequence of independent calls atomic.

**Follow-up:** Why should a compute function avoid long blocking operations and unnecessary recursive map modifications?

## Q17. How do deadlocks occur, and how do you diagnose them?

**Priority: Must know. Model answer:** Threads form a dependency cycle: one holds lock A and waits for B while another holds B and waits for A. Use a consistent acquisition order and short critical sections.

**Example:** Account transfers lock accounts in the same stable order rather than always locking "from" first.

**Trap:** Thread starvation or slow I/O is not automatically a deadlock.

**Follow-up:** Use a thread dump to identify owners, waiters, and the cycle. Timed acquisition can support failure handling but needs careful release and policy. [Concurrency](concurrency.md).

## Q18. Runnable, Callable, executors, and Future: how do they differ?

**Priority: Must know. Model answer:** Runnable has no return value; Callable returns a value and can throw checked exceptions. An executor schedules work. Future represents eventual completion, including failure and cancellation.

**Example:** `future.get()` waits and can expose failure through ExecutionException. `submit()` can capture failures in a future, so ignoring the future may hide them.

**Trap:** Fixed-thread-pool factories use an unbounded queue; bounded thread count does not mean bounded pending work.

**Follow-up:** How do you handle interruption, rejection, shutdown, and request deadlines?

## Q19. Why is List<Integer> not a List<Number>?

**Priority: Must know. Model answer:** Generic containers are invariant. If an integer list were a number list, a caller could insert a Double and violate its element type.

Use `? extends Number` to read number values; use `? super Integer` to insert integers. Remember "producer extends, consumer super."

**Trap:** An extends wildcard is not an immutable collection. Type erasure does not mean compile-time generic checks are useless.

**Follow-up:** Why is `instanceof List<String>` not permitted? [Generics examples](collections.md#generics-and-wildcard-bounds).

## Q20. Stream map versus flatMap, and why does a pipeline sometimes do nothing?

**Priority: Must know. Model answer:** Map transforms one element into one result. FlatMap transforms an element into a stream and flattens the results. Intermediate operations are lazy; a terminal operation requests traversal.

**Example:** Mapping lists to streams creates a stream of streams; flat-mapping `Collection::stream` yields the inner elements.

**Trap:** A stream is single-use, and side effects in intermediate operations are not a dependable execution contract.

**Follow-up:** Why does `toMap` need a policy for duplicate keys? When is a loop clearer than a stream?

## Q21. Why use Optional, and how do eager fallbacks cause surprises?

**Priority: Deeper follow-up. Model answer:** Optional represents absence, not an infrastructure error. `orElse(expensive())` evaluates eagerly; `orElseGet(...)` invokes the supplier only when needed.

**Example:** An existing optional value still evaluates a database lookup passed to `orElse(...)`. Use a supplier with `orElseGet(...)` when the fallback should be lazy.

**Trap:** An empty optional means absence, not "the database timed out." Never convert every failure into an empty optional.

**Follow-up:** Why is calling `get()` without establishing presence unsafe? When is a direct value or exception a clearer contract?

## Q22. Serializable, transient, and serialVersionUID: what do they do?

**Priority: Deeper follow-up. Model answer:** Serializable participates in Java native object serialization. Transient excludes a field from default serialization; static fields are not serialized as instance state. serialVersionUID identifies a serialization compatibility version.

**Example:** A transient cached calculation can be recomputed after deserialization.

**Trap:** Transient does not automatically suppress a field in every JSON serializer or log output. Deserializing arbitrary untrusted native-serialization input is unsafe.

**Follow-up:** Why are explicit validated data-transfer formats often preferable at service boundaries?

## Q23. thenApply versus thenCompose in CompletableFuture?

**Priority: Deeper follow-up. Model answer:** thenApply maps a result. thenCompose flattens a function returning another future. thenCombine joins independent results. Choose executors and observe exceptional completion deliberately.

**Example:** Fetching an account, then asynchronously fetching its orders requires composition rather than a nested future.

**Trap:** A future timeout does not necessarily stop the underlying socket operation.

**Follow-up:** Which thread runs a non-async callback? Why can blocking the common pool hurt unrelated work? [Future examples](streams.md#completablefuture-compose-dependent-work).

## Q24. Implement the longest substring with distinct characters

**Priority: Must know coding pattern. Model answer:** Maintain a window with no repeated character. The left boundary must never move backward. When a character repeats inside the window, move the left boundary past its previous position, then update the inclusive window length.

This runnable variant counts Unicode code points, not UTF-16 code units or user-perceived grapheme clusters. It allocates a code-point array, so both time and extra space are O(n). For a lowercase-only question, a 26-slot frequency array is another valid approach.

Save as `DistinctWindowDemo.java`.

```java runnable=DistinctWindowDemo
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class DistinctWindowDemo {
    static int longestDistinct(String text) {
        Objects.requireNonNull(text, "text");
        int[] characters = text.codePoints().toArray();
        Map<Integer, Integer> lastSeen = new HashMap<>();
        int start = 0;
        int longest = 0;
        for (int end = 0; end < characters.length; end++) {
            Integer previous = lastSeen.put(characters[end], end);
            if (previous != null) {
                start = Math.max(start, previous + 1);
            }
            longest = Math.max(longest, end - start + 1);
        }
        return longest;
    }

    public static void main(String[] args) {
        System.out.println(longestDistinct("eghghhgg"));
        System.out.println(longestDistinct("abba"));
        System.out.println(longestDistinct(""));
        System.out.println(longestDistinct("\uD83D\uDE00a\uD83D\uDE00b"));
    }
}
```

Expected output: `3`, `2`, `0`, and `3`, each on its own line.

**Trap:** In `"abba"`, the last `a` previously occurred outside the current window. Assigning `start = previous + 1` without the maximum moves the boundary backward and admits duplicates.

**Follow-up:** Trace every iteration and state the character-domain assumption before claiming a fixed-size array works.

## Self-checks

<details><summary>1. Give a 30-second explanation of Comparable versus Comparator.</summary>
<p>Comparable is the type's natural ordering through compareTo; Comparator is an external compare policy. Explain a salary/name ordering and the TreeSet consequence of comparison result zero.</p>
</details>
<details><summary>2. Explain why custom exception code should preserve a cause.</summary>
<p>The domain exception states what failed at the application level; the cause preserves the original diagnostic failure. Handle it at a boundary that can recover, report, or map it without pretending success.</p>
</details>
<details><summary>3. What makes a coding answer stronger than memorizing a pointer movement?</summary>
<p>A stated invariant, input assumptions, a trace including edge cases, and a justified time/space analysis. For a distinct window, every update must preserve no repeats and a nondecreasing left boundary.</p>
</details>

## Sources

- [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/)
- [Java language specification](https://docs.oracle.com/javase/specs/jls/se21/html/)
- [Java concurrency package](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [Serialization specification](https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/)
