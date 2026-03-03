const repo = require("../../utils/repository");
const exporter = require("../../utils/exporter");

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

function formatDateCN(dateText) {
  const s = String(dateText || "").trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return s || "-";
  }
  return match[1] + "年" + match[2] + "月" + match[3] + "日";
}

function statusStyle(status) {
  const s = String(status || "");
  if (s === "已取消") {
    return { bg: "#f8d7da", color: "#721c24", text: "已取消" };
  }
  if (s === "已改期") {
    return { bg: "#fff3cd", color: "#856404", text: "已改期" };
  }
  return { bg: "#d4edda", color: "#155724", text: "已完成" };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawRoundedBlock(ctx, x, y, w, h, r, fill, stroke, lineWidth) {
  roundRectPath(ctx, x, y, w, h, r);
  if (fill) {
    applyFillStyle(ctx, fill);
    ctx.fill();
  }
  if (stroke) {
    applyLineWidth(ctx, lineWidth || 1);
    applyStrokeStyle(ctx, stroke);
    ctx.stroke();
  }
}

function applyFillStyle(ctx, color) {
  if ("fillStyle" in ctx) {
    ctx.fillStyle = color;
    return;
  }
  if (typeof ctx.setFillStyle === "function") {
    ctx.setFillStyle(color);
  }
}

function applyStrokeStyle(ctx, color) {
  if ("strokeStyle" in ctx) {
    ctx.strokeStyle = color;
    return;
  }
  if (typeof ctx.setStrokeStyle === "function") {
    ctx.setStrokeStyle(color);
  }
}

function applyLineWidth(ctx, width) {
  if ("lineWidth" in ctx) {
    ctx.lineWidth = width;
    return;
  }
  if (typeof ctx.setLineWidth === "function") {
    ctx.setLineWidth(width);
  }
}

function applyFontSize(ctx, size, weight) {
  if ("font" in ctx) {
    const fontWeight = weight || 400;
    ctx.font =
      fontWeight +
      " " +
      size +
      "px -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif";
    return;
  }
  if (typeof ctx.setFontSize === "function") {
    ctx.setFontSize(size);
  }
}

function wrapTextLines(ctx, text, maxWidth) {
  const value = String(text || "");
  if (!value) {
    return [""];
  }
  const lines = [];
  const paragraphList = value.split(/\n/);
  paragraphList.forEach((paragraph) => {
    if (!paragraph) {
      lines.push("");
      return;
    }
    let line = "";
    for (let i = 0; i < paragraph.length; i += 1) {
      const ch = paragraph[i];
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    lines.push(line);
  });
  return lines.length ? lines : [""];
}

function drawParagraph(ctx, opts) {
  const lines = wrapTextLines(ctx, opts.text, opts.maxWidth);
  const maxLines = opts.maxLines || 999;
  let used = 0;
  for (let i = 0; i < lines.length && used < maxLines; i += 1) {
    let line = lines[i];
    const isLastVisible = used === maxLines - 1 && i < lines.length - 1;
    if (isLastVisible) {
      while (ctx.measureText(line + "...").width > opts.maxWidth && line.length > 0) {
        line = line.slice(0, -1);
      }
      line += "...";
    }
    ctx.fillText(line, opts.x, opts.y + used * opts.lineHeight);
    used += 1;
  }
  return used * opts.lineHeight;
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

  prepareExportCanvas(logicalWidth, logicalHeight) {
    if (
      this._exportCanvas &&
      this._exportCanvas.ctx &&
      this._exportCanvas.canvas &&
      this._exportCanvas.logicalWidth === logicalWidth &&
      this._exportCanvas.logicalHeight === logicalHeight
    ) {
      const cached = this._exportCanvas;
      cached.ctx.setTransform(cached.dpr, 0, 0, cached.dpr, 0, 0);
      cached.ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery().in(this);
      query
        .select("#lessonShareCanvas")
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0];
          if (!item || !item.node) {
            reject(new Error("2d canvas node not found"));
            return;
          }

          const canvas = item.node;
          const ctx = canvas.getContext("2d");
          const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
          const dpr = Number(info.pixelRatio || 1);

          canvas.width = logicalWidth * dpr;
          canvas.height = logicalHeight * dpr;

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, logicalWidth, logicalHeight);

          const result = {
            canvas,
            ctx,
            dpr,
            logicalWidth,
            logicalHeight
          };
          this._exportCanvas = result;
          resolve(result);
        });
    });
  },

  exportLessonImage(e) {
    const lessonId = e.currentTarget.dataset.id;
    const lesson = this.data.lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      wx.showToast({ title: "未找到课程记录", icon: "none" });
      return;
    }

    const width = 720;
    const height = 1420;
    const pageX = 22;
    const pageY = 22;
    const pageW = width - pageX * 2;
    const pageH = height - pageY * 2;
    const headerH = 166;
    const contentX = pageX + 24;
    const contentY = pageY + headerH - 22;
    const contentW = pageW - 48;
    const teacherText = String(lesson.teacher || lesson.teacherName || lesson.instructor || "").trim() || "未填写";
    const contentText = String(lesson.content || lesson.topic || lesson.learnedTopics || "").trim();
    const performanceText = String(lesson.studentPerformance || lesson.comment || lesson.notes || "").trim();
    const homeworkText = String(lesson.homework || "").trim();

    const infoRows = [
      ["学生姓名", lesson.studentName || "-"],
      ["课程日期", formatDateCN(lesson.lessonDate)],
      ["上课时间", (lesson.startTime || "--:--") + " - " + (lesson.endTime || "--:--")],
      ["科目", lesson.subject || "数学"],
      ["课程时长", String(lesson.duration || 120) + "分钟"],
      ["授课老师", teacherText]
    ];
    const now = new Date();
    const ts =
      now.getFullYear() +
      "年" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "月" +
      String(now.getDate()).padStart(2, "0") +
      "日 " +
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    wx.showLoading({ title: "生成中..." });
    this.prepareExportCanvas(width, height)
      .then(({ canvas, ctx }) => {
        applyFillStyle(ctx, "#f8fafc");
        ctx.fillRect(0, 0, width, height);

        drawRoundedBlock(ctx, pageX, pageY, pageW, pageH, 30, "#ffffff", "#edf2f7", 1);

        const headGrad = ctx.createLinearGradient(pageX, pageY, pageX + pageW, pageY + headerH);
        headGrad.addColorStop(0, "#ff8a4a");
        headGrad.addColorStop(1, "#ff7a38");
        drawRoundedBlock(ctx, pageX, pageY, pageW, headerH, 28, headGrad, null, 0);

        applyFillStyle(ctx, "#ffffff");
        applyFontSize(ctx, 56, 700);
        ctx.fillText("课程记录与反馈", pageX + 28, pageY + 76);
        applyFontSize(ctx, 42, 400);
        applyFillStyle(ctx, "rgba(255,255,255,0.92)");
        ctx.fillText("Lesson Record & Feedback", pageX + 28, pageY + 118);

        const infoTop = contentY;
        const boxGap = 14;
        const boxW = (contentW - boxGap) / 2;
        const boxH = 96;

        infoRows.forEach((row, idx) => {
          const col = idx % 2;
          const r = Math.floor(idx / 2);
          const x = contentX + col * (boxW + boxGap);
          const y = infoTop + r * (boxH + boxGap);
          drawRoundedBlock(ctx, x, y, boxW, boxH, 16, "#ffffff", "#f1f5f9", 1);
          drawRoundedBlock(ctx, x, y + 16, 6, boxH - 32, 3, "#ff7a38", null, 0);
          applyFillStyle(ctx, "#9ca3af");
          applyFontSize(ctx, 20, 400);
          ctx.fillText(row[0], x + 16, y + 30);
          applyFillStyle(ctx, "#1f2937");
          applyFontSize(ctx, 24, 700);
          drawParagraph(ctx, {
            text: row[1],
            x: x + 16,
            y: y + 66,
            maxWidth: boxW - 26,
            lineHeight: 30,
            maxLines: 1
          });
        });

        const drawSection = (y, title, text, lineCap) => {
          const plainText = String(text || "").trim();
          const safeText = plainText || "暂无内容（请先完善课程记录）";
          const isEmpty = !plainText;

          applyFillStyle(ctx, "#ff7a38");
          applyFontSize(ctx, 34, 700);
          ctx.fillText("|", contentX, y + 24);
          applyFillStyle(ctx, "#ff7a38");
          applyFontSize(ctx, 30, 700);
          ctx.fillText(title, contentX + 20, y + 24);

          const boxY = y + 38;
          applyFontSize(ctx, 22, 400);
          const lines = wrapTextLines(ctx, safeText, contentW - 32);
          const wantedLines = Math.min(lineCap || 8, Math.max(2, lines.length));
          const boxHLocal = isEmpty ? 110 : Math.min(230, 44 + wantedLines * 30);
          drawRoundedBlock(ctx, contentX, boxY, contentW, boxHLocal, 18, "#fcfcfc", "#f3f4f6", 2);

          applyFillStyle(ctx, "#4b5563");
          applyFontSize(ctx, 22, 400);
          drawParagraph(ctx, {
            text: safeText,
            x: contentX + 16,
            y: boxY + 32,
            maxWidth: contentW - 32,
            lineHeight: 30,
            maxLines: isEmpty ? 2 : wantedLines
          });
          return boxY + boxHLocal + 20;
        };

        let cursorY = infoTop + 3 * (boxH + boxGap) + 22;
        cursorY = drawSection(cursorY, "课程内容", contentText, 6);
        cursorY = drawSection(cursorY, "学生情况", performanceText, 5);
        cursorY = drawSection(cursorY, "课后作业", homeworkText, 6);

        const footerH = 84;
        const footerY = pageY + pageH - footerH;
        drawRoundedBlock(ctx, pageX, footerY, pageW, footerH, 0, "#f8fafc", "#f1f5f9", 1);
        applyFillStyle(ctx, "#9ca3af");
        applyFontSize(ctx, 18, 400);
        ctx.fillText("生成时间: " + ts, pageX + 26, footerY + 34);
        ctx.fillText("学生课程管理系统 v1.0", pageX + 26, footerY + 62);

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            wx.canvasToTempFilePath(
              {
                canvas,
                x: 0,
                y: 0,
                width,
                height,
                destWidth: width * 2,
                destHeight: height * 2,
                fileType: "png",
                quality: 1,
                success: resolve,
                fail: reject
              },
              this
            );
          }, 50);
        });
      })
      .then((res) => {
        wx.hideLoading();
        wx.previewImage({ urls: [res.tempFilePath] });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("exportLessonImage failed", err);
        wx.showModal({
          title: "导出失败",
          content: "请升级基础库或点击清缓存后重试。",
          showCancel: false
        });
      });
  }
});
