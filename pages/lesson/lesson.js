const repo = require("../../utils/repository");
const exporter = require("../../utils/exporter");
const lessonImageExporter = require("../../utils/lessonImageExporter");

const ATTENDANCE_OPTIONS = ["出勤", "迟到", "缺勤"];
const LESSON_STATUS = ["已完成", "已取消", "已改期"];
const SUBJECT_TABS = ["全部", "数学", "物理", "本周"];

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

function formatNow() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return "今天 " + hh + ":" + mm;
}

function clipText(text, maxLen) {
  const value = String(text || "").trim();
  if (!value) {
    return "";
  }
  return value.length > maxLen ? value.slice(0, maxLen) + "..." : value;
}

function firstChar(name) {
  const raw = String(name || "").trim();
  return raw ? raw.slice(0, 1) : "?";
}

function isThisWeek(dateString) {
  const d = new Date(String(dateString || "") + "T00:00:00");
  if (Number.isNaN(d.getTime())) {
    return false;
  }
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return d >= start && d < end;
}

Page({
  data: {
    fatalError: "",
    updatedAt: "",

    grades: [],
    gradeIndex: 0,
    currentGrade: "高一",

    students: [],
    studentIndex: 0,
    currentStudentName: "暂无学生",

    lessons: [],
    filteredLessons: [],
    lessonKeyword: "",
    subjectTabs: SUBJECT_TABS,
    subjectTabIndex: 0,
    activeSubject: "全部",

    showCreatePanel: false,
    isEditMode: false,
    editingLessonId: "",

    lessonDate: today(),
    startTime: "19:00",
    endTime: "21:00",
    subject: "数学",
    teacher: "",
    duration: "120",

    lessonStatusOptions: LESSON_STATUS,
    lessonStatusIndex: 0,

    attendanceOptions: ATTENDANCE_OPTIONS,
    attendanceIndex: 0,
    attendance: "出勤",

    content: "",
    studentPerformance: "",
    homework: "",
    topic: "",
    learnedTopics: "",
    weakTopicsText: "",
    notes: ""
  },

  onShow() {
    try {
      const grades = repo.getGradeOptions();
      const gradeIndex = grades.length ? Math.min(this.data.gradeIndex, grades.length - 1) : 0;
      const currentGrade = grades[gradeIndex] || "高一";

      this.setData({
        fatalError: "",
        updatedAt: formatNow(),
        grades,
        gradeIndex,
        currentGrade
      });
      this.refreshAll();
    } catch (err) {
      console.error("lesson onShow failed", err);
      this.setData({
        fatalError: "课程页面加载失败，请点击“我的”->“重置示例数据”后重试。"
      });
    }
  },

  refreshAll() {
    this.loadStudentsByGrade();
    this.loadLessons();
  },

  loadStudentsByGrade() {
    const students = repo.getStudents({ keyword: "", grade: this.data.currentGrade });
    const studentIndex = students.length ? Math.min(this.data.studentIndex, students.length - 1) : 0;
    this.setData({
      students,
      studentIndex,
      currentStudentName: students.length ? students[studentIndex].name : "暂无学生"
    });
  },

  loadLessons() {
    const lessons = repo.getLessons({ limit: 300 }).map((item) => ({
      ...item,
      studentAvatarLetter: firstChar(item.studentName),
      timeRange: item.startTime && item.endTime ? item.startTime + "-" + item.endTime : "时间未填",
      contentSummary: clipText(item.content, 42)
    }));
    this.setData({ lessons, updatedAt: formatNow() });
    this.applyLessonFilter();
  },

  applyLessonFilter() {
    const keyword = String(this.data.lessonKeyword || "").trim();
    const activeSubject = this.data.activeSubject;
    const filteredLessons = this.data.lessons.filter((item) => {
      const hitKeyword =
        !keyword ||
        String(item.studentName || "").indexOf(keyword) >= 0 ||
        String(item.subject || "").indexOf(keyword) >= 0 ||
        String(item.teacher || "").indexOf(keyword) >= 0 ||
        String(item.content || "").indexOf(keyword) >= 0;

      let hitSubject = true;
      if (activeSubject === "数学" || activeSubject === "物理") {
        hitSubject = String(item.subject || "") === activeSubject;
      } else if (activeSubject === "本周") {
        hitSubject = isThisWeek(item.lessonDate);
      }

      return hitKeyword && hitSubject;
    });
    this.setData({ filteredLessons });
  },

  onLessonKeywordInput(e) {
    this.setData({ lessonKeyword: e.detail.value });
    this.applyLessonFilter();
  },

  onSubjectTabTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    const activeSubject = SUBJECT_TABS[index] || "全部";
    this.setData({
      subjectTabIndex: index,
      activeSubject
    });
    this.applyLessonFilter();
  },

  resetForm() {
    this.setData({
      isEditMode: false,
      editingLessonId: "",
      lessonDate: today(),
      startTime: "19:00",
      endTime: "21:00",
      subject: "数学",
      teacher: "",
      duration: "120",
      lessonStatusIndex: 0,
      attendanceIndex: 0,
      attendance: "出勤",
      content: "",
      studentPerformance: "",
      homework: "",
      topic: "",
      learnedTopics: "",
      weakTopicsText: "",
      notes: ""
    });
  },

  toggleCreatePanel() {
    const showCreatePanel = !this.data.showCreatePanel;
    this.setData({ showCreatePanel });
    if (showCreatePanel) {
      this.loadStudentsByGrade();
      this.resetForm();
    }
  },

  startCreate() {
    this.setData({ showCreatePanel: true });
    this.loadStudentsByGrade();
    this.resetForm();
  },

  onGradeChange(e) {
    const gradeIndex = Number(e.detail.value);
    const grades = this.data.grades;
    this.setData({
      gradeIndex,
      currentGrade: grades[gradeIndex] || "高一"
    });
    this.refreshAll();
  },

  onStudentChange(e) {
    const studentIndex = Number(e.detail.value);
    const students = this.data.students;
    this.setData({
      studentIndex,
      currentStudentName: students.length ? students[studentIndex].name : "暂无学生"
    });
  },

  onStatusChange(e) {
    this.setData({ lessonStatusIndex: Number(e.detail.value) });
  },

  onAttendanceChange(e) {
    const attendanceIndex = Number(e.detail.value);
    this.setData({
      attendanceIndex,
      attendance: ATTENDANCE_OPTIONS[attendanceIndex] || "出勤"
    });
  },

  onDateInput(e) {
    this.setData({ lessonDate: e.detail.value });
  },

  onStartTimeInput(e) {
    this.setData({ startTime: e.detail.value });
  },

  onEndTimeInput(e) {
    this.setData({ endTime: e.detail.value });
  },

  onSubjectInput(e) {
    this.setData({ subject: e.detail.value });
  },

  onTeacherInput(e) {
    this.setData({ teacher: e.detail.value });
  },

  onDurationInput(e) {
    this.setData({ duration: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onPerformanceInput(e) {
    this.setData({ studentPerformance: e.detail.value });
  },

  onHomeworkInput(e) {
    this.setData({ homework: e.detail.value });
  },

  onTopicInput(e) {
    this.setData({ topic: e.detail.value });
  },

  onLearnedTopicsInput(e) {
    this.setData({ learnedTopics: e.detail.value });
  },

  onWeakTopicsInput(e) {
    this.setData({ weakTopicsText: e.detail.value });
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value });
  },

  buildLessonPayload() {
    const students = this.data.students;
    if (!students.length) {
      return null;
    }

    const student = students[this.data.studentIndex];
    const weakTopics = String(this.data.weakTopicsText || "")
      .split(/[,，;；|]/)
      .map((x) => x.trim())
      .filter(Boolean);

    return {
      classId: student.classId,
      lessonDate: this.data.lessonDate,
      startTime: this.data.startTime.trim(),
      endTime: this.data.endTime.trim(),
      subject: this.data.subject.trim() || "数学",
      teacher: this.data.teacher.trim(),
      duration: Number(this.data.duration || 120),
      status: LESSON_STATUS[this.data.lessonStatusIndex] || "已完成",
      content: this.data.content.trim(),
      studentPerformance: this.data.studentPerformance.trim(),
      homework: this.data.homework.trim(),
      topic: this.data.topic.trim(),
      learnedTopics: this.data.learnedTopics.trim(),
      weakTopics,
      notes: this.data.notes.trim(),
      records: [
        {
          studentId: student.id,
          attendance: this.data.attendance,
          comment: this.data.studentPerformance.trim()
        }
      ]
    };
  },

  saveLesson() {
    if (!this.data.students.length) {
      wx.showToast({ title: "当前年级暂无学生", icon: "none" });
      return;
    }

    const payload = this.buildLessonPayload();
    if (!payload || !payload.lessonDate) {
      wx.showToast({ title: "请填写日期", icon: "none" });
      return;
    }

    if (this.data.isEditMode && this.data.editingLessonId) {
      repo.updateLesson(this.data.editingLessonId, payload);
      wx.showToast({ title: "已更新记录", icon: "success" });
    } else {
      repo.saveLesson(payload);
      wx.showToast({ title: "课程已保存", icon: "success" });
    }

    this.setData({ showCreatePanel: false });
    this.resetForm();
    this.loadLessons();
  },

  startEdit(e) {
    const lessonId = e.currentTarget.dataset.id;
    const lesson = this.data.lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      return;
    }

    const gradeIndex = Math.max(0, this.data.grades.indexOf(lesson.grade || this.data.currentGrade));
    const currentGrade = this.data.grades[gradeIndex] || this.data.currentGrade;
    const students = repo.getStudents({ keyword: "", grade: currentGrade });
    const rawStudentIndex = students.findIndex((s) => s.id === lesson.studentId);
    const studentIndex = rawStudentIndex >= 0 ? rawStudentIndex : 0;

    this.setData({
      showCreatePanel: true,
      isEditMode: true,
      editingLessonId: lesson.id,
      gradeIndex,
      currentGrade,
      students,
      studentIndex,
      currentStudentName: students.length ? students[studentIndex].name : "暂无学生",
      lessonDate: lesson.lessonDate || today(),
      startTime: lesson.startTime || "19:00",
      endTime: lesson.endTime || "21:00",
      subject: lesson.subject || "数学",
      teacher: lesson.teacher || "",
      duration: String(lesson.duration || 120),
      lessonStatusIndex: Math.max(0, LESSON_STATUS.indexOf(lesson.status || "已完成")),
      attendanceIndex: Math.max(0, ATTENDANCE_OPTIONS.indexOf(lesson.attendance || "出勤")),
      attendance: lesson.attendance || "出勤",
      content: lesson.content || "",
      studentPerformance: lesson.studentPerformance || lesson.comment || "",
      homework: lesson.homework || "",
      topic: lesson.topic || "",
      learnedTopics: lesson.learnedTopics || "",
      weakTopicsText: Array.isArray(lesson.weakTopics) ? lesson.weakTopics.join(",") : "",
      notes: lesson.notes || ""
    });
  },

  copyLesson(e) {
    const lessonId = e.currentTarget.dataset.id;
    const lesson = this.data.lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      return;
    }

    const gradeIndex = Math.max(0, this.data.grades.indexOf(lesson.grade || this.data.currentGrade));
    const currentGrade = this.data.grades[gradeIndex] || this.data.currentGrade;
    const students = repo.getStudents({ keyword: "", grade: currentGrade });
    const rawStudentIndex = students.findIndex((s) => s.id === lesson.studentId);
    const studentIndex = rawStudentIndex >= 0 ? rawStudentIndex : 0;

    this.setData({
      showCreatePanel: true,
      isEditMode: false,
      editingLessonId: "",
      gradeIndex,
      currentGrade,
      students,
      studentIndex,
      currentStudentName: students.length ? students[studentIndex].name : "暂无学生",
      lessonDate: today(),
      startTime: lesson.startTime || "19:00",
      endTime: lesson.endTime || "21:00",
      subject: lesson.subject || "数学",
      teacher: lesson.teacher || "",
      duration: String(lesson.duration || 120),
      lessonStatusIndex: Math.max(0, LESSON_STATUS.indexOf(lesson.status || "已完成")),
      attendanceIndex: Math.max(0, ATTENDANCE_OPTIONS.indexOf(lesson.attendance || "出勤")),
      attendance: lesson.attendance || "出勤",
      content: lesson.content || "",
      studentPerformance: lesson.studentPerformance || lesson.comment || "",
      homework: lesson.homework || "",
      topic: lesson.topic || "",
      learnedTopics: lesson.learnedTopics || "",
      weakTopicsText: Array.isArray(lesson.weakTopics) ? lesson.weakTopics.join(",") : "",
      notes: lesson.notes || ""
    });
  },

  viewLesson(e) {
    const lessonId = e.currentTarget.dataset.id;
    const lesson = this.data.lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      return;
    }

    const lines = [
      "学生：" + (lesson.studentName || "-"),
      "日期：" + (lesson.lessonDate || "-") + " " + (lesson.timeRange || ""),
      "科目：" + (lesson.subject || "数学"),
      "老师：" + (lesson.teacher || "-"),
      "课程内容：" + (lesson.content || "无"),
      "学生情况：" + (lesson.studentPerformance || lesson.comment || "无"),
      "课后作业：" + (lesson.homework || "无")
    ];

    wx.showModal({
      title: "课程详情",
      content: lines.join("\n\n"),
      showCancel: false
    });
  },

  deleteLesson(e) {
    const lessonId = e.currentTarget.dataset.id;
    wx.showModal({
      title: "删除记录",
      content: "确认删除这条课程记录？",
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        const ok = repo.deleteLesson(lessonId);
        if (ok) {
          this.loadLessons();
          wx.showToast({ title: "已删除", icon: "success" });
        } else {
          wx.showToast({ title: "删除失败", icon: "none" });
        }
      }
    });
  },

  exportLessons() {
    wx.setClipboardData({
      data: exporter.exportLessonsCSV(),
      success: () => {
        wx.showToast({ title: "课程CSV已复制", icon: "success" });
      }
    });
  },

  exportLessonImage(e) {
    const lessonId = e.currentTarget.dataset.id;
    const lesson = this.data.lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      wx.showToast({ title: "未找到课程记录", icon: "none" });
      return;
    }
    lessonImageExporter
      .exportLessonImage(this, lesson, { canvasId: "lessonShareCanvas" })
      .catch((err) => {
        console.error("exportLessonImage failed", err);
        wx.showModal({
          title: "导出失败",
          content: "请升级基础库或点击清缓存后重试。",
          showCancel: false
        });
      });
  }
});
