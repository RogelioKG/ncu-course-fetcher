import type { College, CourseBase, CourseExtra, CourseType, Department, PasswordCard } from '../types'
import * as cheerio from 'cheerio'
import { XMLParser } from 'fast-xml-parser'
import he from 'he'

const DEPT_NAME_REGEX = /\(\d+\)$/
const TEACHER_SPLIT_REGEX = /,\s*/

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  tagValueProcessor: (tagName, tagValue) => he.decode(tagValue),
  attributeValueProcessor: (attrName, attrValue) => he.decode(attrValue),
})

export function preprocessCollegesAndDepartments(html: string): { colleges: College[], departments: Department[] } {
  const $ = cheerio.load(html)

  const colleges: College[] = []
  const departments: Department[] = []

  $('#byUnion_table table > tbody').toArray().forEach((table, i) => {
    const collegeId = `collegeI${i}`
    const collegeName = $(table).find('tr:nth-child(1) th').contents().eq(0).text().trim()
    colleges.push({ collegeId, collegeName })
    $(table).find('tr:nth-child(2) td ul li a').toArray().forEach((anchor) => {
      const href = $(anchor).attr('href') || ''
      departments.push({
        departmentId: href.replace('/Course/main/query/byUnion?dept=', '').trim(),
        departmentName: $(anchor).text().replace(DEPT_NAME_REGEX, '').trim(),
        collegeId,
      })
    })
  })

  return { colleges, departments }
}

export function preprocessCourseBases(xml: string, departmentId: string, collegeId: string): CourseBase[] {
  const data = xmlParser.parse(xml)
  const coursesData = [].concat(data?.Courses?.Course ?? [])

  return coursesData.map((item: any) => {
    const classNoRaw = String(item.ClassNo || '')
    const classNo = classNoRaw.length >= 6 ? `${classNoRaw.slice(0, 6)}-${classNoRaw.slice(6)}` : classNoRaw

    return {
      serialNo: Number(item.SerialNo),
      classNo,
      title: String(item.Title || '').trim(),
      credit: Number(item.credit || 0),
      passwordCard: String(item.passwordCard || '').trim() as PasswordCard,
      teachers: deflateTeachers(String(item.Teacher || '')),
      classTimes: deflateClassTime(String(item.ClassTime || '')),
      limitCnt: Number(item.limitCnt) || null,
      admitCnt: Number(item.admitCnt || 0),
      waitCnt: Number(item.waitCnt || 0),
      collegeId,
      departmentId,
    }
  })
}

export function preprocessCourseExtrasPage(html: string): { courseExtras: CourseExtra[], hasNextPage: boolean } {
  const $ = cheerio.load(html)

  const courseExtras = $('#item tbody tr').get().map((tr) => {
    const td1 = $(tr).find('td:nth-child(1)').html() || ''
    const serialNo = td1.split('<br>')[0].trim()
    const courseType = $(tr).find('td:nth-child(6)').text().trim()

    return {
      serialNo: Number(serialNo),
      courseType: normalizeCourseType(courseType),
    }
  })

  const hasNextPage = $('.pagelinks > :last-child').is('a')

  return { courseExtras, hasNextPage }
}

function normalizeCourseType(courseType: string): CourseType {
  const trimmed = courseType.trim()
  if (trimmed === '必修')
    return 'REQUIRED'
  if (trimmed === '選修')
    return 'ELECTIVE'
  throw new Error(`Unexpected course type encountered: "${trimmed}"`)
}

function deflateTeachers(teachersStr: string): string[] {
  return teachersStr ? teachersStr.split(TEACHER_SPLIT_REGEX).filter(Boolean) : []
}

function deflateClassTime(classTimesStr: string): string[] {
  return classTimesStr
    ? classTimesStr.split(',').filter(Boolean).map(t => t.length >= 2 ? `${t[0]}-${t.slice(1)}` : t)
    : []
}
