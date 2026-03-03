import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const dbFile = resolve(projectRoot, "student_info.db");
const outputFile = resolve(projectRoot, "data/student_info.seed.json");

function runJsonQuery(sql) {
  const cmd = `sqlite3 -json "${dbFile}" "${sql.replace(/"/g, '""')}"`;
  const out = execSync(cmd, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(out || "[]");
}

function splitTopics(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  arr.forEach((item) => {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  });
  return out;
}

const studentsRaw = runJsonQuery(
  "SELECT id,name,grade,phone,parent_phone,email,address,notes,created_at,learned_topics,weak_topics,class_type,homeroom_teacher FROM student ORDER BY id"
);
const lessonsRaw = runJsonQuery(
  "SELECT id,student_id,lesson_date,start_time,end_time,subject,content,student_performance,homework,duration,status,notes,created_at,teacher,topic,learned_topics,weak_topics,count_in_salary FROM lesson ORDER BY lesson_date DESC,id DESC"
);
const progressRaw = runJsonQuery(
  "SELECT id,student_id,record_date,subject,topic,mastery_level,score,notes,created_at,exam_name FROM progress_record ORDER BY record_date DESC,id DESC"
);

const classMap = new Map();
studentsRaw.forEach((s) => {
  const classType = s.class_type || "未分班";
  const teacher = s.homeroom_teacher || "未分配";
  const grade = s.grade || "未知年级";
  const className = `${grade}-${classType}-${teacher}`;
  const classId = `class_${grade}_${classType}_${teacher}`.replace(/\s+/g, "_");
  if (!classMap.has(classId)) {
    classMap.set(classId, { id: classId, name: className });
  }
});

const classes = Array.from(classMap.values());
const subjects = uniqBy(
  [
    ...lessonsRaw.map((l) => l.subject).filter(Boolean),
    ...progressRaw.map((p) => p.subject).filter(Boolean)
  ].map((name, idx) => ({ id: `subject_${idx + 1}`, name })),
  (s) => s.name
).map((s, idx) => ({ id: `subject_${idx + 1}`, name: s.name }));

const studentIdMap = new Map();
const students = studentsRaw.map((s) => {
  const classType = s.class_type || "未分班";
  const teacher = s.homeroom_teacher || "未分配";
  const grade = s.grade || "未知年级";
  const classId = `class_${grade}_${classType}_${teacher}`.replace(/\s+/g, "_");
  const id = `stu_${s.id}`;
  studentIdMap.set(s.id, id);
  return {
    id,
    name: s.name || `学生${s.id}`,
    classId,
    phone: s.phone || "",
    guardian: s.parent_phone || "",
    grade,
    notes: s.notes || "",
    email: s.email || "",
    address: s.address || ""
  };
});

const topicPool = [];
studentsRaw.forEach((s) => {
  topicPool.push(...splitTopics(s.weak_topics));
  topicPool.push(...splitTopics(s.learned_topics));
});
lessonsRaw.forEach((l) => {
  topicPool.push(...splitTopics(l.weak_topics));
  topicPool.push(...splitTopics(l.learned_topics));
  topicPool.push(...splitTopics(l.topic));
});
progressRaw.forEach((p) => {
  topicPool.push(...splitTopics(p.topic));
});

const uniqueTopics = uniqBy(
  topicPool.map((name) => ({ name })),
  (x) => x.name
).slice(0, 120);

const tags = uniqueTopics.map((t, idx) => ({ id: `tag_${idx + 1}`, name: t.name }));
const tagMap = new Map(tags.map((t) => [t.name, t.id]));

const lessons = lessonsRaw.map((l) => {
  const sid = studentIdMap.get(l.student_id);
  if (!sid) return null;

  let attendance = "出勤";
  if (l.status && String(l.status).toLowerCase().includes("absent")) {
    attendance = "缺勤";
  }

  const classId = (students.find((s) => s.id === sid) || {}).classId || "";

  return {
    id: `lesson_${l.id}`,
    classId,
    lessonDate: l.lesson_date || "",
    content: l.content || l.topic || "",
    homework: l.homework || "",
    records: [
      {
        studentId: sid,
        attendance,
        comment: l.student_performance || l.notes || ""
      }
    ],
    createdAt: Date.parse(l.created_at || "") || Date.now()
  };
}).filter(Boolean);

const exams = progressRaw.map((p) => {
  const sid = studentIdMap.get(p.student_id);
  if (!sid) return null;

  const topics = splitTopics(p.topic);
  const firstTagId = topics.length ? tagMap.get(topics[0]) || "" : "";

  return {
    id: `exam_${p.id}`,
    studentId: sid,
    examName: p.exam_name || `${p.subject || "学科"}测验`,
    examDate: p.record_date || "",
    subjectScores: {
      math: Number(p.score || 0),
      english: 0
    },
    totalScore: Number(p.score || 0),
    comment: p.notes || p.mastery_level || "",
    weaknessTagId: firstTagId,
    createdAt: Date.parse(p.created_at || "") || Date.now()
  };
}).filter(Boolean);

const weaknessLogs = [];

studentsRaw.forEach((s) => {
  const sid = studentIdMap.get(s.id);
  const topics = splitTopics(s.weak_topics);
  topics.forEach((topic) => {
    const tagId = tagMap.get(topic);
    if (!tagId) return;
    weaknessLogs.push({
      id: `weak_student_${s.id}_${tagId}`,
      studentId: sid,
      tagId,
      note: "来自 student.weak_topics",
      sourceType: "MANUAL",
      createdAt: Date.now()
    });
  });
});

progressRaw.forEach((p) => {
  const sid = studentIdMap.get(p.student_id);
  const topics = splitTopics(p.topic);
  topics.forEach((topic, idx) => {
    const tagId = tagMap.get(topic);
    if (!tagId) return;
    weaknessLogs.push({
      id: `weak_progress_${p.id}_${idx}`,
      studentId: sid,
      tagId,
      note: p.exam_name || "来自 progress_record",
      sourceType: "EXAM",
      createdAt: Date.parse(p.created_at || "") || Date.now()
    });
  });
});

const seed = {
  classes,
  subjects,
  tags,
  students,
  lessons,
  exams,
  weaknessLogs
};

writeFileSync(outputFile, JSON.stringify(seed, null, 2), "utf8");
console.log(`Seed generated: ${outputFile}`);
console.log(`classes=${classes.length}, students=${students.length}, lessons=${lessons.length}, exams=${exams.length}, tags=${tags.length}, weaknessLogs=${weaknessLogs.length}`);
