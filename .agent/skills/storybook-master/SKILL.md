---
name: storybook-master
description: UI component catalog management and development using Storybook. Use when creating stories, managing themes, or developing components in isolation across React and Vue.
---

# Storybook Master Skill

This skill guides Gemini CLI in building and maintaining a comprehensive component catalog using Storybook.

## Key Capabilities

- **Story Creation**: Generate `.stories.tsx` or `.stories.ts` files for UI components.
- **Documentation**: Use MDX to document component APIs and Zenith standards.
- **Multilingual Testing**: Verify i18n support within stories.
- **Theme Management**: Switch between Light/Dark modes.

## Standard Workflow

### 1. Create a New Story

When a new UI component is added to `packages/ui-*`:

- Use the `story_template.ts` asset to scaffold a story.
- Include variants for different engine statuses (loading, ready, searching, error).

### 2. Build Catalog

- Run `pnpm run storybook` to start the development environment.
- Use `pnpm run build-storybook` for static deployment.

## Patterns

### Component Variants

Always include stories for:

- **Default State**: Initial view.
- **Busy State**: Loading WASM or searching.
- **Empty State**: No data available.
- **Error State**: Handling engine failures.

### Accessibility Check

- Integrate with `accessibility-ally` skill to audit stories for WCAG 2.2 AA compliance.
