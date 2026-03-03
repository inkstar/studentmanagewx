function call(action, payload) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error("wx.cloud is not available"));
      return;
    }

    wx.cloud.callFunction({
      name: "studentManage",
      data: {
        action,
        payload: payload || {}
      },
      success: (res) => {
        resolve((res && res.result) || null);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

module.exports = {
  call
};
