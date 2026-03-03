const db = require("./utils/db");

App({
  globalData: {
    version: "0.2.0",
    role: "TEACHER"
  },
  onLaunch() {
    db.getClasses();
    console.log("学生管理小程序启动");
  }
});
