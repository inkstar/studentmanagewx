const db = require("./utils/db");

App({
  globalData: {
    version: "0.2.0",
    role: "TEACHER"
  },
  onLaunch() {
    try {
      db.getClasses();
    } catch (err) {
      console.error("db bootstrap failed", err);
    }
    console.log("学生管理小程序启动");
  }
});
