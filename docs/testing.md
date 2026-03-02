# Testing Ink TUI Components

This project includes a testing framework for Ink terminal UI components, inlined at `src/test-utils/`. It wraps [ink-testing-library](https://github.com/vadimdemedes/ink-testing-library) with ergonomic helpers inspired by React Testing Library.

## Quick Start

```tsx
import { describe, expect, test, afterEach } from 'bun:test'
import React from 'react'
import { renderTui, cleanup } from '../src/test-utils/index.ts'
import { MyComponent } from '../src/components/my-component.tsx'

afterEach(() => {
  cleanup()
})

test('renders and responds to input', async () => {
  const tui = renderTui(<MyComponent />)

  await tui.waitFor('Expected text')
  tui.keys.enter()
  await tui.waitFor('Next screen')

  expect(tui.screen.contains('Result')).toBe(true)
  tui.unmount()
})
```

## API Reference

### `renderTui(node: ReactNode): TuiInstance`

Renders an Ink component for testing. Returns a `TuiInstance` with:

| Property | Type | Description |
|----------|------|-------------|
| `screen` | `Screen` | Query helpers to read rendered content |
| `keys` | `KeySender` | Send keyboard input |
| `flush()` | `Promise<void>` | Flush pending React renders (two event-loop ticks) |
| `waitFor(condition, options?)` | `Promise<void>` | Wait for text or assertion |
| `rerender(node)` | `void` | Re-render with a new element |
| `unmount()` | `void` | Unmount and clean up |
| `ink` | `object` | Underlying ink-testing-library instance |

### Screen Queries

| Method | Returns | Description |
|--------|---------|-------------|
| `screen.text()` | `string` | Current screen text (ANSI stripped) |
| `screen.rawText()` | `string` | Raw output with ANSI codes |
| `screen.contains(text)` | `boolean` | Check if screen includes text |
| `screen.matches(regex)` | `boolean` | Test regex against screen text |
| `screen.lines()` | `string[]` | Non-empty lines (ANSI stripped) |
| `screen.line(n)` | `string` | Specific line by index |
| `screen.frames()` | `string[]` | All rendered frames (ANSI stripped) |

### Key Helpers

```ts
tui.keys.enter()      // Press Enter/Return (\r)
tui.keys.escape()     // Press Escape
tui.keys.tab()        // Press Tab
tui.keys.up()         // Arrow up
tui.keys.down()       // Arrow down
tui.keys.left()       // Arrow left
tui.keys.right()      // Arrow right
tui.keys.backspace()  // Backspace
tui.keys.space()      // Space
tui.keys.press('a')   // Press a single character
tui.keys.type('abc')  // Send each character (see gotcha #3)
tui.keys.key('home')  // Press a named key
tui.keys.raw('\x1b')  // Send raw escape sequence
```

### `waitFor(condition, options?)`

Polls until a condition is met or timeout is reached.

```ts
// Wait for text to appear on screen
await tui.waitFor('Step 2')

// Wait for a custom assertion
await tui.waitFor(() => {
  expect(tui.screen.contains('Imported')).toBe(true)
})

// Custom timeout and interval
await tui.waitFor('slow content', { timeout: 5000, interval: 100 })
```

### `InMemoryStorage`

In-memory implementation of `StorageAdapter` for tests:

```ts
import { InMemoryStorage } from '../src/test-utils/index.ts'

const storage = new InMemoryStorage()
// Use in place of FsStorageAdapter or OpfsStorageAdapter
```

## Patterns

### Testing Components in Isolation

```tsx
test('SelectInput navigates and selects', async () => {
  let selected = null
  const items = [
    { label: 'Apple', value: 'a' },
    { label: 'Banana', value: 'b' },
  ]
  const tui = renderTui(
    <SelectInput items={items} onSelect={(item) => { selected = item }} />
  )
  await tui.flush()

  tui.keys.down()
  await tui.flush()
  tui.keys.enter()
  await tui.flush()

  expect(selected?.label).toBe('Banana')
  tui.unmount()
})
```

### Testing Full Screens with Storage

```tsx
function renderWizard() {
  const storage = new InMemoryStorage()
  return renderTui(
    <Wizard
      dataDir="/tmp/test"
      storage={storage}
      initialStep={1}
      readFile={() => { throw new Error('not implemented') }}
    />
  )
}

test('wizard flow', async () => {
  const tui = renderWizard()
  await tui.waitFor('Step 1')
  tui.keys.enter()
  await tui.waitFor('Imported')
  tui.keys.enter()
  await tui.waitFor('Step 2')
  tui.unmount()
})
```

### Cleanup

Always call `cleanup()` in `afterEach` and `tui.unmount()` at the end of each test:

```ts
afterEach(() => {
  cleanup()
})
```

## Gotchas

### 1. Dual-Instance Problem

React, Ink, and react-reconciler must each resolve to a **single copy** in the dependency tree. If your test runner resolves them from a different `node_modules` than your source code, you'll get:

- "Invalid hook call" errors
- `useInput` listeners silently not registering
- Components rendering but not responding to input

**Solution:** The test utilities are inlined in `src/test-utils/` (not a separate npm package) so everything shares the same dependency tree.

### 2. `\r` vs `\n`

Ink's keypress parser treats these differently:

| Sequence | Ink maps to | Notes |
|----------|------------|-------|
| `\r` (carriage return) | `key.return = true` | This is what `keys.enter()` sends |
| `\n` (newline) | Treated as regular input | Does NOT trigger `key.return` |

Always use `\r` for Enter. The `keys.enter()` helper does this correctly.

### 3. React Batching and `type()`

`keys.type('hello')` sends all characters synchronously. If a component uses `setValue(value + char)` (not a functional updater), React batches the updates and only the last character wins.

**Solution:** For components that accumulate input character-by-character, send each character with a `flush()` in between:

```ts
async function typeSlowly(tui: TuiInstance, text: string) {
  for (const char of text) {
    tui.keys.press(char)
    await tui.flush()
  }
}
```

For components using functional updaters (`setValue(prev => prev + char)`), `type()` works fine.

### 4. Double-Tick Flush

After sending keyboard input, Ink needs **two** event-loop ticks before the screen updates:

1. First tick: React's `batchedUpdates` processes state changes
2. Second tick: The re-render commits and writes to stdout

`flush()` handles this automatically. Use `waitFor()` when you need to wait for async operations (storage reads, etc.).

### 5. useInput Ordering

All `useInput` handlers fire via EventEmitter — **both parent and child** handlers receive input. If a parent component has a `useInput` handler, it will fire alongside child handlers.

**Solution:** Use the `focus` prop on components like `SelectInput` to prevent them from capturing input when they shouldn't be active:

```tsx
<SelectInput items={items} focus={isActive} onSelect={handleSelect} />
```
