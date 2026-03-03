const db = require("../../utils/repository");

Page({
  data: {
    keyword: "",
    students: [],
    classes: [],
    classIndex: 0,
    currentClassName: "请选择班级",
    canAddStudent: true,
    importText: "",
    form: {
      name: "",
      phone: "",
      guardian: ""
    }
  },

  onShow() {
    const app = getApp();
    this.setData({
      canAddStudent: app.globalData.role === "ADMIN"
    });
    this.refresh();
  },

  refresh() {
    const classes = db.getClasses();
    const students = db.getStudents(this.data.keyword);
    const classIndex = classes.length ? Math.min(this.data.classIndex, classes.length - 1) : 0;
    this.setData({
      classes,
      students,
      classIndex,
      currentClassName: classes.length ? classes[classIndex].name : "暂无班级"
    });
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
    this.refresh();
  },

  onFormInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      ["form." + key]: e.detail.value
    });
  },

  onImportTextInput(e) {
    this.setData({ importText: e.detail.value });
  },

  onClassChange(e) {
    const classIndex = Number(e.detail.value);
    const classes = this.data.classes;
    this.setData({
      classIndex,
      currentClassName: classes.length ? classes[classIndex].name : "暂无班级"
    });
  },

  addStudent() {
    const form = this.data.form;
    const classes = this.data.classes;

    if (!form.name.trim()) {
      wx.showToast({ title: "请输入学生姓名", icon: "none" });
      return;
    }

    if (!classes.length) {
      wx.showToast({ title: "请先配置班级", icon: "none" });
      return;
    }

    db.addStudent({
      name: form.name.trim(),
      classId: classes[this.data.classIndex].id,
      phone: form.phone.trim(),
      guardian: form.guardian.trim()
    });

    this.setData({
      form: { name: "", phone: "", guardian: "" }
    });

    this.refresh();
    wx.showToast({ title: "新增成功", icon: "success" });
  },

  importStudentsByCSV() {
    const text = String(this.data.importText || "").trim();
    if (!text) {
      wx.showToast({ title: "请先粘贴CSV内容", icon: "none" });
      return;
    }

    const classes = this.data.classes;
    if (!classes.length) {
      wx.showToast({ title: "暂无班级，无法导入", icon: "none" });
      return;
    }

    const classByName = {};
    classes.forEach((c) => {
      classByName[c.name] = c.id;
    });

    const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const items = [];

    lines.forEach((line) => {
      const cols = line.split(",").map((x) => x.trim());
      if (!cols.length || !cols[0]) {
        return;
      }
      const classId = classByName[cols[1]] || classes[this.data.classIndex].id;
      items.push({
        name: cols[0],
        classId,
        phone: cols[2] || "",
        guardian: cols[3] || ""
      });
    });

    const created = db.addStudentsBatch(items);
    this.setData({ importText: "" });
    this.refresh();

    wx.showToast({
      title: "导入 " + created.length + " 条",
      icon: "success"
    });
  },

  toStudentDetail(e) {
    const studentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/student-detail/student-detail?id=" + studentId
    });
  }
});
