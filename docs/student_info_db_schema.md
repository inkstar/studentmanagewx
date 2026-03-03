# student_info.db 结构映射说明

本文档描述 `student_info.db` 到小程序本地数据层（`utils/db.js`）的映射关系。

## 1. 原始表

### 1.1 student
核心字段：
- `id`
- `name`
- `grade`
- `phone`
- `parent_phone`
- `notes`
- `weak_topics`
- `class_type`
- `homeroom_teacher`

### 1.2 lesson
核心字段：
- `id`
- `student_id`
- `lesson_date`
- `subject`
- `content`
- `student_performance`
- `homework`
- `status`
- `weak_topics`

### 1.3 progress_record
核心字段：
- `id`
- `student_id`
- `record_date`
- `subject`
- `topic`
- `mastery_level`
- `score`
- `exam_name`

## 2. 小程序种子结构
同步脚本 `scripts/sync-from-sqlite.mjs` 生成 `data/student_info.seed.json`，结构如下：

1. `classes`
2. `subjects`
3. `tags`
4. `students`
5. `lessons`
6. `exams`
7. `weaknessLogs`

## 3. 映射规则

### 3.1 student -> students/classes
- `student.id` -> `students.id`（前缀 `stu_`）
- `student.name` -> `students.name`
- `student.parent_phone` -> `students.guardian`
- `student.grade + class_type + homeroom_teacher` 组合生成 `classes.id/classes.name`
- `student.class` 关联由上述组合键生成

### 3.2 lesson -> lessons
- `lesson.id` -> `lessons.id`（前缀 `lesson_`）
- `lesson.lesson_date` -> `lessons.lessonDate`
- `lesson.content` -> `lessons.content`
- `lesson.homework` -> `lessons.homework`
- `lesson.student_performance` -> `lessons.records[].comment`
- `lesson.status` -> `lessons.records[].attendance`（默认映射为“出勤”）

### 3.3 progress_record -> exams
- `progress_record.id` -> `exams.id`（前缀 `exam_`）
- `progress_record.student_id` -> `exams.studentId`
- `progress_record.record_date` -> `exams.examDate`
- `progress_record.exam_name` -> `exams.examName`
- `progress_record.score` -> `exams.totalScore`
- `progress_record.topic` -> 解析后关联薄弱点标签

### 3.4 weak_topics/topic -> tags/weaknessLogs
- `student.weak_topics`、`lesson.weak_topics`、`progress_record.topic` 统一分词（逗号）
- 去重后生成 `tags`
- 按学生和记录来源生成 `weaknessLogs`

## 4. 运行同步

```bash
node scripts/sync-from-sqlite.mjs
```

执行成功后会输出：
- classes 数量
- students 数量
- lessons 数量
- exams 数量
- tags 数量
- weaknessLogs 数量

## 5. 注意事项
1. 若 `student_info.db` 字段名变化，需要同步修改 `scripts/sync-from-sqlite.mjs` 的 SQL 查询。
2. 若要新增科目级成绩字段（如语文/物理），需扩展 `exams.subjectScores` 映射。
