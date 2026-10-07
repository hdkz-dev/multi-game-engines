# ADR 063: Chunked download transport boundary

Status: Accepted
Date: 2026-10-07

PR #268 dependency fixes are merged on main `2b6b534`; audit reports zero findings and post-merge CI, E2E, Release, docs deployment and SRI refresh passed. This change implements M1a pending integration: validate URLs before cache access; use safeFetch with credentials omit and redirect error for HEAD, Range and GET. Invalid URLs, embedded credentials and remote HTTP raise SECURITY_ERROR. HEAD security refusals and aborts do not fall back. Confirm closure of CodeQL 68–70 after integration. M1b mandatory SRI, M1c response-size contracts remain incomplete. Q1 public-API tests remove any and suppression, pending integration. This change also includes Dependabot PR #267 action-download-artifact v27.

HEAD capability probing falls back only on ordinary network failures. Browser manual redirects may be opaque and hide the destination, so downloader requests use redirect error. Preserve ADR 060 HTTP loopback/Portless support. Track SRI format, cache integrity and Range response sizes separately. Resolve relative URLs against browser location; reject them outside browsers. Other SecurityAdvisor.safeFetch callers retain their existing redirect settings.
