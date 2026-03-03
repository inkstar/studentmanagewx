const repo = require("../../utils/repository");

function formatNow() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return y + "-" + m + "-" + d + " " + hh + ":" + mm;
}

Page({
  data: {
    updatedAt: "",
    stats: {
      totalStudents: 0,
      totalLessons: 0,
      weeklyExams: 0,
      weaknessAlerts: 0,
      pendingRecords: 0,
      attendanceRate: 0
    },
    attendanceRate: 0,
    completedLessons: 0,
    thisMonthLessons: 0,
    distribution: [],
    latestLesson: null
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const overview = repo.getDashboardOverview();
    const stats = overview.stats || {};
    const progress = overview.progressDistribution || {};
    const latestLesson = repo.getLatestLessonSummary();

    const allLessons = repo.getLessons({ limit: 500 });
    const monthPrefix = formatNow().slice(0, 7);
    const thisMonthLessons = allLessons.filter((l) => String(l.lessonDate || "").slice(0, 7) === monthPrefix).length;

    const completedLessons = Math.max(0, Number(stats.totalLessons || 0) - Number(stats.pendingRecords || 0));
    const attendanceRate = Number(stats.attendanceRate || 0);
    const totalStudents = Number(stats.totalStudents || 0);

    const distribution = [
      { name: "优秀", count: Number(progress.excellent || 0), color: "#6366f1" },
      { name: "良好", count: Number(progress.good || 0), color: "#3b82f6" },
      { name: "一般", count: Number(progress.fair || 0), color: "#f59e0b" },
      { name: "薄弱", count: Number(progress.weak || 0), color: "#f43f5e" }
    ].map((item) => ({
      ...item,
      percent: totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0
    }));

    this.setData({
      updatedAt: formatNow(),
      stats,
      attendanceRate,
      completedLessons,
      thisMonthLessons,
      distribution,
      latestLesson
    });
  },

  goStudents() {
    wx.switchTab({ url: "/pages/students/students" });
  },

  goLessons() {
    wx.switchTab({ url: "/pages/lesson/lesson" });
  },

  goScores() {
    wx.switchTab({ url: "/pages/scores/scores" });
  }
});
