import stripAnsi from 'strip-ansi'

export interface Screen {
  text(): string
  rawText(): string
  contains(text: string): boolean
  matches(pattern: RegExp): boolean
  frames(): string[]
  rawFrames(): string[]
  line(n: number): string
  lines(): string[]
}

export function createScreen(
  lastFrame: () => string | undefined,
  allFrames: string[],
): Screen {
  const clean = (s: string | undefined) => s ? stripAnsi(s) : ''

  return {
    text() {
      return clean(lastFrame())
    },
    rawText() {
      return lastFrame() ?? ''
    },
    contains(text: string) {
      return clean(lastFrame()).includes(text)
    },
    matches(pattern: RegExp) {
      return pattern.test(clean(lastFrame()))
    },
    frames() {
      return allFrames.map(f => stripAnsi(f))
    },
    rawFrames() {
      return [...allFrames]
    },
    line(n: number) {
      const lines = clean(lastFrame()).split('\n')
      return lines[n] ?? ''
    },
    lines() {
      return clean(lastFrame()).split('\n').filter(l => l.trim() !== '')
    },
  }
}
