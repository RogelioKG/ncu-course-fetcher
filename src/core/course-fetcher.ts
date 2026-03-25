import type { MergedDataOutput, OutputCourse } from '../types'
import { fetchAllCourseExtras, fetchCollegesAndDepartments, fetchCourseBases } from '../helpers/fetch'
import { loggers } from '../helpers/logger'

export class CourseFetcher {
  async fetchAll(): Promise<MergedDataOutput> {
    loggers.core.info(`Start fetching course extras in background...`)
    const fetchExtrasPromise = (async () => {
      const allExtras = []
      for await (const { pageNo, courseExtras } of fetchAllCourseExtras()) {
        loggers.extras.info(`Extras Page ${pageNo} OK (${courseExtras.length} courses)`)
        allExtras.push(...courseExtras)
      }
      return allExtras
    })()

    loggers.core.info('Start fetching all colleges...')
    const { colleges, departments } = await fetchCollegesAndDepartments()
    loggers.core.info(`OK, ${colleges.length} colleges and ${departments.length} departments fetched.`)

    loggers.core.info(`Start fetching all courses for all departments...`)
    const fetchCoursesPromises = departments.map(async (department) => {
      const courses = await fetchCourseBases(department.departmentId, department.collegeId || '')
      loggers.courses.info(`OK, ${courses.length} courses fetched for ${department.departmentId}`)
      return courses
    })

    loggers.core.info(`Waiting for all requests to resolve...`)
    const [allCoursesArrays, allCourseExtras] = await Promise.all([
      Promise.all(fetchCoursesPromises),
      fetchExtrasPromise,
    ])

    loggers.core.info(`Processing and merging data...`)
    const courseMap = new Map<number, OutputCourse>()
    const allCourses = allCoursesArrays.flat()

    for (const courseBase of allCourses) {
      let course = courseMap.get(courseBase.serialNo)
      if (!course) {
        const { collegeId, departmentId, ...rest } = courseBase
        course = { ...rest, collegeIds: [], departmentIds: [] }
        courseMap.set(courseBase.serialNo, course)
      }

      if (!course.collegeIds.includes(courseBase.collegeId)) {
        course.collegeIds.push(courseBase.collegeId)
      }
      if (!course.departmentIds.includes(courseBase.departmentId)) {
        course.departmentIds.push(courseBase.departmentId)
      }
    }

    loggers.core.info(`Merging extras into courses...`)
    for (const extra of allCourseExtras) {
      const course = courseMap.get(extra.serialNo)
      if (course) {
        course.courseType = extra.courseType
      }
    }

    return {
      colleges,
      departments,
      courses: Array.from(courseMap.values()),
      LAST_UPDATE_TIME: new Date().toISOString(),
    }
  }
}
