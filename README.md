# NCU-Course-Fetcher

## Data Structure

### View

```text
.
├── meta
│   ├── version           : string  (版號，與 package.json 同步)
│   └── updatedAt         : string  (更新時間，ISO 8601 格式)
└── data
    ├── semester          : string  (學期代碼，例："112-2")
    ├── colleges          : Array<College>
    │   ├── collegeId     : string  (學院代碼)
    │   └── collegeName   : string  (學院名稱)
    ├── departments       : Array<Department>
    │   ├── collegeId     : string  (所屬學院代碼)
    │   ├── departmentId  : string  (系所代碼)
    │   └── departmentName: string  (系所名稱)
    └── courses           : Array<Course>
        ├── serialNo      : number  (選課流水號)
        ├── classNo       : string  (課程代號)
        ├── title         : string  (課程名稱)
        ├── credit        : number  (學分數)
        ├── courseType    : string  (必選修別：REQUIRED / ELECTIVE)
        ├── passwordCard  : string  (密碼卡需求：ALL / NONE / OPTIONAL)
        ├── teachers      : Array<string> (授課教師)
        ├── classTimes    : Array<string> (上課時間)
        ├── limitCnt      : number | null (人數上限)
        ├── admitCnt      : number  (已錄取人數)
        ├── waitCnt       : number  (候補人數)
        ├── collegeIds    : Array<string> (所屬學院代碼)
        └── departmentIds : Array<string> (所屬系所代碼)
```

### Example

```json
{
  "meta": {
    "version": "2.0.0",
    "updatedAt": "2026-03-22T08:00:00.000Z"
  },
  "data": {
    "semester": "114-2",
    "colleges": [
      {
        "collegeId": "collegeI5",
        "collegeName": "資訊電機學院"
      }
    ],
    "departments": [
      {
        "departmentId": "deptI1I5002I0",
        "departmentName": "資訊工程學系",
        "collegeId": "collegeI5"
      }
    ],
    "courses": [
      {
        "serialNo": 52001,
        "classNo": "CE1002-*",
        "title": "計算機概論 Ⅱ",
        "credit": 3,
        "passwordCard": "OPTIONAL",
        "teachers": [
          "王大明"
        ],
        "classTimes": [
          "4-5",
          "4-6",
          "4-7"
        ],
        "limitCnt": 140,
        "admitCnt": 128,
        "waitCnt": 0,
        "collegeIds": [
          "collegeI5"
        ],
        "departmentIds": [
          "deptI1I5002I0"
        ],
        "courseType": "REQUIRED"
      }
    ]
  }
}
```
