import type { College, CourseExtra, Department, RawCourse } from '../types'
import { loggers } from './logger'
import { preprocessCollegesDepartmentsAndSemester, preprocessCourseExtras, preprocessRawCourses } from './preprocess'

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
      loggers.network.warn(`Fetch failed for ${urlString}, retrying (${i + 1}/${retries})... Error: ${error.message}`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('Unreachable')
}

export async function fetchCollegesDepartmentsAndSemester(): Promise<{ colleges: College[], departments: Department[], semester: string }> {
  const response = await fetchWithRetry('https://cis.ncu.edu.tw/Course/main/query/byUnion', {
    headers: COURSE_HEADERS,
  })
  return preprocessCollegesDepartmentsAndSemester(await response.text())
}

export async function fetchRawCourses(departmentId: string, collegeId: string): Promise<RawCourse[]> {
  const url = new URL('https://cis.ncu.edu.tw/Course/main/support/course.xml')
  url.searchParams.append('id', departmentId)

  const response = await fetchWithRetry(url, { headers: COURSE_HEADERS })
  return preprocessRawCourses(await response.text(), departmentId, collegeId)
}

export async function* fetchCourseExtras(): AsyncGenerator<{ pageNo: number, courseExtras: CourseExtra[] }> {
  for (let pageNo = 1; true; pageNo++) {
    const url = new URL('https://cis.ncu.edu.tw/Course/main/query/byKeywords')
    url.searchParams.append('d-49489-p', pageNo.toString())
    url.searchParams.append('query', 'true')

    const response = await fetchWithRetry(url, { headers: COURSE_HEADERS })
    const { courseExtras, hasNextPage } = preprocessCourseExtras(await response.text())

    yield { pageNo, courseExtras }

    if (!hasNextPage)
      break
  }
}
