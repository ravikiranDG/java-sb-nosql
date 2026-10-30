# Strings, immutability, and records

> **Interview answer:** An immutable object's observable state cannot change after construction. Immutability simplifies sharing, stable map keys, and reasoning. A final reference only prevents reassignment; it does not freeze the referenced object.

## String versus StringBuilder

`String` is immutable. Operations such as `toUpperCase()` return a result; they do not modify the original.

```java
String language = "java";
language.toUpperCase(java.util.Locale.ROOT);
System.out.println(language); // java

var builder = new StringBuilder();
for (int n = 0; n < 3; n++) {
    builder.append(n);
}
System.out.println(builder.toString()); // 012
```

Use a builder for repeated incremental construction. Repeated concatenation of a growing immutable string in a loop can copy accumulated content repeatedly and lead to quadratic work. Do not mechanically replace short, readable concatenations; compilers and runtimes optimize many ordinary expressions.

`StringBuilder` is not thread-safe. `StringBuffer` synchronizes individual operations, but does not automatically make a multi-operation business workflow atomic.

## Make a value object genuinely immutable

```java
record Team(String name, java.util.List<String> members) {
    Team {
        java.util.Objects.requireNonNull(name);
        members = java.util.List.copyOf(members);
    }
}
```

The defensive copy stops the caller changing the list through an alias. Strings are immutable, so the elements are safe here too. If the elements were mutable `Member` objects, copying only the list would not freeze them.

`Collections.unmodifiableList(original)` wraps the original: someone retaining `original` can still mutate what the wrapper shows. `List.copyOf()` provides an unmodifiable snapshot of the elements, not a deep copy.

To design a normal immutable class: prevent unsafe subclass mutation, keep fields private and final, validate construction, avoid mutators, defensively copy mutable inputs and outputs, and do not leak `this` before construction completes.

## Records are shallowly immutable

A record generates accessors, construction machinery, and value-oriented `equals()`, `hashCode()`, and `toString()`. Component fields are final. Referenced objects can still mutate unless you protect them.

A record with an array component does not automatically gain element-by-element array equality. For records with sensitive fields, generated `toString()` may expose those fields if logged.

## Character count is not always visible-character count

Java's `String.length()` counts UTF-16 code units, not necessarily Unicode code points or user-perceived characters. An emoji can require two code units; combining sequences can contain multiple code points.

This matters in interview algorithms: a 26-element array assumes lowercase English letters, not arbitrary strings. State that assumption before indexing with `character - 'a'`.

## Self-checks

<details><summary>1. Is final List&lt;String&gt; immutable?</summary>
<p>No. The reference cannot be reassigned, but add or remove may still mutate the list. Use an appropriate immutable or unmodifiable representation and consider element mutability.</p>
</details>
<details><summary>2. Is an unmodifiable view the same as a defensive copy?</summary>
<p>No. A view can reflect changes through the original mutable reference. A defensive copy separates the container's state, although a shallow copy still shares elements.</p>
</details>
<details><summary>3. Why is String a good map key?</summary>
<p>It has content-based equality and a hash based on immutable content. A stored string cannot change its equality-relevant state and invalidate the map's bucket placement.</p>
</details>

## Sources

- [String](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)
- [Record](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Record.html)
- [List.copyOf](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)
