# 学生管理小程序

面向教培机构老师与管理员的微信小程序，覆盖仪表盘、学生管理、课程记录、学习进度、薄弱点分析。

## 当前实现（可运行）
1. 仪表盘：统计学生数、课程数、出勤率、掌握程度分布、薄弱点预警。
2. 学生：后台表格风格记录清单（列表优先），支持搜索、按年级筛选、新增/编辑/删除、查看详情、导出 CSV，字段覆盖姓名/年级/班型/班主任/联系方式/薄弱知识点/备注，支持批量 CSV 导入。
3. 课程记录：按年级查看列表并按学生关键词筛选，支持新增/编辑/复制/删除/导出图片；新增时自动隐藏列表，可选择“年级 + 学生”，并录入日期+开始/结束时间、三段内容（课程内容/学生情况/课后作业）、知识点与备注，含 Markdown 预览区。
4. 学习进度：录入测验成绩、掌握程度、关联薄弱点标签并查看最近进度。
5. 薄弱点：在学生详情页手动记录，支持统计 Top5，并统一信息卡风格展示学习轨迹。
6. 我的：显示数据概览，支持重置示例数据。
7. 导出：支持学生/课堂/成绩 CSV 导出（复制到剪贴板后可粘贴到 Excel）。
8. 运行配置：支持切换 `TEACHER/ADMIN` 角色与 `LOCAL/CLOUD` 数据模式（云模式为预留骨架，当前自动回退本地）。
9. 云检测：在“我的”页可调用 `studentManage.health` 检测云函数可用性。

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
- `utils/repository.js`：统一数据访问仓储层（预留云开发接入点）。
- `utils/runtime.js`：运行时配置（角色、数据模式、云环境ID）。
- `utils/cloudClient.js`：云函数调用封装。
- `scripts/sync-from-sqlite.mjs`：SQLite 数据同步脚本。
- `data/student_info.seed.json`：由 SQLite 导出的种子数据。
- `docs/student_info_db_schema.md`：`student_info.db` 到小程序数据模型的字段映射。
- `docs/cloud_dev_guide.md`：云开发接入说明。
- `cloudfunctions/studentManage/`：云函数骨架（待接数据库）。
- `PLAN.md`：计划与执行进度。
- `PRD.md`：需求文档。

## 注意事项
1. `student_info.db` 属于本地业务数据，默认不纳入 Git 版本管理。
2. 提交代码前可先运行同步脚本，确保演示数据与 DB 一致。

## 仓库
- [inkstar/studentmanagewx](https://github.com/inkstar/studentmanagewx)
