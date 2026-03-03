const KEY = "student_manage_runtime_v1";

const DEFAULT_RUNTIME = {
  dataMode: "LOCAL",
  envId: "",
  role: "TEACHER",
  userName: "演示老师"
};

function getRuntime() {
  const raw = wx.getStorageSync(KEY);
  if (!raw || typeof raw !== "object") {
    wx.setStorageSync(KEY, DEFAULT_RUNTIME);
    return { ...DEFAULT_RUNTIME };
  }
  return {
    dataMode: raw.dataMode || DEFAULT_RUNTIME.dataMode,
    envId: raw.envId || "",
    role: raw.role || DEFAULT_RUNTIME.role,
    userName: raw.userName || DEFAULT_RUNTIME.userName
  };
}

function setRuntime(patch) {
  const current = getRuntime();
  const next = {
    ...current,
    ...patch
  };
  wx.setStorageSync(KEY, next);
  return next;
}

function setRole(role) {
  return setRuntime({ role });
}

function setMode(dataMode) {
  return setRuntime({ dataMode });
}

function setEnvId(envId) {
  return setRuntime({ envId: (envId || "").trim() });
}

module.exports = {
  getRuntime,
  setRuntime,
  setRole,
  setMode,
  setEnvId,
  DEFAULT_RUNTIME
};
