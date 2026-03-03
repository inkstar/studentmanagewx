const repo = require("../../utils/repository");

const ATTENDANCE_OPTIONS = ["出勤", "迟到", "缺勤"];
const LESSON_STATUS = ["已完成", "已取消", "已改期"];

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

Page({
  data: {
    fatalError: "",
    grades: [],
    gradeIndex: 0,
    currentGrade: "高一",
    students: [],
    studentIndex: 0,
    currentStudentName: "暂无学生",
    lessons: [],
    showCreatePanel: false,
    lessonDate: today(),
    subject: "数学",
    teacher: "",
    duration: "120",
    lessonStatusOptions: LESSON_STATUS,
    lessonStatusIndex: 0,
    attendanceOptions: ATTENDANCE_OPTIONS,
    attendanceIndex: 0,
    attendance: "出勤",
    comment: "",
    content: "",
    homework: ""
  },

  onShow() {
    try {
      const grades = repo.getGradeOptions();
      const gradeIndex = grades.length ? Math.min(this.data.gradeIndex, grades.length - 1) : 0;
      const currentGrade = grades[gradeIndex] || "高一";

      this.setData({
        fatalError: "",
        grades,
        gradeIndex,
        currentGrade
      });
      this.loadStudentsByGrade();
      this.loadLessons();
    } catch (err) {
      console.error("lesson onShow failed", err);
      this.setData({
        fatalError: "课程页面加载失败，请点击“我的”->“重置示例数据”后重试。"
      });
    }
  },

  loadLessons() {
    this.setData({
      lessons: repo.getLessons({ grade: this.data.currentGrade, limit: 50 })
    });
  },

  loadStudentsByGrade() {
    const students = repo.getStudents({ keyword: "", grade: this.data.currentGrade });
    const studentIndex = students.length ? Math.min(this.data.studentIndex, students.length - 1) : 0;
    this.setData({
      students,
      studentIndex,
      currentStudentName: students.length ? students[studentIndex].name : "暂无学生"
    });
  },

  toggleCreatePanel() {
    const next = !this.data.showCreatePanel;
    this.setData({ showCreatePanel: next });
    if (next) {
      this.loadStudentsByGrade();
    }
  },

  onGradeChange(e) {
    const gradeIndex = Number(e.detail.value);
    const grades = this.data.grades;
    this.setData({
      gradeIndex,
      currentGrade: grades[gradeIndex] || "高一"
    });
    this.loadStudentsByGrade();
    this.loadLessons();
  },

  onStudentChange(e) {
    const studentIndex = Number(e.detail.value);
    const students = this.data.students;
    this.setData({
      studentIndex,
      currentStudentName: students.length ? students[studentIndex].name : "暂无学生"
    });
  },

  onStatusChange(e) {
    this.setData({ lessonStatusIndex: Number(e.detail.value) });
  },

  onAttendanceChange(e) {
    const attendanceIndex = Number(e.detail.value);
    this.setData({
      attendanceIndex,
      attendance: ATTENDANCE_OPTIONS[attendanceIndex]
    });
  },

  onDateInput(e) {
    this.setData({ lessonDate: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onHomeworkInput(e) {
    this.setData({ homework: e.detail.value });
  },

  onSubjectInput(e) {
    this.setData({ subject: e.detail.value });
  },

  onTeacherInput(e) {
    this.setData({ teacher: e.detail.value });
  },

  onDurationInput(e) {
    this.setData({ duration: e.detail.value });
  },

  onCommentInput(e) {
    this.setData({ comment: e.detail.value });
  },

  saveLesson() {
    if (!this.data.students.length) {
      wx.showToast({ title: "当前年级暂无学生", icon: "none" });
      return;
    }

    const student = this.data.students[this.data.studentIndex];

    repo.saveLesson({
      classId: student.classId,
      lessonDate: this.data.lessonDate,
      subject: this.data.subject.trim() || "数学",
      teacher: this.data.teacher.trim(),
      duration: Number(this.data.duration || 120),
      status: LESSON_STATUS[this.data.lessonStatusIndex],
      content: this.data.content.trim(),
      homework: this.data.homework.trim(),
      records: [
        {
          studentId: student.id,
          attendance: this.data.attendance,
          comment: this.data.comment
        }
      ]
    });

    this.setData({
      showCreatePanel: false,
      content: "",
      homework: "",
      teacher: "",
      duration: "120",
      lessonStatusIndex: 0,
      attendanceIndex: 0,
      attendance: "出勤",
      comment: ""
    });

    this.loadLessons();
    wx.showToast({ title: "课程已保存", icon: "success" });
  }
});
