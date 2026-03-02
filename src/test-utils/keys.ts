/** Raw key sequences that Ink's parse-keypress understands */
export const KEY = {
  return: '\r',
  escape: '\x1b',
  tab: '\t',
  backspace: '\x7f',
  delete: '\x1b[3~',
  up: '\x1b[A',
  down: '\x1b[B',
  right: '\x1b[C',
  left: '\x1b[D',
  pageUp: '\x1b[5~',
  pageDown: '\x1b[6~',
  home: '\x1b[H',
  end: '\x1b[F',
  space: ' ',
  ctrlC: '\x03',
} as const

export type KeyName = keyof typeof KEY

export interface KeySender {
  raw(data: string): void
  enter(): void
  escape(): void
  tab(): void
  backspace(): void
  delete(): void
  up(): void
  down(): void
  left(): void
  right(): void
  space(): void
  pageUp(): void
  pageDown(): void
  home(): void
  end(): void
  type(text: string): void
  press(char: string): void
  key(name: KeyName): void
}

export function createKeySender(write: (data: string) => void): KeySender {
  return {
    raw: write,
    enter: () => write(KEY.return),
    escape: () => write(KEY.escape),
    tab: () => write(KEY.tab),
    backspace: () => write(KEY.backspace),
    delete: () => write(KEY.delete),
    up: () => write(KEY.up),
    down: () => write(KEY.down),
    left: () => write(KEY.left),
    right: () => write(KEY.right),
    space: () => write(KEY.space),
    pageUp: () => write(KEY.pageUp),
    pageDown: () => write(KEY.pageDown),
    home: () => write(KEY.home),
    end: () => write(KEY.end),
    type(text: string) {
      for (const char of text) {
        write(char)
      }
    },
    press(char: string) {
      write(char)
    },
    key(name: KeyName) {
      write(KEY[name])
    },
  }
}
