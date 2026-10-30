'use strict';

window.TRACKS = [
  {
    id: 'java', title: 'Java', subtitle: 'Language fundamentals to concurrency',
    description: 'Explain what the language does, what the runtime guarantees, and where common assumptions break.',
    topics: [
      ['equality', '==, equals() & hashCode()', 'Identity, logical equality, string pool, boxed values, mutable map keys'],
      ['memory', 'Memory & garbage collection', 'JVM, stack, heap, metaspace, leaks, garbage collectors, diagnostics'],
      ['oop', 'Object-oriented design', 'Encapsulation, inheritance, polymorphism, interfaces, composition, SOLID'],
      ['collections', 'Collections & generics', 'ArrayList, HashMap, HashSet, TreeMap, complexity, wildcard bounds'],
      ['strings', 'Strings, immutability & records', 'StringBuilder, defensive copies, records, shallow vs deep immutability'],
      ['exceptions', 'Exceptions & resource handling', 'Checked and unchecked exceptions, finally, try-with-resources, Optional'],
      ['concurrency', 'Threads & concurrency', 'synchronized, volatile, atomicity, deadlocks, executors, virtual threads'],
      ['streams', 'Streams, lambdas & modern Java', 'Lazy pipelines, map vs flatMap, collectors, CompletableFuture, coding drills']
    ]
  },
  {
    id: 'spring-boot', title: 'Spring Boot', subtitle: 'From beans to production behavior',
    description: 'Understand the container, build predictable APIs, and reason about transactions, security, and failures.',
    topics: [
      ['container', 'Spring, Boot & dependency injection', 'IoC, beans, constructor injection, component scan, auto-configuration'],
      ['lifecycle', 'Bean lifecycle, scopes & proxies', 'Singleton safety, prototype scope, AOP, self-invocation, qualifiers'],
      ['rest', 'REST APIs & error handling', 'Request lifecycle, DTOs, validation, status codes, ProblemDetail, pagination'],
      ['transactions', 'Transactions & persistence', 'Transactional proxies, rollback, propagation, isolation, JPA, N+1, MongoDB'],
      ['security', 'Security fundamentals', 'Authentication, authorization, JWT, sessions, CSRF, CORS, password hashing'],
      ['testing', 'Testing Spring applications', 'Unit vs integration, MockMvc, test slices, Testcontainers, transactional tests'],
      ['production', 'Configuration & production readiness', 'Profiles, Actuator, observability, caching, async, retries, connection pools']
    ]
  },
  {
    id: 'mongodb', title: 'MongoDB / NoSQL', subtitle: 'Model, query, scale, and troubleshoot',
    description: 'Choose a data model from access patterns, prove index choices, and make consistency tradeoffs explicit.',
    topics: [
      ['modeling', 'NoSQL & document modeling', 'SQL comparison, BSON, embedding vs references, schema validation, document limits'],
      ['queries', 'Queries & atomic updates', 'Filters, projections, null vs missing, arrays, upsert, conditional updates'],
      ['indexes', 'Indexes & query performance', 'Compound indexes, equality-sort-range, explain, covered queries, unique, TTL'],
      ['aggregation', 'Aggregation pipelines', 'match, group, lookup, unwind, facet, pagination, aggregation tradeoffs'],
      ['consistency', 'Replication, consistency & transactions', 'Replica sets, failover, read and write concern, atomicity, transactions'],
      ['scaling', 'Sharding & Spring Data MongoDB', 'Shard keys, hotspots, scatter-gather, repositories, MongoTemplate, optimistic locking']
    ]
  }
];
