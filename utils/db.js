let DBSeedFromSQLite = null;
try {
  DBSeedFromSQLite = require("../data/student_info.seed.json");
} catch (err) {
  console.warn("load sqlite seed failed, fallback to default seed", err);
}
const KEY = "student_manage_db_v2";
const GRADE_OPTIONS = ["六年级", "七年级", "八年级", "九年级", "高一", "高二", "高三"];

function createSeedData() {
  if (DBSeedFromSQLite && Array.isArray(DBSeedFromSQLite.students) && DBSeedFromSQLite.students.length) {
    return JSON.parse(JSON.stringify(DBSeedFromSQLite));
  }
  return {
    classes: [{ id: "c1", name: "默认班级" }],
    subjects: [{ id: "s_math", name: "数学" }],
    tags: [{ id: "t_default", name: "待补标签" }],
    students: [],
    lessons: [],
    exams: [],
    weaknessLogs: []
  };
}

function normalizeDB(data) {
  const normalized = data && typeof data === "object" ? data : {};
  normalized.classes = Array.isArray(normalized.classes) ? normalized.classes : [];
  normalized.subjects = Array.isArray(normalized.subjects) ? normalized.subjects : [];
  normalized.tags = Array.isArray(normalized.tags) ? normalized.tags : [];
  normalized.students = Array.isArray(normalized.students) ? normalized.students : [];
  normalized.lessons = Array.isArray(normalized.lessons) ? normalized.lessons : [];
  normalized.exams = Array.isArray(normalized.exams) ? normalized.exams : [];
  normalized.weaknessLogs = Array.isArray(normalized.weaknessLogs) ? normalized.weaknessLogs : [];
  return normalized;
}

function inferGradeFromStudent(student, classMap) {
  if (student && student.grade && GRADE_OPTIONS.indexOf(student.grade) >= 0) {
    return student.grade;
  }
  const className = classMap[(student || {}).classId] || "";
  const found = GRADE_OPTIONS.find((g) => className.indexOf(g) >= 0);
  return found || "高一";
}

function ensureClassForGrade(db, grade) {
  const targetGrade = GRADE_OPTIONS.indexOf(grade) >= 0 ? grade : "高一";
  const existing = db.classes.find((c) => String(c.name || "").indexOf(targetGrade) >= 0);
  if (existing) {
    return existing.id;
  }
  const classId = "grade_" + targetGrade;
  db.classes.unshift({
    id: classId,
    name: targetGrade
  });
  return classId;
}

