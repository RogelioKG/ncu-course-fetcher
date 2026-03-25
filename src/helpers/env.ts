import process from 'node:process'

const rawEnv = {
  get API_TOKEN(): string | undefined {
    return process.env.API_TOKEN
  },
  get API_URL(): string | undefined {
    return process.env.API_URL
  },
  get LOG_LEVEL(): string | undefined {
    return process.env.LOG_LEVEL || 'info'
  },
} as const

export const env = new Proxy(rawEnv, {
  get(target, prop: keyof typeof rawEnv) {
    const value = target[prop]
    if (value === undefined) {
      throw new Error(`Environment variable missing: ${prop}`)
    }
    return value
  },
}) as Record<keyof typeof rawEnv, string>
