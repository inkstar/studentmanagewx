const repo = require("../../utils/repository");

Page({
  data: {
    stats: {
      totalStudents: 0,
      totalLessons: 0,
      weeklyExams: 0,
      weaknessAlerts: 0,
      pendingRecords: 0,
      attendanceRate: 0
    },
    progressDistribution: {
      excellent: 0,
      good: 0,
      fair: 0,
      weak: 0
    },
    latestLesson: null
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const overview = repo.getDashboardOverview();
    this.setData({
      stats: overview.stats,
      progressDistribution: overview.progressDistribution,
      latestLesson: repo.getLatestLessonSummary()
    });
  }
});