function uid(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function readDB() {
  const raw = wx.getStorageSync(KEY);
  if (!raw) {
    const seed = createSeedData();
    wx.setStorageSync(KEY, seed);
    return seed;
  }
  const data = normalizeDB(raw);
  if (!data.classes.length && !data.students.length && !data.lessons.length && !data.exams.length) {
    const seed = createSeedData();
    wx.setStorageSync(KEY, seed);
    return seed;
  }
  return data;
}

function writeDB(data) {
  wx.setStorageSync(KEY, normalizeDB(data));
}

function getRawDB() {
  return readDB();
}

function resetDB() {
  const seed = createSeedData();
  writeDB(seed);
}

function getClasses() {
  return readDB().classes;
}

function getGradeOptions() {
  return GRADE_OPTIONS.slice();
}

function getTags() {
  return readDB().tags;
}

function getStudents(query) {
  const db = readDB();
  const classMap = {};
  const lessonCountMap = {};
  const examCountMap = {};
  let keyword = "";
  let gradeFilter = "";

  if (typeof query === "string") {
    keyword = query;
  } else if (query && typeof query === "object") {
    keyword = query.keyword || "";
    gradeFilter = query.grade || "";
  }

  db.lessons.forEach((l) => {
    (l.records || []).forEach((r) => {
      lessonCountMap[r.studentId] = (lessonCountMap[r.studentId] || 0) + 1;
    });
  });

  db.exams.forEach((e) => {
    examCountMap[e.studentId] = (examCountMap[e.studentId] || 0) + 1;
  });

  db.classes.forEach((c) => {
    classMap[c.id] = c.name;
  });
  const list = db.students.map((s) => ({
    id: s.id,
    name: s.name,
    grade: inferGradeFromStudent(s, classMap),
    classId: s.classId,
    className: classMap[s.classId] || "未分班",
    phone: s.phone,
    guardian: s.guardian,
    lessonCount: lessonCountMap[s.id] || 0,
    examCount: examCountMap[s.id] || 0
  }));
  const q = (keyword || "").trim();
  const g = (gradeFilter || "").trim();
  return list.filter((s) => {
    const hitKeyword =
      !q ||
      String(s.name || "").indexOf(q) >= 0 ||
      String(s.className || "").indexOf(q) >= 0 ||
      String(s.phone || "").indexOf(q) >= 0;
    const hitGrade = !g || String(s.grade || "") === g;
    return hitKeyword && hitGrade;
  });
}

function getStudentById(studentId) {
  const students = getStudents();
  return students.find((s) => s.id === studentId) || null;
}

function addStudent(payload) {
  const db = readDB();
  const grade = payload.grade && GRADE_OPTIONS.indexOf(payload.grade) >= 0 ? payload.grade : "高一";
  const classId = payload.classId || ensureClassForGrade(db, grade);
  const item = {
    id: uid("stu"),
    name: payload.name,
    grade,
    classId,
    phone: payload.phone || "",
    guardian: payload.guardian || ""
  };
  db.students.unshift(item);
  writeDB(db);
  return item;
}

function addStudentsBatch(items) {
  const db = readDB();
  const created = [];
  const defaultGrade = "高一";

  (items || []).forEach((item) => {
    const name = String(item.name || "").trim();
    if (!name) {
      return;
    }
    const grade = GRADE_OPTIONS.indexOf(item.grade) >= 0 ? item.grade : defaultGrade;
    const classId = item.classId || ensureClassForGrade(db, grade);
    const student = {
      id: uid("stu"),
      name,
      grade,
      classId,
      phone: String(item.phone || "").trim(),
      guardian: String(item.guardian || "").trim()
    };
    db.students.unshift(student);
    created.push(student);
  });

  writeDB(db);
  return created;
}

function saveLesson(payload) {
  const db = readDB();
  const lesson = {
    id: uid("lesson"),
    classId: payload.classId,
    lessonDate: payload.lessonDate,
    subject: payload.subject || "数学",
    teacher: payload.teacher || "",
    duration: Number(payload.duration || 120),
    status: payload.status || "已完成",
    content: payload.content,
    homework: payload.homework,
    records: payload.records,
    createdAt: Date.now()
  };
  db.lessons.unshift(lesson);
  writeDB(db);
  return lesson;
}

function getLessons(options) {
  const db = readDB();
  const opts = options || {};
  const classId = opts.classId || "";
  const grade = opts.grade || "";
  const limit = Number(opts.limit || 50);

  const classMap = {};
  db.classes.forEach((c) => {
    classMap[c.id] = c.name;
  });

  const studentMap = {};
  db.students.forEach((s) => {
    studentMap[s.id] = {
      name: s.name,
      grade: inferGradeFromStudent(s, classMap)
    };
  });

  const list = db.lessons
    .filter((l) => {
      const classHit = !classId ? true : l.classId === classId;
      if (!classHit) {
        return false;
      }
      if (!grade) {
        return true;
      }
      const sid = l.records && l.records[0] ? l.records[0].studentId : "";
      const studentGrade = sid && studentMap[sid] ? studentMap[sid].grade : "";
      return studentGrade === grade;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit)
    .map((l) => ({
      id: l.id,
      classId: l.classId,
      className: classMap[l.classId] || "未分班",
      grade:
        (l.records && l.records[0] && studentMap[l.records[0].studentId] && studentMap[l.records[0].studentId].grade) ||
        "高一",
      studentName:
        (l.records && l.records[0] && studentMap[l.records[0].studentId] && studentMap[l.records[0].studentId].name) ||
        "",
      lessonDate: l.lessonDate,
      subject: l.subject || "数学",
      teacher: l.teacher || "",
      duration: l.duration || 120,
      status: l.status || "已完成",
      content: l.content || "",
      homework: l.homework || "",
      studentCount: Array.isArray(l.records) ? l.records.length : 0
    }));

  return list;
}

function getLessonsByStudent(studentId) {
  const db = readDB();
  const classMap = {};
  db.classes.forEach((c) => {
    classMap[c.id] = c.name;
  });
  const target = db.students.find((s) => s.id === studentId);
  const targetGrade = inferGradeFromStudent(target, classMap);
  const list = [];
  db.lessons.forEach((l) => {
    const found = l.records.find((r) => r.studentId === studentId);
    if (found) {
      list.push({
        lessonId: l.id,
        lessonDate: l.lessonDate,
        grade: targetGrade,
        subject: l.subject || "数学",
        teacher: l.teacher || "",
        duration: l.duration || 120,
        status: l.status || "已完成",
        content: l.content,
        attendance: found.attendance,
        comment: found.comment || ""
      });
    }
  });
  return list;
}

function saveExam(payload) {
  const db = readDB();
  const exam = {
    id: uid("exam"),
    studentId: payload.studentId,
    examName: payload.examName,
    examDate: payload.examDate,
    subjectScores: payload.subjectScores,
    totalScore: payload.totalScore,
    masteryLevel: payload.masteryLevel || "一般",
    comment: payload.comment || "",
    weaknessTagId: payload.weaknessTagId || "",
    createdAt: Date.now()
  };
  db.exams.unshift(exam);

  if (payload.weaknessTagId) {
    db.weaknessLogs.unshift({
      id: uid("weak"),
      studentId: payload.studentId,
      tagId: payload.weaknessTagId,
      note: "由成绩录入自动记录",
      sourceType: "EXAM",
      createdAt: Date.now()
    });
  }

  writeDB(db);
  return exam;
}

function getExamRecords(studentId) {
  const db = readDB();
  const classMap = {};
  db.classes.forEach((c) => {
    classMap[c.id] = c.name;
  });
  const studentMap = {};
  db.students.forEach((s) => {
    studentMap[s.id] = s.name;
  });
  return db.exams
    .filter((e) => (!studentId ? true : e.studentId === studentId))
    .map((e) => ({
      id: e.id,
      studentId: e.studentId,
      studentName: studentMap[e.studentId] || "未知学生",
      examName: e.examName,
      examDate: e.examDate,
      totalScore: e.totalScore,
      masteryLevel: e.masteryLevel || "一般",
      subjectScores: e.subjectScores,
      comment: e.comment,
      className: classMap[(db.students.find((s) => s.id === e.studentId) || {}).classId] || ""
    }));
}

function addWeaknessLog(payload) {
  const db = readDB();
  const log = {
    id: uid("weak"),
    studentId: payload.studentId,
    tagId: payload.tagId,
    note: payload.note || "",
    sourceType: payload.sourceType || "MANUAL",
    createdAt: Date.now()
  };
  db.weaknessLogs.unshift(log);
  writeDB(db);
  return log;
}

function getWeaknessLogsByStudent(studentId) {
  const db = readDB();
  const tagMap = {};
  db.tags.forEach((t) => {
    tagMap[t.id] = t.name;
  });
  return db.weaknessLogs
    .filter((l) => l.studentId === studentId)
    .map((l) => ({
      id: l.id,
      tagName: tagMap[l.tagId] || "未知标签",
      note: l.note,
      sourceType: l.sourceType,
      createdAt: formatDateTime(l.createdAt)
    }));
}

function getWeaknessStats() {
  const db = readDB();
  const countMap = {};
  db.weaknessLogs.forEach((l) => {
    countMap[l.tagId] = (countMap[l.tagId] || 0) + 1;
  });

  return db.tags
    .map((t) => ({
      tagId: t.id,
      tagName: t.name,
      count: countMap[t.id] || 0
    }))
    .sort((a, b) => b.count - a.count);
}

function getDashboardStats() {
  const db = readDB();
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()));

  let weeklyExams = 0;
  db.exams.forEach((e) => {
    const d = new Date(e.examDate + "T00:00:00");
    if (d >= weekStart && d <= weekEnd) {
      weeklyExams += 1;
    }
  });

  let totalAttendance = 0;
  let presentAttendance = 0;
  db.lessons.forEach((l) => {
    (l.records || []).forEach((r) => {
      totalAttendance += 1;
      if (r.attendance === "出勤") {
        presentAttendance += 1;
      }
    });
  });

  const attendanceRate = totalAttendance ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

  const missingLessonRecords = db.students.length - (db.lessons[0] ? db.lessons[0].records.length : 0);

  return {
    totalStudents: db.students.length,
    totalLessons: db.lessons.length,
    weeklyExams,
    weaknessAlerts: db.weaknessLogs.length,
    pendingRecords: missingLessonRecords > 0 ? missingLessonRecords : 0,
    attendanceRate
  };
}

