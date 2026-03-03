const CANVAS_SIZE = {
  width: 720,
  height: 1420
};

function formatDateCN(dateText) {
  const s = String(dateText || "").trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return s || "-";
  }
  return match[1] + "年" + match[2] + "月" + match[3] + "日";
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

function prepareCanvas(page, logicalWidth, logicalHeight, canvasId) {
  if (
    page._exportCanvas &&
    page._exportCanvas.ctx &&
    page._exportCanvas.canvas &&
    page._exportCanvas.logicalWidth === logicalWidth &&
    page._exportCanvas.logicalHeight === logicalHeight
  ) {
    const cached = page._exportCanvas;
    cached.ctx.setTransform(cached.dpr, 0, 0, cached.dpr, 0, 0);
    cached.ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery().in(page);
    query
      .select("#" + canvasId)
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
        page._exportCanvas = result;
        resolve(result);
      });
  });
}

function exportLessonImage(page, lesson, options) {
  const canvasId = (options && options.canvasId) || "lessonShareCanvas";
  const width = (options && options.width) || CANVAS_SIZE.width;
  const height = (options && options.height) || CANVAS_SIZE.height;
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

  return prepareCanvas(page, width, height, canvasId)
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
            page
          );
        }, 50);
      });
    })
    .then((res) => {
      wx.hideLoading();
      wx.previewImage({ urls: [res.tempFilePath] });
      return res;
    })
    .catch((err) => {
      wx.hideLoading();
      throw err;
    });
}

module.exports = {
  exportLessonImage
};

