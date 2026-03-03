const repo = require("./utils/repository");
const runtime = require("./utils/runtime");

App({
  globalData: {
    version: "0.3.0",
    role: "TEACHER",
    dataMode: "LOCAL",
    userName: "演示老师"
  },

  onLaunch() {
    const rt = runtime.getRuntime();
    this.globalData.role = rt.role;
    this.globalData.dataMode = rt.dataMode;
    this.globalData.userName = rt.userName;

    try {
      if (rt.dataMode === "CLOUD" && wx.cloud) {
        wx.cloud.init({
          env: rt.envId || undefined,
          traceUser: true
        });
      }
      repo.getClasses();
    } catch (err) {
      console.error("app bootstrap failed", err);
    }

    console.log("学生管理小程序启动", this.globalData);
  }
});
