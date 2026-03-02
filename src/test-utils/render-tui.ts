import { render, cleanup as inkCleanup } from 'ink-testing-library'
import type { ReactNode } from 'react'
import { createKeySender, type KeySender } from './keys.ts'
import { createScreen, type Screen } from './screen.ts'
import { waitFor as waitForImpl, type WaitForOptions } from './wait-for.ts'

export interface TuiInstance {
  screen: Screen
  keys: KeySender
  flush(): Promise<void>
  waitFor(condition: string | (() => void), options?: WaitForOptions): Promise<void>
  rerender(node: ReactNode): void
  unmount(): void
  ink: ReturnType<typeof render>
}

export function renderTui(node: ReactNode): TuiInstance {
  const instance = render(node)
  const screen = createScreen(instance.lastFrame, instance.frames)
  const keys = createKeySender((data) => instance.stdin.write(data))

  const flush = async () => {
    await new Promise<void>(r => setTimeout(r, 0))
    await new Promise<void>(r => setTimeout(r, 0))
  }

  return {
    screen,
    keys,
    flush,
    async waitFor(condition, options) {
      await waitForImpl(condition, () => screen.text(), options)
    },
    rerender: instance.rerender,
    unmount() {
      instance.unmount()
      instance.cleanup()
    },
    ink: instance,
  }
}

export { inkCleanup as cleanup }
