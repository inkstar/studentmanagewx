# 学生管理小程序

面向教培机构老师与管理员的微信小程序，覆盖学生档案、课堂登记、成绩记录、薄弱点分析。

## 当前实现（可运行）
1. 工作台：统计学生数、课堂记录数、本周考试、薄弱点预警。
2. 学生：搜索、新增、查看学生详情。
3. 课堂：按班级登记出勤与评语并保存。
4. 成绩：录入考试成绩、关联薄弱点标签、查看最近成绩。
5. 薄弱点：在学生详情页手动记录，支持统计 Top5。
6. 我的：显示数据概览，支持重置示例数据。
7. 导出：支持学生/课堂/成绩 CSV 导出（复制到剪贴板后可粘贴到 Excel）。

## 数据来源
- 小程序运行时使用本地存储（`wx.setStorageSync`）。
- 初始化种子数据优先来自 `data/student_info.seed.json`。
- `data/student_info.seed.json` 由根目录 `student_info.db` 同步生成。

## student_info.db 同步方法
前置：本机可用 `sqlite3` 与 `node`。

在项目根目录执行：

```bash
node scripts/sync-from-sqlite.mjs
```

执行后会更新：
- `data/student_info.seed.json`

字段映射（核心）：
1. `student` -> `students`
2. `lesson` -> `lessons`
3. `progress_record` -> `exams`
4. `weak_topics/topic` -> `tags + weaknessLogs`

## 启动方式（微信开发者工具）
1. 打开项目目录：`/Users/shenchaonan/Documents/New project/学生管理小程序`
2. 若提示基础库下载失败，先切换较低基础库版本（例如 3.10.x）再重试。
3. 编译后默认进入“工作台”页。

## 目录说明
- `app.json` / `app.js` / `app.wxss`：小程序入口。
- `pages/`：页面实现。
- `utils/db.js`：前端数据层与业务查询。
- `scripts/sync-from-sqlite.mjs`：SQLite 数据同步脚本。
- `data/student_info.seed.json`：由 SQLite 导出的种子数据。
- `docs/student_info_db_schema.md`：`student_info.db` 到小程序数据模型的字段映射。
- `PLAN.md`：计划与执行进度。
- `PRD.md`：需求文档。

## 注意事项
1. `student_info.db` 属于本地业务数据，默认不纳入 Git 版本管理。
2. 提交代码前可先运行同步脚本，确保演示数据与 DB 一致。

## 仓库
- [inkstar/studentmanagewx](https://github.com/inkstar/studentmanagewx)
