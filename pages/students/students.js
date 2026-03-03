const repo = require("../../utils/repository");
const exporter = require("../../utils/exporter");

const STATUS_OPTIONS = ["全部", "在读", "重点关注", "待跟进"];

function topWeakTags(raw, student) {
  const fromProfile = Array.isArray(student.weakTopics) ? student.weakTopics.slice(0, 3) : [];
  if (fromProfile.length) {
    return fromProfile;
  }

  const tags = raw.tags || [];
  const tagMap = {};
  tags.forEach((t) => {
    tagMap[t.id] = t.name;
  });

  const cnt = {};
  (raw.weaknessLogs || []).forEach((w) => {
    if (w.studentId !== student.id) {
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

function inferStatus(student) {
  const weakCount = (student.weakTags || []).length;
  if (weakCount >= 3) {
    return "重点关注";
  }
  if (Number(student.lessonCount || 0) > 0) {
    return "在读";
  }
  return "待跟进";
}

function avatarOf(name) {
  const raw = String(name || "").trim();
  return raw ? raw.slice(0, 1) : "?";
}

function emptyForm() {
  return {
    name: "",
    homeroomTeacher: "",
    phone: "",
    parentPhone: "",
    email: "",
    address: "",
    notes: "",
    weakTopicsText: "",
    guardian: ""
  };
}

Page({
  data: {
    searchTerm: "",
    students: [],
    filteredStudents: [],

    grades: [],
    classTypes: [],

    canManage: true,

    filters: {
      grade: "全部",
      type: "全部",
      status: "全部"
    },
    tempFilters: {
      grade: "全部",
      type: "全部",
      status: "全部"
    },
    isFilterOpen: false,
    statusOptions: STATUS_OPTIONS,

    showCreatePanel: false,
    isEditMode: false,
    editingStudentId: "",

    gradeIndex: 0,
    classTypeIndex: 0,
    currentGrade: "高一",
    currentClassType: "1v1",

    importText: "",
    form: emptyForm()
  },

  onShow() {
    const app = getApp();
    this.setData({ canManage: app.globalData.role === "ADMIN" });
    this.refresh();
  },

  refresh() {
    const grades = repo.getGradeOptions();
    const classTypes = repo.getClassTypeOptions();
    const gradeIndex = Math.min(this.data.gradeIndex, Math.max(0, grades.length - 1));
    const classTypeIndex = Math.min(this.data.classTypeIndex, Math.max(0, classTypes.length - 1));

    const rawStudents = repo.getStudents({ keyword: "", grade: "" });
    const raw = repo.getRawDB();
    const students = rawStudents.map((s) => {
      const weakTags = topWeakTags(raw, s);
      const total = Number(s.lessonCount || 0) + Number(s.examCount || 0) + weakTags.length;
      const progressPercent = total ? Math.round(((Number(s.lessonCount || 0) + Number(s.examCount || 0)) / total) * 100) : 0;
      const status = inferStatus({ ...s, weakTags });
      return {
        ...s,
        weakTags,
        status,
        progressPercent,
        avatar: avatarOf(s.name)
      };
    });

    this.setData({
      grades,
      classTypes,
      gradeIndex,
      classTypeIndex,
      currentGrade: grades[gradeIndex] || "高一",
      currentClassType: classTypes[classTypeIndex] || "1v1",
      students
    });

    this.applyFilters();
  },

  applyFilters() {
    const search = String(this.data.searchTerm || "").trim().toLowerCase();
    const filters = this.data.filters;
    const filteredStudents = this.data.students.filter((s) => {
      const hitSearch =
        !search ||
        String(s.name || "").toLowerCase().indexOf(search) >= 0 ||
        String(s.homeroomTeacher || "").toLowerCase().indexOf(search) >= 0 ||
        String(s.phone || "").toLowerCase().indexOf(search) >= 0;
      const hitGrade = filters.grade === "全部" || s.grade === filters.grade;
      const hitType = filters.type === "全部" || s.classType === filters.type;
      const hitStatus = filters.status === "全部" || s.status === filters.status;
      return hitSearch && hitGrade && hitType && hitStatus;
    });
    this.setData({ filteredStudents });
  },

  onSearchInput(e) {
    this.setData({ searchTerm: e.detail.value });
    this.applyFilters();
  },

  openFilterPanel() {
    this.setData({
      isFilterOpen: true,
      tempFilters: { ...this.data.filters }
    });
  },

  closeFilterPanel() {
    this.setData({ isFilterOpen: false });
  },

  stopTap() {},

  setTempGrade(e) {
    this.setData({ "tempFilters.grade": e.currentTarget.dataset.value });
  },

  setTempType(e) {
    this.setData({ "tempFilters.type": e.currentTarget.dataset.value });
  },

  setTempStatus(e) {
    this.setData({ "tempFilters.status": e.currentTarget.dataset.value });
  },

  applyFilterPanel() {
    this.setData({
      filters: { ...this.data.tempFilters },
      isFilterOpen: false
    });
    this.applyFilters();
  },

  resetFilters() {
    const base = { grade: "全部", type: "全部", status: "全部" };
    this.setData({
      filters: base,
      tempFilters: base,
      isFilterOpen: false
    });
    this.applyFilters();
  },

  onGradeChange(e) {
    const gradeIndex = Number(e.detail.value);
    const grades = this.data.grades;
    this.setData({
      gradeIndex,
      currentGrade: grades[gradeIndex] || "高一"
    });
  },

  onClassTypeChange(e) {
    const classTypeIndex = Number(e.detail.value);
    const classTypes = this.data.classTypes;
    this.setData({
      classTypeIndex,
      currentClassType: classTypes[classTypeIndex] || "1v1"
    });
  },

  onFormInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ["form." + key]: e.detail.value });
  },

  onImportTextInput(e) {
    this.setData({ importText: e.detail.value });
  },

  startCreate() {
    this.setData({
      showCreatePanel: true,
      isEditMode: false,
      editingStudentId: "",
      form: emptyForm()
    });
  },

  toggleCreatePanel() {
    this.setData({
      showCreatePanel: !this.data.showCreatePanel,
      isEditMode: false,
      editingStudentId: "",
      form: emptyForm()
    });
  },

  buildPayloadFromForm() {
    const form = this.data.form;
    const weakTopics = String(form.weakTopicsText || "")
      .split(/[,，;；|]/)
      .map((x) => x.trim())
      .filter(Boolean);

    return {
      name: form.name.trim(),
      grade: this.data.grades[this.data.gradeIndex],
      classType: this.data.classTypes[this.data.classTypeIndex] || "1v1",
      homeroomTeacher: form.homeroomTeacher.trim(),
      phone: form.phone.trim(),
      parentPhone: form.parentPhone.trim(),
      guardian: form.guardian.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      weakTopics
    };
  },

  saveStudent() {
    const payload = this.buildPayloadFromForm();
    if (!payload.name) {
      wx.showToast({ title: "请输入学生姓名", icon: "none" });
      return;
    }

    if (this.data.isEditMode && this.data.editingStudentId) {
      repo.updateStudent(this.data.editingStudentId, payload);
      wx.showToast({ title: "已更新", icon: "success" });
    } else {
      repo.addStudent(payload);
      wx.showToast({ title: "新增成功", icon: "success" });
    }

    this.setData({
      showCreatePanel: false,
      isEditMode: false,
      editingStudentId: "",
      form: emptyForm()
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
    const classTypeIndex = Math.max(0, this.data.classTypes.indexOf(student.classType || "1v1"));

    this.setData({
      showCreatePanel: true,
      isEditMode: true,
      editingStudentId: id,
      gradeIndex,
      classTypeIndex,
      currentGrade: this.data.grades[gradeIndex] || "高一",
      currentClassType: this.data.classTypes[classTypeIndex] || "1v1",
      form: {
        name: student.name || "",
        homeroomTeacher: student.homeroomTeacher || "",
        phone: student.phone || "",
        parentPhone: student.parentPhone || "",
        email: student.email || "",
        address: student.address || "",
        notes: student.notes || "",
        weakTopicsText: (student.weakTopics || []).join(","),
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

    const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const items = [];
    let ignored = 0;

    lines.forEach((line) => {
      const cols = line.split(",").map((x) => x.trim());
      if (!cols.length || !cols[0]) {
        ignored += 1;
        return;
      }
      const grade = this.data.grades.indexOf(cols[1]) >= 0 ? cols[1] : this.data.currentGrade;
      const classType = this.data.classTypes.indexOf(cols[2]) >= 0 ? cols[2] : this.data.currentClassType;
      items.push({
        name: cols[0],
        grade,
        classType,
        homeroomTeacher: cols[3] || "",
        phone: cols[4] || "",
        parentPhone: cols[5] || "",
        guardian: cols[6] || "",
        weakTopics: String(cols[7] || "")
          .split(/[,，;；|]/)
          .map((x) => x.trim())
          .filter(Boolean)
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
      "张三,七年级,1v1,王老师,13800000000,13900000000,张妈妈,函数单调性|二次函数",
      "李四,高一,1v3,陈老师,13700000000,13600000000,李爸爸,三角函数|立体几何"
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
    wx.navigateTo({ url: "/pages/student-detail/student-detail?id=" + studentId });
  }
});
