const db = require("./db");

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
    ["学生ID", "姓名", "班级", "手机号", "家长"],
    students.map((s) => [s.id, s.name, s.className, s.phone, s.guardian])
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
        lesson.classId,
        studentMap[r.studentId] || r.studentId,
        r.attendance,
        r.comment || "",
        lesson.content || "",
        lesson.homework || ""
      ]);
    });
  });

  return toCSV(
    ["课堂ID", "日期", "班级ID", "学生", "出勤", "评语", "课程内容", "作业"],
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