function getProgressDistribution() {
  const db = readDB();
  const dist = {
    excellent: 0,
    good: 0,
    fair: 0,
    weak: 0
  };
  db.exams.forEach((e) => {
    const lv = String(e.masteryLevel || "一般");
    if (lv === "优秀") {
      dist.excellent += 1;
    } else if (lv === "良好") {
      dist.good += 1;
    } else if (lv === "一般") {
      dist.fair += 1;
    } else {
      dist.weak += 1;
    }
  });
  return dist;
}

function formatDateTime(ts) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day + " " + h + ":" + min;
}

function getLatestLessonSummary() {
  const db = readDB();
  if (!db.lessons.length) {
    return null;
  }
  const latest = db.lessons[0];
  const present = latest.records.filter((r) => r.attendance === "出勤").length;
  const late = latest.records.filter((r) => r.attendance === "迟到").length;
  const absent = latest.records.filter((r) => r.attendance === "缺勤").length;
  return {
    classId: latest.classId,
    lessonDate: latest.lessonDate,
    content: latest.content,
    present,
    late,
    absent,
    total: latest.records.length
  };
}

module.exports = {
  getClasses,
  getGradeOptions,
  getTags,
  getStudents,
  getStudentById,
  addStudent,
  addStudentsBatch,
  getLessons,
  saveLesson,
  getLessonsByStudent,
  saveExam,
  getExamRecords,
  addWeaknessLog,
  getWeaknessLogsByStudent,
  getWeaknessStats,
  getDashboardStats,
  getProgressDistribution,
  getLatestLessonSummary,
  resetDB,
  getRawDB
};
