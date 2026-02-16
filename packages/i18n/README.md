# @multi-game-engines/i18n

Type-safe localization resources for the multi-game-engines ecosystem.

## Features

- **Type Safety**: `EngineUIStrings` interface ensures all keys are present.
- **Locales**: Standard support for `ja` (Japanese) and `en` (English).
- **Separation**: Decoupled from UI logic, usable in any framework or backend.

## Usage

```typescript
import { locales } from "@multi-game-engines/i18n";
import { createUIStrings } from "@multi-game-engines/ui-core";

const strings = createUIStrings(locales.ja);
console.log(strings.start); // "開始"
```
