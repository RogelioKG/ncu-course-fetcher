export type PasswordCard = 'ALL' | 'NONE' | 'OPTIONAL'
export type CourseType = 'REQUIRED' | 'ELECTIVE'
export type LoggerNamespace = 'core' | 'extras' | 'courses' | 'fetch' | 'update'

export interface Department {
  departmentId: string
  departmentName: string
  collegeId?: string
}

export interface College {
  collegeId: string
  collegeName: string
}

export interface CourseBase {
  serialNo: number
  classNo: string
  title: string
  credit: number
  passwordCard: PasswordCard
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

export interface OutputCourse {
  serialNo: number
  classNo: string
  title: string
  credit: number
  passwordCard: PasswordCard
  teachers: string[]
  classTimes: string[]
  limitCnt: number | null
  admitCnt: number
  waitCnt: number
  collegeIds: string[]
  departmentIds: string[]
  courseType?: CourseType
}

export interface MergedDataOutput {
  colleges: College[]
  departments: Department[]
  courses: OutputCourse[]
  LAST_UPDATE_TIME: string
}
