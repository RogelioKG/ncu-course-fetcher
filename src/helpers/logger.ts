import type { LoggerNamespace } from '../types'
import pino from 'pino'
import { env } from './env'

const baseLogger = pino({
  level: env.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
})

export const loggers = new Proxy({} as Record<LoggerNamespace, pino.Logger>, {
  get(target, prop: string) {
    const key = prop as LoggerNamespace
    if (!target[key]) {
      target[key] = baseLogger.child({ name: key.toUpperCase() })
    }
    return target[key]
  },
})
