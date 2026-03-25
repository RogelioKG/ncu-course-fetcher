import fs from 'node:fs/promises'
import process from 'node:process'
import { CourseFetcher } from '../core/course-fetcher'
import { env } from '../helpers/env'
import { loggers } from '../helpers/logger'

try {
  const fetcher = new CourseFetcher()
  const data = await fetcher.fetchAll()

  loggers.update.info('Writing result into data/all.json ...')
  await fs.mkdir('data', { recursive: true })
  await fs.writeFile('data/all.json', JSON.stringify(data))

  loggers.update.info('Syncing to Backend API...')

  const token = env.API_TOKEN
  const apiUrl = env.API_URL

  const syncRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!syncRes.ok) {
    throw new Error(`Sync failed: ${syncRes.status} ${syncRes.statusText}`)
  }
  loggers.update.info('Successfully synced data to backend API.')
}
catch (err) {
  loggers.update.error({ err }, 'Fatal error during update')
  process.exit(1)
}
