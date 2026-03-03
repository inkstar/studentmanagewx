const db = require("./db");
const runtime = require("./runtime");

let warned = false;

function isCloudMode() {
  return runtime.getRuntime().dataMode === "CLOUD";
}

function warnCloudFallback() {
  if (!warned && isCloudMode()) {
    warned = true;
    console.warn("CLOUD mode selected, but cloud APIs are not wired yet. Fallback to LOCAL data.");
  }
}

function getClasses() {
  warnCloudFallback();
  return db.getClasses();
}

function getTags() {
  warnCloudFallback();
  return db.getTags();
}

function getStudents(keyword) {
  warnCloudFallback();
  return db.getStudents(keyword);
}

function getStudentById(studentId) {
  warnCloudFallback();
  return db.getStudentById(studentId);
}

function addStudent(payload) {
  warnCloudFallback();
  return db.addStudent(payload);
}

function saveLesson(payload) {
  warnCloudFallback();
  return db.saveLesson(payload);
}

function getLessonsByStudent(studentId) {
  warnCloudFallback();
  return db.getLessonsByStudent(studentId);
}

function saveExam(payload) {
  warnCloudFallback();
  return db.saveExam(payload);
}

function getExamRecords(studentId) {
  warnCloudFallback();
  return db.getExamRecords(studentId);
}

function addWeaknessLog(payload) {
  warnCloudFallback();
  return db.addWeaknessLog(payload);
}

function getWeaknessLogsByStudent(studentId) {
  warnCloudFallback();
  return db.getWeaknessLogsByStudent(studentId);
}

function getWeaknessStats() {
  warnCloudFallback();
  return db.getWeaknessStats();
}

function getDashboardStats() {
  warnCloudFallback();
  return db.getDashboardStats();
}

function getLatestLessonSummary() {
  warnCloudFallback();
  return db.getLatestLessonSummary();
}

function resetDB() {
  warnCloudFallback();
  return db.resetDB();
}

function getRawDB() {
  warnCloudFallback();
  return db.getRawDB();
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
  resetDB,
  getRawDB,
  isCloudMode
};
