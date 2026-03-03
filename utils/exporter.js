const db = require("./repository");

function csvEscape(value) {
  const str = String(value == null ? "" : value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCSV(headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((row) => {
    lines.push(row.map(csvEscape).join(","));
  });
  return lines.join("\n");
}

function exportStudentsCSV() {
  const students = db.getStudents("");
  return toCSV(
    ["学生ID", "姓名", "年级", "班型", "班主任", "学生电话", "家长电话", "家长称呼", "邮箱", "地址", "薄弱知识点", "备注"],
    students.map((s) => [
      s.id,
      s.name,
      s.grade || "",
      s.classType || "",
      s.homeroomTeacher || "",
      s.phone || "",
      s.parentPhone || "",
      s.guardian || "",
      s.email || "",
      s.address || "",
      (s.weakTopics || []).join("|"),
      s.notes || ""
    ])
  );
}

function exportLessonsCSV() {
  const raw = db.getRawDB();
  const studentMap = {};
  raw.students.forEach((s) => {
    studentMap[s.id] = s.name;
  });

  const rows = [];
  raw.lessons.forEach((lesson) => {
    lesson.records.forEach((r) => {
      rows.push([
        lesson.id,
        lesson.lessonDate,
        lesson.startTime || "",
        lesson.endTime || "",
        lesson.subject || "数学",
        lesson.teacher || "",
        lesson.status || "已完成",
        lesson.duration || 120,
        lesson.classId,
        studentMap[r.studentId] || r.studentId,
        r.attendance,
        r.comment || "",
        lesson.content || "",
        lesson.studentPerformance || "",
        lesson.homework || "",
        lesson.topic || "",
        lesson.learnedTopics || "",
        Array.isArray(lesson.weakTopics) ? lesson.weakTopics.join("|") : "",
        lesson.notes || ""
      ]);
    });
  });

  return toCSV(
    [
      "课堂ID",
      "日期",
      "开始时间",
      "结束时间",
      "科目",
      "授课老师",
      "课程状态",
      "时长(分钟)",
      "班级ID",
      "学生",
      "出勤",
      "评语",
      "课程内容",
      "学生情况",
      "课后作业",
      "知识点",
      "本节学习知识点",
      "薄弱知识点",
      "备注"
    ],
    rows
  );
}

function exportExamsCSV() {
  const exams = db.getExamRecords("");
  return toCSV(
    ["考试ID", "学生", "考试名称", "考试日期", "总分", "数学", "英语", "评语"],
    exams.map((e) => [
      e.id,
      e.studentName,
      e.examName,
      e.examDate,
      e.totalScore,
      (e.subjectScores || {}).math || 0,
      (e.subjectScores || {}).english || 0,
      e.comment || ""
    ])
  );
}

module.exports = {
  exportStudentsCSV,
  exportLessonsCSV,
  exportExamsCSV
};
