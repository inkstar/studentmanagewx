const db = require("../../utils/db");

Page({
  data: {
    keyword: "",
    students: [],
    classes: [],
    classIndex: 0,
    currentClassName: "请选择班级",
    form: {
      name: "",
      phone: "",
      guardian: ""
    }
  },

  onShow() {
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

  toStudentDetail(e) {
    const studentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/student-detail/student-detail?id=" + studentId
    });
  }
});
