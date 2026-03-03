const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  switch (action) {
    case "health":
      return {
        ok: true,
        message: "studentManage cloud function is ready"
      };
    case "getClasses":
      return {
        ok: false,
        message: "getClasses is not implemented yet",
        payload
      };
    case "getStudents":
      return {
        ok: false,
        message: "getStudents is not implemented yet",
        payload
      };
    default:
      return {
        ok: false,
        message: "unknown action",
        action
      };
  }
};
