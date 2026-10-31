import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class InterviewExampleChecks {
    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    public static void main(String[] args) {
        var employees = List.of(
            new OrderingDemo.Employee(Integer.MIN_VALUE, "A", 0),
            new OrderingDemo.Employee(1, "A", Integer.MIN_VALUE),
            new OrderingDemo.Employee(1, "A", Integer.MAX_VALUE),
            new OrderingDemo.Employee(1, "B", 0),
            new OrderingDemo.Employee(Integer.MAX_VALUE, "A", 0)
        );
        for (var a : employees) {
            for (var b : employees) {
                check(Integer.signum(a.compareTo(b)) == -Integer.signum(b.compareTo(a)),
                    "Comparison sign symmetry");
                check((a.compareTo(b) == 0) == a.equals(b), "Ordering agrees with equality");
                for (var c : employees) {
                    if (a.compareTo(b) < 0 && b.compareTo(c) < 0) {
                        check(a.compareTo(c) < 0, "Comparison transitivity");
                    }
                }
            }
        }
        check(CustomExceptionDemo.withdraw(50, 50) == 0, "Exact balance withdrawal");
        check(CustomExceptionDemo.withdraw(Long.MAX_VALUE, 1) == Long.MAX_VALUE - 1,
            "Large balance arithmetic");
        try {
            CustomExceptionDemo.withdraw(50, 51);
            throw new AssertionError("Expected domain exception");
        } catch (InsufficientBalanceException failure) {
            check(failure.requested() == 51 && failure.available() == 50, "Structured context");
        }
        for (long amount : new long[] {0, -1}) {
            try {
                CustomExceptionDemo.withdraw(50, amount);
                throw new AssertionError("Expected invalid-input exception");
            } catch (IllegalArgumentException expected) {
                check(expected.getMessage() != null, "Invalid input is explicit");
            }
        }
        int total = 0;
        for (int length = 0; length <= 6; length++) {
            int combinations = (int) Math.pow(3, length);
            for (int value = 0; value < combinations; value++) {
                StringBuilder text = new StringBuilder();
                int remaining = value;
                for (int i = 0; i < length; i++) {
                    text.append((char) ('a' + remaining % 3));
                    remaining /= 3;
                }
                String input = text.toString();
                check(DistinctWindowDemo.longestDistinct(input) == bruteLongest(input),
                    "Window result for " + input);
                total++;
            }
        }
        check(total == 1093, "Exhaustive case count");
        check(DistinctWindowDemo.longestDistinct("\uD83D\uDE00a\uD83D\uDE00b") == 3,
            "Unicode code-point counting");
        try {
            DistinctWindowDemo.longestDistinct(null);
            throw new AssertionError("Expected null rejection");
        } catch (NullPointerException expected) {
            check("text".equals(expected.getMessage()), "Null contract");
        }
        System.out.println("Ordering contracts, exception boundaries, and 1093 exhaustive window inputs passed");
    }

    private static int bruteLongest(String input) {
        int[] characters = input.codePoints().toArray();
        int best = 0;
        for (int start = 0; start < characters.length; start++) {
            Set<Integer> seen = new HashSet<>();
            for (int end = start; end < characters.length; end++) {
                if (!seen.add(characters[end])) break;
                best = Math.max(best, end - start + 1);
            }
        }
        return best;
    }
}
