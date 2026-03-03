const db = require("../../utils/db");

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
  }
});
