const db = require("../../utils/repository");

Page({
  data: {
    stats: {
      totalStudents: 0,
      totalLessons: 0,
      weeklyExams: 0,
      weaknessAlerts: 0,
      pendingRecords: 0
    },
    latestLesson: null
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({
      stats: db.getDashboardStats(),
      latestLesson: db.getLatestLessonSummary()
    });
  }
});
