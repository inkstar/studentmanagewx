const repo = require("../../utils/repository");
const exporter = require("../../utils/exporter");

function topWeakTags(raw, studentId) {
  const tags = raw.tags || [];
  const tagMap = {};
  tags.forEach((t) => {
    tagMap[t.id] = t.name;
  });

  const cnt = {};
  (raw.weaknessLogs || []).forEach((w) => {
    if (w.studentId !== studentId) {
      return;
    }
    cnt[w.tagId] = (cnt[w.tagId] || 0) + 1;
  });

  return Object.keys(cnt)
    .map((tagId) => ({
      name: tagMap[tagId] || "未知标签",
      count: cnt[tagId]
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((x) => x.name);
}

Page({
  data: {
    keyword: "",
    students: [],
    grades: [],
    gradeFilterOptions: ["全部"],
    filterGradeIndex: 0,
    gradeIndex: 0,
    currentGrade: "高一",
    canManage: true,
    showCreatePanel: false,
    isEditMode: false,
    editingStudentId: "",
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
      canManage: app.globalData.role === "ADMIN"
    });
    this.refresh();
  },

  refresh() {
    const grades = repo.getGradeOptions();
    const gradeFilterOptions = ["全部"].concat(grades);
    const filterGradeIndex = Math.min(this.data.filterGradeIndex, gradeFilterOptions.length - 1);
    const gradeIndex = Math.min(this.data.gradeIndex, Math.max(0, grades.length - 1));
    const selectedGrade = gradeFilterOptions[filterGradeIndex];

    const rawStudents = repo.getStudents({
      keyword: this.data.keyword,
      grade: selectedGrade === "全部" ? "" : selectedGrade
    });
    const raw = repo.getRawDB();
    const students = rawStudents.map((s) => ({
      ...s,
      weakTags: topWeakTags(raw, s.id)
    }));

    this.setData({
      grades,
      gradeFilterOptions,
      filterGradeIndex,
      gradeIndex,
      currentGrade: grades[gradeIndex] || "高一",
      students
    });
  },

  toggleCreatePanel() {
    this.setData({
      showCreatePanel: !this.data.showCreatePanel,
      isEditMode: false,
      editingStudentId: "",
      form: { name: "", phone: "", guardian: "" }
    });
  },

  startCreate() {
    this.setData({
      showCreatePanel: true,
      isEditMode: false,
      editingStudentId: "",
      form: { name: "", phone: "", guardian: "" }
    });
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
    this.refresh();
  },

  onFilterGradeChange(e) {
    this.setData({ filterGradeIndex: Number(e.detail.value) });
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

  onGradeChange(e) {
    const gradeIndex = Number(e.detail.value);
    const grades = this.data.grades;
    this.setData({
      gradeIndex,
      currentGrade: grades[gradeIndex] || "高一"
    });
  },

  saveStudent() {
    const form = this.data.form;
    const grades = this.data.grades;

    if (!form.name.trim()) {
      wx.showToast({ title: "请输入学生姓名", icon: "none" });
      return;
    }

    if (!grades.length) {
      wx.showToast({ title: "年级配置为空", icon: "none" });
      return;
    }

    const payload = {
      name: form.name.trim(),
      grade: grades[this.data.gradeIndex],
      phone: form.phone.trim(),
      guardian: form.guardian.trim()
    };

    if (this.data.isEditMode && this.data.editingStudentId) {
      repo.updateStudent(this.data.editingStudentId, payload);
      wx.showToast({ title: "已更新", icon: "success" });
    } else {
      repo.addStudent(payload);
      wx.showToast({ title: "新增成功", icon: "success" });
    }

    this.setData({
      form: { name: "", phone: "", guardian: "" },
      isEditMode: false,
      editingStudentId: "",
      showCreatePanel: false
    });

    this.refresh();
  },

  startEdit(e) {
    const id = e.currentTarget.dataset.id;
    const student = this.data.students.find((s) => s.id === id);
    if (!student) {
      return;
    }

    const gradeIndex = Math.max(0, this.data.grades.indexOf(student.grade));
    this.setData({
      showCreatePanel: true,
      isEditMode: true,
      editingStudentId: id,
      gradeIndex,
      currentGrade: this.data.grades[gradeIndex] || "高一",
      form: {
        name: student.name || "",
        phone: student.phone || "",
        guardian: student.guardian || ""
      }
    });
  },

  deleteStudent(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name || "该学生";

    wx.showModal({
      title: "删除学生",
      content: "确认删除「" + name + "」？其课程和进度记录也会一并删除。",
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        const ok = repo.deleteStudent(id);
        if (ok) {
          this.refresh();
          wx.showToast({ title: "已删除", icon: "success" });
        } else {
          wx.showToast({ title: "删除失败", icon: "none" });
        }
      }
    });
  },

  importStudentsByCSV() {
    const text = String(this.data.importText || "").trim();
    if (!text) {
      wx.showToast({ title: "请先粘贴CSV内容", icon: "none" });
      return;
    }

    const grades = this.data.grades;
    if (!grades.length) {
      wx.showToast({ title: "年级配置为空", icon: "none" });
      return;
    }

    const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const items = [];
    let ignored = 0;

    lines.forEach((line) => {
      const cols = line.split(",").map((x) => x.trim());
      if (!cols.length || !cols[0]) {
        ignored += 1;
        return;
      }
      const grade = grades.indexOf(cols[1]) >= 0 ? cols[1] : grades[this.data.gradeIndex];
      items.push({
        name: cols[0],
        grade,
        phone: cols[2] || "",
        guardian: cols[3] || ""
      });
    });

    const created = repo.addStudentsBatch(items);
    this.setData({ importText: "" });
    this.refresh();

    wx.showModal({
      title: "导入完成",
      content: "成功 " + created.length + " 条，忽略 " + ignored + " 条。",
      showCancel: false
    });
  },

  exportStudents() {
    wx.setClipboardData({
      data: exporter.exportStudentsCSV(),
      success: () => {
        wx.showToast({ title: "学生CSV已复制", icon: "success" });
      }
    });
  },

  copyImportTemplate() {
    const sample = [
      "张三,七年级,13800000000,张妈妈",
      "李四,高一,13900000000,李爸爸"
    ].join("\n");
    wx.setClipboardData({
      data: sample,
      success: () => {
        wx.showToast({ title: "模板已复制", icon: "success" });
      }
    });
  },

  toStudentDetail(e) {
    const studentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/student-detail/student-detail?id=" + studentId
    });
  }
});
