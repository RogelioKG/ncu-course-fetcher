import type { College, CourseBase, CourseExtra, Department } from '../types'
import { loggers } from './logger'
import { preprocessCollegesAndDepartments, preprocessCourseBases, preprocessCourseExtrasPage } from './preprocess'

const COURSE_HEADERS = {
  'Accept-Language': 'zh-TW',
}

async function fetchWithRetry(url: string | URL, options?: RequestInit, retries = 5, delayMs = 5000): Promise<Response> {
  const urlString = url.toString()
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(urlString, { ...options, signal: AbortSignal.timeout(20000) })
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      return response
    }
    catch (error: any) {
      if (i === retries - 1)
        throw error
      loggers.fetch.warn(`Fetch failed for ${urlString}, retrying (${i + 1}/${retries})... Error: ${error.message}`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('Unreachable')
}

export async function fetchCollegesAndDepartments(): Promise<{ colleges: College[], departments: Department[] }> {
  const response = await fetchWithRetry('https://cis.ncu.edu.tw/Course/main/query/byUnion', {
    headers: COURSE_HEADERS,
  })
  return preprocessCollegesAndDepartments(await response.text())
}

export async function fetchCourseBases(departmentId: string, collegeId: string): Promise<CourseBase[]> {
  const url = new URL('https://cis.ncu.edu.tw/Course/main/support/course.xml')
  url.searchParams.append('id', departmentId)

  const response = await fetchWithRetry(url, { headers: COURSE_HEADERS })
  return preprocessCourseBases(await response.text(), departmentId, collegeId)
}

export async function* fetchAllCourseExtras(): AsyncGenerator<{ pageNo: number, courseExtras: CourseExtra[] }> {
  for (let pageNo = 1; true; pageNo++) {
    const url = new URL('https://cis.ncu.edu.tw/Course/main/query/byKeywords')
    url.searchParams.append('d-49489-p', pageNo.toString())
    url.searchParams.append('query', 'true')

    const response = await fetchWithRetry(url, { headers: COURSE_HEADERS })
    const { courseExtras, hasNextPage } = preprocessCourseExtrasPage(await response.text())

    yield { pageNo, courseExtras }

    if (!hasNextPage)
      break
  }
}
