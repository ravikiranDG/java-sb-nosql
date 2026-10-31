# Java / Spring Boot / NoSQL Interview Prep

A practical backend interview field guide: understand the concept, trace an example, explain the tradeoff, and answer the follow-up.

**[Read the published guide](https://ravikirandg.github.io/java-sb-nosql/)**

Inspired by the reading experience of [System Design Interview Prep](https://ravikirandg.github.io/interview_prep/). This is an independent repository; it does not change the system-design guide.

## What is inside?

| Track | Chapters | Coverage |
|---|---:|---|
| Java | 11 | Equality, memory, object-oriented design, collections, Comparable/Comparator, custom exceptions, concurrency, streams, 24 interview questions |
| Spring Boot | 8 | Dependency injection, lifecycle/proxies, REST, transactions, security, testing, production readiness, 24 interview questions |
| MongoDB / NoSQL | 7 | Modeling, queries, indexes, aggregation, consistency/replication, sharding, Spring Data, 16 interview questions |

There are **26 chapters, 64 interview-bank questions with model answers, and 78 expandable answered self-checks**. Every chapter includes a plain-language interview answer, examples, pitfalls, and primary documentation. Question banks distinguish foundational must-know topics from deeper follow-ups and explain practical scenarios, not only definitions. These are curated common preparation topics, not a measured interview-frequency ranking.

## Interview questions and implementations

- [Java: 24 essential interview questions](java/interview-questions.md)
- [Spring Boot: 24 essential interview questions](spring-boot/interview-questions.md)
- [MongoDB / NoSQL: 16 essential interview questions](mongodb/interview-questions.md)
- [Comparable versus Comparator: runnable sorting and TreeSet implementation](java/ordering.md)
- [Custom exceptions: runnable checked/unchecked implementations and Spring advice](java/custom-exceptions.md)

The Java banks include equality, collection behavior, class loading, checked/unchecked exceptions, concurrency, serialization, and a runnable distinct-substring exercise. Spring questions include actual transaction failure scenarios, custom error mapping, security, caching, asynchronous execution, and operational tradeoffs. MongoDB questions include query correctness, atomic inventory updates, index design, explain, consistency, and sharding.

The website includes full-text chapter search, deep links, an on-page contents list, previous/next navigation, code copying, light/dark themes, mobile navigation, a reading indicator, and locally saved review progress. Progress is stored only in your browser and does not sync across devices.

## Study order

1. Java: [equality](java/equality.md), [memory](java/memory.md), [collections](java/collections.md), then the remaining fundamentals.
2. Spring Boot: [the container](spring-boot/container.md), [proxies](spring-boot/lifecycle.md), [REST](spring-boot/rest.md), and [transactions](spring-boot/transactions.md).
3. MongoDB: [modeling](mongodb/modeling.md), [queries](mongodb/queries.md), [indexes](mongodb/indexes.md), then distributed behavior.

Explain each answer aloud before opening the self-check answers. For code questions, state the invariant and constraints before writing code.

## Run locally

No application dependency install or framework build is needed. From the repository directory:

```shell
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. Opening `index.html` directly through `file://` does not work reliably because chapters are fetched over HTTP.

Java examples use Java 21 conventions; Spring examples use Boot 3.x conventions unless noted. They are teaching snippets, not a complete deployable Java service. File layout, required collaborators, and configuration assumptions are explained beside the snippets. MongoDB commands are for an isolated practice database.

## Validate and publish

Node.js 22 or later can run the zero-install structural checks:

```shell
node --test
node scripts/build.mjs
```

The checks cover the topic manifest, chapter files, self-checks, the exact number and answer structure of interview-bank questions, headings, internal Markdown links and anchors, local assets, script syntax, and the clean static deployment file list.

With JDK 21 or later on your path, validate the specially marked complete Java programs:

```shell
node scripts/check-java.mjs
```

This extracts, compiles, and runs the ordering, custom-exception, and distinct-substring programs and checks their output and key edge cases. Other teaching snippets and MongoDB commands are not executed by these checks.

The GitHub Actions workflow runs the checks and builds an allowlisted `dist` artifact. GitHub Pages deploys that artifact from pushes to `main`. In repository **Settings > Pages**, the build source must be **GitHub Actions**. The first publication configures this setting through the GitHub API.

## Add or improve a chapter

Edit Markdown in `java`, `spring-boot`, or `mongodb`. Add a navigation entry in `topics.js` for a new chapter. Use one top-level heading, an interview answer, worked explanation, exactly three answered self-checks, and primary sources. Prefer links to sibling Markdown files over hard-coded site URLs. Keep Java and Spring version assumptions explicit.

The homepage derives chapter and self-check totals from the topic manifest. When adding interview questions, update the track's `interviewQuestions` value; checks verify it against the question bank. Keep this README's totals in sync. Do not copy third-party prose or examples wholesale; link to the original documentation and explain in your own words.

## Dependencies and privacy

The runtime uses locally vendored, version-pinned Marked and DOMPurify. See [third-party notices](THIRD-PARTY-NOTICES.md). There are no analytics, accounts, remote font requests, or runtime content delivery network dependencies. GitHub Pages itself still serves requests under GitHub's privacy terms.

Markdown is sanitized before rendering. Search fetches the guide's chapters from the same site; it does not send search terms to an external search service.
