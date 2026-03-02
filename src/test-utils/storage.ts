import type { StorageAdapter } from '../screens/storage.ts'

export class InMemoryStorage implements StorageAdapter {
  private data = new Map<string, string>()
  async read(key: string) { return this.data.get(key) ?? null }
  async write(key: string, data: string) { this.data.set(key, data) }
  async exists(key: string) { return this.data.has(key) }
  async remove(key: string) { this.data.delete(key) }
}
