# Security fundamentals for backend interviews

> **Interview answer:** Authentication establishes who the caller is. Authorization decides what that caller may do to a specific resource. Validate both at a trusted server boundary; a client-supplied user ID or an unreadable-looking token is not proof of permission.

## Sessions versus bearer tokens

| Approach | How requests establish identity | Main tradeoff |
|---|---|---|
| Server-side session | Opaque session cookie maps to server state | Easy centralized invalidation; needs shared state or routing strategy |
| Bearer access token | Server validates a presented credential | Convenient across services; theft permits use until expiry or revocation controls intervene |

A **JSON Web Token (JWT)** is a token format. A typical signed JWT payload is encoded, **not encrypted**. Do not place secrets in it.

Validate signature using trusted keys and an allowed algorithm, issuer, audience, expiry, and application-specific claims. Parsing a token is not validating it. Authorization can become stale when permissions change while a token remains valid.

OAuth 2.0 is an authorization framework. OpenID Connect adds an identity layer. A JWT is not itself an authentication protocol.

## Resource-server configuration

This partial Boot 3.x configuration assumes the security and OAuth 2.0 resource-server starters and a configured trusted issuer. It demonstrates a stateless bearer-token API, not a browser session login:

```java
@org.springframework.context.annotation.Bean
org.springframework.security.web.SecurityFilterChain apiSecurity(
        org.springframework.security.config.annotation.web.builders.HttpSecurity http)
        throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(
            org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(resource -> resource.jwt(
            org.springframework.security.config.Customizer.withDefaults()))
        .build();
}
```

Disabling Cross-Site Request Forgery (CSRF) protection is appropriate here **only when credentials are not automatically attached by the browser**, such as explicit Authorization-header bearer tokens. If authentication uses cookies, reassess CSRF protection. Statelessness alone does not eliminate CSRF.

Do not expose detailed health information publicly. Authentication of every endpoint also does not replace per-object authorization.

## CORS is not authentication

**Cross-Origin Resource Sharing (CORS)** controls whether browsers expose cross-origin responses to scripts. It does not stop non-browser clients from making requests and does not authorize users.

Allow only required origins, methods, and headers. Credentialed cross-origin requests need careful origin handling; a wildcard is not a substitute for policy.

## Passwords, input, and secrets

Use an adaptive password hash through a reputable encoder, such as bcrypt or Argon2 with appropriate parameters. Passwords should not be stored in plaintext or reversibly encrypted merely for later comparison. Hash functions such as plain SHA-256 are too fast for password storage by themselves.

Bind queries through supported parameterization or typed APIs. Do not accept arbitrary MongoDB operators or raw query documents from untrusted input. Validate shape and business constraints.

Keep credentials out of source, logs, URLs, and exception responses. Use managed secret injection and least-privilege database users. Apply timeouts, payload limits, and rate limits to control resource abuse.

## Self-checks

<details><summary>1. If a valid token says user A, can A read /users/B/orders?</summary>
<p>Not without authorization for that resource. Authentication establishes A's identity; server-side ownership or policy checks decide whether B's orders are accessible.</p>
</details>
<details><summary>2. Does CORS protect an endpoint from curl?</summary>
<p>No. CORS is a browser-enforced cross-origin response policy. The endpoint still needs authentication, authorization, input controls, and abuse limits.</p>
</details>
<details><summary>3. Is every stateless API immune to CSRF?</summary>
<p>No. If a browser automatically attaches authentication credentials, such as cookies, cross-site requests can still carry them. Analyze the credential transport, not just session storage.</p>
</details>

## Sources

- [Spring Security resource servers](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [Spring Security CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- [Password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
