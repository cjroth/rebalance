export interface WaitForOptions {
  timeout?: number
  interval?: number
}

const DEFAULT_TIMEOUT = 3000
const DEFAULT_INTERVAL = 50

export async function waitFor(
  condition: string | (() => void),
  screenText: () => string,
  options: WaitForOptions = {},
): Promise<void> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  const interval = options.interval ?? DEFAULT_INTERVAL
  const start = Date.now()
  let lastError: Error | undefined

  const check = () => {
    if (typeof condition === 'string') {
      const text = screenText()
      if (!text.includes(condition)) {
        throw new Error(
          `Timed out waiting for text: "${condition}"\n\nScreen content:\n${text}`,
        )
      }
    } else {
      condition()
    }
  }

  while (Date.now() - start < timeout) {
    try {
      check()
      return
    } catch (e) {
      lastError = e as Error
    }
    await new Promise(r => setTimeout(r, interval))
  }

  // One final attempt
  try {
    check()
    return
  } catch (e) {
    lastError = e as Error
  }

  throw lastError ?? new Error('waitFor timed out')
}
