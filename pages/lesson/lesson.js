const db = require("../../utils/repository");

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
    classes: [],
    classIndex: 0,
    currentClassName: "暂无班级",
    lessonDate: today(),
    subject: "数学",
    teacher: "",
    duration: "120",
    lessonStatusOptions: LESSON_STATUS,
    lessonStatusIndex: 0,
    content: "",
    homework: "",
    students: [],
    attendanceOptions: ATTENDANCE_OPTIONS,
    records: []
  },

  onShow() {
    try {
      const classes = db.getClasses();
      const classIndex = classes.length ? Math.min(this.data.classIndex, classes.length - 1) : 0;
      this.setData({
        fatalError: "",
        classes,
        classIndex,
        currentClassName: classes.length ? classes[classIndex].name : "暂无班级"
      });
      this.loadStudentsByClass();
    } catch (err) {
      console.error("lesson onShow failed", err);
      this.setData({
        fatalError: "课程页面加载失败，请点击“我的”->“重置示例数据”后重试。"
      });
    }
  },

  loadStudentsByClass() {
    const classes = this.data.classes;
    if (!classes.length) {
      this.setData({ students: [], records: [] });
      return;
    }

    const classId = classes[this.data.classIndex].id;
    const students = db.getStudents("").filter((s) => s.classId === classId);
    const records = students.map((s) => ({
      studentId: s.id,
      attendance: "出勤",
      attendanceIndex: 0,
      comment: ""
    }));
    this.setData({ students, records });
  },

  onClassChange(e) {
    const classIndex = Number(e.detail.value);
    const classes = this.data.classes;
    this.setData({
      classIndex,
      currentClassName: classes.length ? classes[classIndex].name : "暂无班级"
    });
    this.loadStudentsByClass();
  },

  onStatusChange(e) {
    this.setData({ lessonStatusIndex: Number(e.detail.value) });
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

  onAttendanceChange(e) {
    const idx = Number(e.currentTarget.dataset.index);
    const optionIndex = Number(e.detail.value);
    const records = this.data.records.slice();
    records[idx].attendance = ATTENDANCE_OPTIONS[optionIndex];
    records[idx].attendanceIndex = optionIndex;
    this.setData({ records });
  },

  onCommentInput(e) {
    const idx = Number(e.currentTarget.dataset.index);
    const records = this.data.records.slice();
    records[idx].comment = e.detail.value;
    this.setData({ records });
  },

  saveLesson() {
    const classes = this.data.classes;
    if (!classes.length) {
      wx.showToast({ title: "暂无班级数据", icon: "none" });
      return;
    }

    if (!this.data.records.length) {
      wx.showToast({ title: "当前班级暂无学生", icon: "none" });
      return;
    }

    db.saveLesson({
      classId: classes[this.data.classIndex].id,
      lessonDate: this.data.lessonDate,
      subject: this.data.subject.trim() || "数学",
      teacher: this.data.teacher.trim(),
      duration: Number(this.data.duration || 120),
      status: LESSON_STATUS[this.data.lessonStatusIndex],
      content: this.data.content.trim(),
      homework: this.data.homework.trim(),
      records: this.data.records.map((r) => ({
        studentId: r.studentId,
        attendance: r.attendance,
        comment: r.comment
      }))
    });

    wx.showToast({ title: "课程已保存", icon: "success" });
  }
});
