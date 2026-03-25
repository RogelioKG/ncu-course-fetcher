import type { Course, CourseData, CourseType, Department, RawCourse } from '../types'
import pLimit from 'p-limit'
import { version } from '../../package.json'
import { fetchCollegesDepartmentsAndSemester, fetchCourseExtras, fetchRawCourses } from '../helpers/fetch'
import { loggers } from '../helpers/logger'

export class CourseFetcher {
  private limit = pLimit(10)

  async fetch(): Promise<CourseData> {
    const { colleges, departments, semester } = await this.fetchCollegesDepartmentsAndSemester()

    const [rawCourses, extraMap] = await Promise.all([
      this.fetchAllRawCourses(departments),
      this.fetchExtraMap(),
    ])

    const courses = this.mergeRawCoursesAndCourseExtras(rawCourses, extraMap)

    return {
      meta: {
        version,
        updatedAt: new Date().toISOString(),
      },
      data: {
        semester,
        colleges,
        departments,
        courses,
      },
    }
  }

  private async fetchCollegesDepartmentsAndSemester() {
    loggers.dept.info(`Start fetching all colleges and departments...`)
    const { colleges, departments, semester } = await fetchCollegesDepartmentsAndSemester()
    loggers.dept.info(`OK, ${colleges.length} colleges and ${departments.length} departments fetched for semester ${semester}`)

    return { colleges, departments, semester }
  }

  private async fetchAllRawCourses(departments: Department[]): Promise<RawCourse[]> {
    const rawCoursesResults = await Promise.all(
      departments.map(department =>
        this.limit(async () => {
          loggers.course.info(`Start fetching raw courses for ${department.departmentId}...`)
          const courses = await fetchRawCourses(department.departmentId, department.collegeId)
          loggers.course.info(`OK, ${courses.length} raw courses fetched for ${department.departmentId}`)
          return courses
        }),
      ),
    )

    return rawCoursesResults.flat()
  }

  private async fetchExtraMap(): Promise<Map<number, CourseType>> {
    loggers.extra.info(`Start fetching all course extras...`)

    const map = new Map<number, CourseType>()
    for await (const { pageNo, courseExtras } of fetchCourseExtras()) {
      loggers.extra.info(`OK, ${courseExtras.length} course extras fetched for page ${pageNo}`)
      for (const e of courseExtras) {
        map.set(e.serialNo, e.courseType)
      }
    }

    loggers.extra.info(`All course extras fetched, total ${map.size} entries`)

    return map
  }

  private mergeRawCoursesAndCourseExtras(rawCourses: RawCourse[], extraMap: Map<number, CourseType>): Course[] {
    loggers.merge.info(`Start merging raw courses and course extras...`)

    const courseMap = new Map<number, Course>()
    for (const raw of rawCourses) {
      const course = courseMap.get(raw.serialNo)
      if (course) {
        if (!course.collegeIds.includes(raw.collegeId))
          course.collegeIds.push(raw.collegeId)
        if (!course.departmentIds.includes(raw.departmentId))
          course.departmentIds.push(raw.departmentId)
        continue
      }
      const { collegeId, departmentId, ...rest } = raw
      const newCourse: Course = {
        ...rest,
        courseType: extraMap.get(raw.serialNo) ?? 'ELECTIVE',
        collegeIds: [collegeId],
        departmentIds: [departmentId],
      }
      courseMap.set(raw.serialNo, newCourse)
    }

    loggers.merge.info(`Merging completed, total ${courseMap.size} unique courses generated`)

    return Array.from(courseMap.values())
  }
}
