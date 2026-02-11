# Sentinel's Journal

## 2026-02-12 - [Unverified Worker URL]
**Vulnerability:** The `WorkerCommunicator` class accepted any URL string for worker initialization without validation. While the adapter usage was safe (using Blob URLs), direct usage of the class could allow loading scripts from untrusted origins if not properly handled by the browser's same-origin policy or if CSP is weak.
**Learning:** Library components that wrap dangerous APIs like `Worker` must enforce security boundaries themselves, rather than relying solely on the consuming code or browser defaults. Defense in depth is crucial.
**Prevention:** Implemented strict URL validation in `WorkerCommunicator` to only allow `blob:` URLs or same-origin URLs, throwing a `SECURITY_VIOLATION` error otherwise.
