# Comparable versus Comparator: implementation and interview questions

> **Interview answer:** `Comparable<T>` defines a class's natural ordering through `compareTo(T other)`. `Comparator<T>` defines an external ordering through `compare(T first, T second)`. Use Comparable for a sensible default and Comparator for alternative sort policies or types you cannot modify.

## Must-know comparison

| Question | Comparable | Comparator |
|---|---|---|
| Package | `java.lang` | `java.util` |
| Method | `compareTo(other)` | `compare(first, second)` |
| Where is the rule? | Inside the compared type | Separate object, lambda, or method reference |
| How many policies? | One natural ordering per type | Many independent policies |
| Requires changing the type? | Usually yes | No |
| Common use | Numbers, strings, dates, domain natural order | Salary order, name order, null handling, UI-specific ranking |

The return value's **sign** matters: negative means before, zero means equivalent for ordering, positive means after. It need not be exactly `-1`, `0`, or `1`.

## Implement and run both approaches

Save the following as `OrderingDemo.java`; run `javac OrderingDemo.java` and `java OrderingDemo`.

```java runnable=OrderingDemo
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.TreeSet;

public class OrderingDemo {
    record Employee(int id, String name, int salary)
            implements Comparable<Employee> {
        @Override
        public int compareTo(Employee other) {
            int byId = Integer.compare(id, other.id);
            if (byId != 0) return byId;
            int byName = name.compareTo(other.name);
            if (byName != 0) return byName;
            return Integer.compare(salary, other.salary);
        }
    }

    public static void main(String[] args) {
        List<Employee> employees = new ArrayList<>(List.of(
            new Employee(3, "Riya", 90000),
            new Employee(1, "Asha", 90000),
            new Employee(2, "Ben", 80000)
        ));

        employees.sort(Comparator.naturalOrder());
        System.out.println("Natural: " + ids(employees));

        Comparator<Employee> salaryAscending =
            Comparator.comparingInt(Employee::salary)
                .thenComparing(Employee::name)
                .thenComparingInt(Employee::id);
        employees.sort(salaryAscending);
        System.out.println("Salary ascending: " + ids(employees));

        Comparator<Employee> salaryDescendingNameAscending =
            Comparator.comparingInt(Employee::salary).reversed()
                .thenComparing(Employee::name)
                .thenComparingInt(Employee::id);
        employees.sort(salaryDescendingNameAscending);
        System.out.println("Salary descending: " + ids(employees));

        var salaryOnly = new TreeSet<Employee>(
            Comparator.comparingInt(Employee::salary));
        salaryOnly.addAll(employees);
        System.out.println("Salary-only set size: " + salaryOnly.size());

        System.out.println("Safe integer comparison: "
            + Integer.compare(Integer.MIN_VALUE, 1));
    }

    private static List<Integer> ids(List<Employee> employees) {
        return employees.stream().map(Employee::id).toList();
    }
}
```

Expected output:

```text
Natural: [1, 2, 3]
Salary ascending: [2, 1, 3]
Salary descending: [1, 3, 2]
Salary-only set size: 2
Safe integer comparison: -1
```

The natural order compares every record component so it stays consistent with record equality, even if two records share an ID. In a real employee model, decide whether identity is ID-only or all fields, then align the equality and ordering contract.

## Interview question: why not return a.salary - b.salary?

Subtraction can overflow. `Integer.MIN_VALUE - 1` wraps to a positive value, incorrectly suggesting the minimum integer is greater than one. Use `Integer.compare`, `Long.compare`, or primitive comparator factories.

Another mistake is returning only `1` and `-1`: equal inputs must be able to compare as zero.

**Follow-up:** A comparator must satisfy sign symmetry, transitivity, and consistent handling of equivalent values. A comparator based on randomness, changing state, or an inconsistent comparison chain can break sorting and sorted collections.

## Interview question: why did TreeSet lose an employee?

`TreeSet` treats comparison result zero as the same set member. A salary-only comparator treats both employees earning 90000 as equivalent, even though their IDs differ. The set size is two.

If you want every employee, include appropriate tie-breakers or use a list for sorted display. `TreeMap` likewise treats comparator-equivalent keys as the same key. Hash collections instead use `equals()` and `hashCode()`.

Do not mutate fields used for ordering while an object is inside a tree collection. The object can remain stored in a position that no longer matches its comparison values.

## Interview question: reverse salary but keep names ascending

```java
Comparator<Employee> order =
    Comparator.comparingInt(Employee::salary).reversed()
        .thenComparing(Employee::name);
```

Here `reversed()` applies only to the salary comparator. Calling it after the complete chain reverses both salary and name ordering. This snippet uses `Employee` from the runnable example.

For nullable names, choose policy explicitly:

```java
Comparator<Employee> byNullableName =
    Comparator.comparing(Employee::name,
        Comparator.nullsLast(Comparator.naturalOrder()));
```

That handles a null **name**, not a null employee. Wrap the whole employee comparator with `Comparator.nullsLast(...)` if the list itself can contain null employees.

## Interview question: is sorting stable?

Java's documented object-list sorting is stable: comparator-equivalent elements retain their prior relative order. Stability does not make a comparator total over business identities, nor does it prevent TreeSet deduplication. Primitive-array sorting does not have the same object stability guarantee.

The `Comparable` contract strongly recommends consistency with `equals()`, but it is not universal: `BigDecimal("1.0")` and `BigDecimal("1.00")` compare as numerically equal while `equals()` is false because scale differs.

## Self-checks

<details><summary>1. Can a class implement Comparable and also be sorted using a Comparator?</summary>
<p>Yes. Passing a Comparator selects that external policy for the operation instead of the natural ordering. You do not need to change compareTo to support every screen's sort order.</p>
</details>
<details><summary>2. What does compare(a, b) == 0 mean in a TreeSet?</summary>
<p>It means the set treats a and b as the same member for ordering-based membership, even if equals says otherwise. Use comparison fields and tie-breakers that match the intended identity.</p>
</details>
<details><summary>3. How do you safely compare two long values?</summary>
<p>Use Long.compare(a, b) or Comparator.comparingLong. Do not subtract and narrow the result to int; overflow and narrowing can both produce an incorrect sign.</p>
</details>

## Read next and sources

Continue with [collections](collections.md), [equality](equality.md), and the [Java interview bank](interview-questions.md).

- [Comparable contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Comparable.html)
- [Comparator factories and contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html)
- [TreeSet membership](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html)
