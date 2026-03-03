const DBSeedFromSQLite = require("../data/student_info.seed.json");
const KEY = "student_manage_db_v2";

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

function uid(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function readDB() {
  const data = wx.getStorageSync(KEY);
  if (!data) {
    const seed = createSeedData();
    wx.setStorageSync(KEY, seed);
    return seed;
  }
  return data;
}

function writeDB(data) {
  wx.setStorageSync(KEY, data);
}

function resetDB() {
  const seed = createSeedData();
  writeDB(seed);
}

function getClasses() {
  return readDB().classes;
}

function getTags() {
  return readDB().tags;
}

function getStudents(keyword) {
  const db = readDB();
  const classMap = {};
  db.classes.forEach((c) => {
    classMap[c.id] = c.name;
  });
  const list = db.students.map((s) => ({
    id: s.id,
    name: s.name,
    classId: s.classId,
    className: classMap[s.classId] || "未分班",
    phone: s.phone,
    guardian: s.guardian
  }));
  const q = (keyword || "").trim();
  if (!q) {
    return list;
  }
  return list.filter(
    (s) =>
      String(s.name || "").indexOf(q) >= 0 ||
      String(s.className || "").indexOf(q) >= 0 ||
      String(s.phone || "").indexOf(q) >= 0
  );
}

function getStudentById(studentId) {
  const students = getStudents();
  return students.find((s) => s.id === studentId) || null;
}

function addStudent(payload) {
  const db = readDB();
  const item = {
    id: uid("stu"),
    name: payload.name,
    classId: payload.classId,
    phone: payload.phone || "",
    guardian: payload.guardian || ""
  };
  db.students.unshift(item);
  writeDB(db);
  return item;
}

function saveLesson(payload) {
  const db = readDB();
  const lesson = {
    id: uid("lesson"),
    classId: payload.classId,
    lessonDate: payload.lessonDate,
    content: payload.content,
    homework: payload.homework,
    records: payload.records,
    createdAt: Date.now()
  };
  db.lessons.unshift(lesson);
  writeDB(db);
  return lesson;
}

function getLessonsByStudent(studentId) {
  const db = readDB();
  const list = [];
  db.lessons.forEach((l) => {
    const found = l.records.find((r) => r.studentId === studentId);
    if (found) {
      list.push({
        lessonId: l.id,
        lessonDate: l.lessonDate,
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

  const missingLessonRecords = db.students.length - (db.lessons[0] ? db.lessons[0].records.length : 0);

  return {
    totalStudents: db.students.length,
    totalLessons: db.lessons.length,
    weeklyExams,
    weaknessAlerts: db.weaknessLogs.length,
    pendingRecords: missingLessonRecords > 0 ? missingLessonRecords : 0
  };
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
  getTags,
  getStudents,
  getStudentById,
  addStudent,
  saveLesson,
  getLessonsByStudent,
  saveExam,
  getExamRecords,
  addWeaknessLog,
  getWeaknessLogsByStudent,
  getWeaknessStats,
  getDashboardStats,
  getLatestLessonSummary,
  resetDB
};
