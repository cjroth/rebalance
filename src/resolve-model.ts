import type { LanguageModel } from 'ai'

export async function resolveModel(env: Record<string, string | undefined>): Promise<LanguageModel | null> {
  if (env.ANTHROPIC_API_KEY) {
    const { anthropic } = await import('@ai-sdk/anthropic')
    return anthropic('claude-sonnet-4-20250514')
  }
  if (env.VITE_AI_PROXY_URL) {
    const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible')
    const proxy = createOpenAICompatible({ name: 'ai-proxy', baseURL: env.VITE_AI_PROXY_URL })
    return proxy.chatModel(env.VITE_AI_MODEL || 'qwen/qwen3-235b-a22b-thinking-2507')
  }
  return null
}
