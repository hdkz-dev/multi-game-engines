---
name: nextjs15-optimizer
description: Advanced optimization skill for Next.js 15 and React 19. Covers React Compiler, Turbopack, async request APIs, and Partial Prerendering (PPR).
version: 1.0.0
author: multi-game-engines contributors
---

# Next.js 15 & React 19 Optimizer Skill

This skill provides expertise in optimizing applications using the latest Next.js 15 features and React 19 improvements.

## Key Focus Areas

1.  **React Compiler (React Forget)**: Leverage automatic memoization. Learn when to rely on the compiler and when manual `useMemo`/`useCallback` might still be needed for complex dependencies.
2.  **Turbopack Integration**: Efficiently use the new Rust-based bundler for faster development and builds.
3.  **Async Request APIs**: Properly handle the shift to asynchronous APIs for `cookies()`, `headers()`, and `params` in the App Router.
4.  **Partial Prerendering (PPR)**: Implement hybrid rendering by combining static shell components with dynamic islands for optimal LCP and user experience.
5.  **Enhanced Caching**: Configure Next.js 15 caching strategies, specifically the new default behaviors for fetch requests and segment configs.

## Best Practices Checklist

- [ ] **React 19 Hooks**: Use new hooks like `useActionState` and `useFormStatus` for streamlined form handling.
- [ ] **Server Actions**: Ensure Server Actions are secure and follow the "Client-side validation, Server-side verification" pattern.
- [ ] **Async Params**: Access `params` and `searchParams` as Promises in Page/Layout components.
- [ ] **Hydration Error Debugging**: Utilize the improved hydration error messages in Next.js 15 to quickly identify and fix mismatches.
- [ ] **`<Form>` Component**: Use the built-in `<Form>` component for progressive enhancement and better prefetching.

## Code Snippets

### Async Params in Next.js 15

```tsx
// Page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <div>Post: {slug}</div>;
}
```

### Partial Prerendering (PPR)

```tsx
// layout.tsx
export const experimental_ppr = true; // Enable PPR for the segment

export default function Layout({ children }) {
  return (
    <div>
      <Header /> {/* Static shell */}
      <Suspense fallback={<Skeleton />}>
        {children} {/* Dynamic content */}
      </Suspense>
    </div>
  );
}
```

## Troubleshooting

- **"Property 'params' does not exist"**: Parameters are now Promises. Ensure you `await` them or use `React.use()` in Client Components.
- **Hydration Mismatch**: Next.js 15 provides better diffs; look for "Expected ... but found ..." in the console.
- **Turbopack Issues**: If certain plugins aren't working, check the documentation for Turbopack-specific configuration options.
