const db = require("../../utils/repository");

Page({
  data: {
    studentId: "",
    student: null,
    tags: [],
    tagIndex: 0,
    currentTagName: "暂无标签",
    weaknessNote: "",
    weaknessLogs: [],
    examRecords: [],
    lessonRecords: []
  },

  onLoad(options) {
    this.setData({ studentId: options.id || "" });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const studentId = this.data.studentId;
    const tags = db.getTags();
    const tagIndex = tags.length ? Math.min(this.data.tagIndex, tags.length - 1) : 0;
    this.setData({
      student: db.getStudentById(studentId),
      tags,
      tagIndex,
      currentTagName: tags.length ? tags[tagIndex].name : "暂无标签",
      weaknessLogs: db.getWeaknessLogsByStudent(studentId),
      examRecords: db.getExamRecords(studentId),
      lessonRecords: db.getLessonsByStudent(studentId)
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

  onWeaknessNoteInput(e) {
    this.setData({ weaknessNote: e.detail.value });
  },

  addWeakness() {
    if (!this.data.tags.length) {
      wx.showToast({ title: "请先配置标签", icon: "none" });
      return;
    }
    const tag = this.data.tags[this.data.tagIndex];
    db.addWeaknessLog({
      studentId: this.data.studentId,
      tagId: tag.id,
      note: this.data.weaknessNote.trim(),
      sourceType: "MANUAL"
    });
    this.setData({ weaknessNote: "" });
    this.refresh();
    wx.showToast({ title: "已记录", icon: "success" });
  }
});
