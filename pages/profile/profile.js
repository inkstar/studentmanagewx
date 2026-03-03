const db = require("../../utils/db");
const exporter = require("../../utils/exporter");

Page({
  data: {
    version: "",
    stats: null
  },

  onShow() {
    const app = getApp();
    this.setData({
      version: app.globalData.version,
      stats: db.getDashboardStats()
    });
  },

  resetDemo() {
    wx.showModal({
      title: "重置示例数据",
      content: "将清空当前录入并恢复内置示例，是否继续？",
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        db.resetDB();
        this.setData({ stats: db.getDashboardStats() });
        wx.showToast({ title: "已重置", icon: "success" });
      }
    });
  },

  copyCSV(content, label) {
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: label + "已复制", icon: "success" });
      }
    });
  },

  exportStudents() {
    this.copyCSV(exporter.exportStudentsCSV(), "学生CSV");
  },

  exportLessons() {
    this.copyCSV(exporter.exportLessonsCSV(), "课堂CSV");
  },

  exportExams() {
    this.copyCSV(exporter.exportExamsCSV(), "成绩CSV");
  }
});
