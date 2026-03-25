export type PasswordCardRequirement = 'ALL' | 'NONE' | 'OPTIONAL'
export type CourseType = 'REQUIRED' | 'ELECTIVE'
export type LoggerNamespace = 'extra' | 'dept' | 'course' | 'network' | 'merge' | 'sync'

export interface Department {
  departmentId: string
  departmentName: string
  collegeId: string
}

export interface College {
  collegeId: string
  collegeName: string
}

export interface RawCourse {
  serialNo: number
  classNo: string
  title: string
  credit: number
  passwordCard: PasswordCardRequirement
  teachers: string[]
  classTimes: string[]
  limitCnt: number | null
  admitCnt: number
  waitCnt: number
  collegeId: string
  departmentId: string
}

export interface CourseExtra {
  serialNo: number
  courseType: CourseType
}

export type Course
  = Omit<RawCourse, 'collegeId' | 'departmentId'> & CourseExtra & {
    collegeIds: string[]
    departmentIds: string[]
  }

export interface CourseData {
  meta: {
    version: string
    updatedAt: string
  }
  data: {
    semester: string
    colleges: College[]
    departments: Department[]
    courses: Course[]
  }
}
