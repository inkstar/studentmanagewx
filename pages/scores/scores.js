const db = require("../../utils/repository");

const MASTERY_LEVELS = ["优秀", "良好", "一般", "薄弱"];

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

Page({
  data: {
    students: [],
    tags: [],
    studentIndex: 0,
    tagIndex: 0,
    masteryIndex: 2,
    masteryOptions: MASTERY_LEVELS,
    currentStudentName: "暂无学生",
    currentTagName: "暂无标签",
    form: {
      examName: "阶段测验",
      examDate: today(),
      math: "",
      english: "",
      total: "",
      comment: ""
    },
    records: [],
    weaknessStats: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const students = db.getStudents("");
    const tags = db.getTags();
    const studentIndex = students.length ? Math.min(this.data.studentIndex, students.length - 1) : 0;
    const tagIndex = tags.length ? Math.min(this.data.tagIndex, tags.length - 1) : 0;
    this.setData({
      students,
      tags,
      studentIndex,
      tagIndex,
      currentStudentName: students.length ? students[studentIndex].name : "暂无学生",
      currentTagName: tags.length ? tags[tagIndex].name : "暂无标签",
      records: db.getExamRecords("").slice(0, 10),
      weaknessStats: db.getWeaknessStats().slice(0, 5)
    });
  },

  onStudentChange(e) {
    const studentIndex = Number(e.detail.value);
    const students = this.data.students;
    this.setData({
      studentIndex,
      currentStudentName: students.length ? students[studentIndex].name : "暂无学生"
    });
  },

  onTagChange(e) {
    const tagIndex = Number(e.detail.value);
    const tags = this.data.tags;
    this.setData({
      tagIndex,
      currentTagName: tags.length ? tags[tagIndex].name : "暂无标签"
    });
  },

  onMasteryChange(e) {
    this.setData({ masteryIndex: Number(e.detail.value) });
  },

  onFormInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      ["form." + key]: e.detail.value
    });
  },

  saveExam() {
    if (!this.data.students.length) {
      wx.showToast({ title: "请先新增学生", icon: "none" });
      return;
    }

    const f = this.data.form;
    if (!f.examName.trim()) {
      wx.showToast({ title: "请输入测验名称", icon: "none" });
      return;
    }

    if (!f.total.trim()) {
      wx.showToast({ title: "请输入总分", icon: "none" });
      return;
    }

    const student = this.data.students[this.data.studentIndex];
    const tag = this.data.tags[this.data.tagIndex];

    db.saveExam({
      studentId: student.id,
      examName: f.examName.trim(),
      examDate: f.examDate.trim() || today(),
      masteryLevel: MASTERY_LEVELS[this.data.masteryIndex],
      subjectScores: {
        math: Number(f.math || 0),
        english: Number(f.english || 0)
      },
      totalScore: Number(f.total || 0),
      comment: f.comment.trim(),
      weaknessTagId: tag ? tag.id : ""
    });

    this.setData({
      form: {
        examName: f.examName,
        examDate: today(),
        math: "",
        english: "",
        total: "",
        comment: ""
      },
      masteryIndex: 2
    });

    this.refresh();
    wx.showToast({ title: "进度已保存", icon: "success" });
  }
});
