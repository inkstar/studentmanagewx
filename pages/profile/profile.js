const repo = require("../../utils/repository");
const runtime = require("../../utils/runtime");
const cloudClient = require("../../utils/cloudClient");
const exporter = require("../../utils/exporter");

const ROLE_OPTIONS = ["TEACHER", "ADMIN"];
const MODE_OPTIONS = ["LOCAL", "CLOUD"];

function indexOfOrZero(arr, v) {
  const idx = arr.indexOf(v);
  return idx >= 0 ? idx : 0;
}

Page({
  data: {
    version: "",
    stats: null,
    cloudStatus: "未检测",
    runtime: {
      role: "TEACHER",
      dataMode: "LOCAL",
      envId: "",
      userName: "演示老师"
    },
    roleOptions: ROLE_OPTIONS,
    roleIndex: 0,
    modeOptions: MODE_OPTIONS,
    modeIndex: 0
  },

  onShow() {
    const app = getApp();
    const rt = runtime.getRuntime();
    this.setData({
      version: app.globalData.version,
      stats: repo.getDashboardStats(),
      runtime: rt,
      roleIndex: indexOfOrZero(ROLE_OPTIONS, rt.role),
      modeIndex: indexOfOrZero(MODE_OPTIONS, rt.dataMode)
    });
  },

  onRoleChange(e) {
    const roleIndex = Number(e.detail.value);
    const role = ROLE_OPTIONS[roleIndex];
    const rt = runtime.setRole(role);
    const app = getApp();
    app.globalData.role = role;
    this.setData({ runtime: rt, roleIndex });
    wx.showToast({ title: "角色已切换", icon: "success" });
  },

  onModeChange(e) {
    const modeIndex = Number(e.detail.value);
    const dataMode = MODE_OPTIONS[modeIndex];
    const rt = runtime.setMode(dataMode);
    const app = getApp();
    app.globalData.dataMode = dataMode;
    this.setData({ runtime: rt, modeIndex });
    wx.showToast({ title: "模式已切换", icon: "success" });
  },

  onEnvIdInput(e) {
    const envId = e.detail.value;
    this.setData({ "runtime.envId": envId });
  },

  saveEnvId() {
    const rt = runtime.setEnvId(this.data.runtime.envId || "");
    this.setData({ runtime: rt });
    wx.showToast({ title: "环境ID已保存", icon: "success" });
  },

  async checkCloudHealth() {
    try {
      const res = await cloudClient.call("health", {});
      const ok = res && res.ok;
      this.setData({
        cloudStatus: ok ? "健康" : "异常"
      });
      wx.showToast({
        title: ok ? "云函数可用" : "云函数异常",
        icon: ok ? "success" : "none"
      });
    } catch (err) {
      this.setData({ cloudStatus: "不可用" });
      wx.showToast({ title: "云函数调用失败", icon: "none" });
    }
  },

  resetDemo() {
    wx.showModal({
      title: "重置示例数据",
      content: "将清空当前录入并恢复内置示例，是否继续？",
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        repo.resetDB();
        this.setData({ stats: repo.getDashboardStats() });
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
