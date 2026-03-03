# PLAN

## 更新规则
- 新增计划必须放在最前面。
- 每条新增计划标题使用 `[UTC+8 YYYY-MM-DD HH:mm]`。
- 废弃计划不删除，使用 `~~删除线~~` 保留历史。
- 每条计划包含：目标、改动文件、验收标准、风险与回滚。

## [UTC+8 2026-03-04 00:03] Phase 9 - 运行模式与身份流骨架（Done）
- 目标：建立 `LOCAL/CLOUD` 数据模式切换和 `TEACHER/ADMIN` 身份切换骨架，为后续云函数接入和权限扩展打基础。
- 改动文件：`utils/runtime.js`、`utils/repository.js`、`app.js`、`pages/profile/*`、`pages/students/*`、`pages/index/index.js`、`pages/lesson/lesson.js`、`pages/scores/scores.js`、`pages/student-detail/student-detail.js`、`utils/exporter.js`、`README.md`、`PLAN.md`。
- 验收标准：我的页可切换角色与数据模式并保存；应用启动读取运行配置；数据访问统一经过仓储层，CLOUD 模式下可安全回退 LOCAL 数据。
- 风险与回滚：风险为页面引用层变更导致局部调用异常；回滚方式为 `git revert` 本阶段提交并恢复 `utils/db.js` 直连模式。

## [UTC+8 2026-03-03 23:06] Phase 8 - 学生跟进指标增强（Done）
- 目标：在学生列表展示每位学生的课堂次数与考试次数，提升老师日常跟进效率。
- 改动文件：`utils/db.js`、`pages/students/students.wxml`、`PLAN.md`。
- 验收标准：学生列表每条记录显示“课堂 X 次 · 考试 Y 次”，且随新录入数据实时变化。
- 风险与回滚：风险为历史数据结构缺失 `records` 导致计数偏差；回滚方式为 `git revert` 本阶段提交并加兼容逻辑后重提。

## [UTC+8 2026-03-03 23:04] Phase 7 - DB 结构映射文档沉淀（Done）
- 目标：沉淀 `student_info.db` 到小程序模型的字段映射文档，降低后续数据库变更的维护成本。
- 改动文件：`docs/student_info_db_schema.md`、`README.md`、`PLAN.md`。
- 验收标准：文档明确 `student/lesson/progress_record` 到 `students/lessons/exams/tags/weaknessLogs` 的映射规则，并给出同步命令。
- 风险与回滚：风险为文档与脚本不一致；回滚方式为 `git revert` 本阶段提交并按脚本实际行为修正文档。

## [UTC+8 2026-03-03 23:02] Phase 6 - CSV 导出能力补齐（Done）
- 目标：补齐学生、课堂、成绩数据的 CSV 导出能力，支持老师快速对外汇报与归档。
- 改动文件：`utils/exporter.js`、`pages/profile/profile.js`、`pages/profile/profile.wxml`、`utils/db.js`、`README.md`、`PLAN.md`。
- 验收标准：在“我的”页可点击导出学生/课堂/成绩 CSV，并复制到剪贴板；粘贴后可被 Excel 正常识别。
- 风险与回滚：风险为文本字段包含换行导致 CSV 可读性下降；回滚方式为 `git revert` 本阶段提交并调整导出转义策略。

## [UTC+8 2026-03-03 23:00] Phase 5 - SQLite 数据接入与业务页面联动（Done）
- 目标：支持读取 `student_info.db` 的数据结构并驱动小程序业务页面，完成学生/课堂/成绩/薄弱点四条链路的可操作 MVP。
- 改动文件：`utils/db.js`、`scripts/sync-from-sqlite.mjs`、`data/student_info.seed.json`、`app.json`、`app.js`、`app.wxss`、`pages/index/*`、`pages/students/*`、`pages/student-detail/*`、`pages/lesson/*`、`pages/scores/*`、`pages/profile/*`、`README.md`、`.gitignore`、`PLAN.md`。
- 验收标准：可通过脚本从 `student_info.db` 生成种子数据；小程序能展示 DB 导入的学生/课堂/成绩数据；可继续新增学生、登记课堂、录入成绩并产生薄弱点记录。
- 风险与回滚：风险为 SQLite 字段变化导致同步脚本失效；回滚方式为 `git revert` 本阶段提交，恢复到上一阶段并修复脚本后重推。

## [UTC+8 2026-03-03 22:45] Phase 4 - 小程序可运行骨架搭建（Done）
- 目标：修复开发者工具“缺少 app.json”启动失败问题，完成首个可运行的小程序基础骨架。
- 改动文件：`app.json`、`app.js`、`app.wxss`、`sitemap.json`、`pages/index/*`、`pages/students/*`、`pages/lesson/*`、`pages/profile/*`、`PLAN.md`。
- 验收标准：项目根目录存在 `app.json` 且已声明页面；开发者工具可正常编译并进入首页；四个 tab 页面可切换显示。
- 风险与回滚：风险为页面结构后续调整导致路径变更；回滚方式为 `git revert` 本阶段提交，恢复到文档阶段状态后重建页面。

## 总体目标
在独立仓库内分阶段完成并推送三类文档：`PRD.md`、`README.md`、`PLAN.md`，并进入代码开发，保证阶段提交可追溯。

## 阶段状态总览
- Phase 0 仓库初始化：Done
- Phase 1 PRD：Done
- Phase 2 README：Done
- Phase 3 PLAN 收敛：Done
- Phase 4 小程序骨架：Done
- Phase 5 SQLite 接入与业务联动：Done
- Phase 6 CSV 导出能力：Done
- Phase 7 DB 结构映射文档：Done
- Phase 8 学生跟进指标增强：Done
- Phase 9 运行模式与身份流骨架：Done

## 执行日志
- 2026-03-03：完成独立仓库初始化并推送 `main`。
- 2026-03-03：完成 `PRD.md` 并推送阶段提交。
- 2026-03-03：完成 `README.md` 并推送阶段提交。
- 2026-03-03：完成 `PLAN.md` 收敛并推送阶段提交。
- 2026-03-03：完成小程序运行骨架搭建并修复 `app.json` 缺失问题。
- 2026-03-03：完成 `student_info.db` 同步脚本与 DB 数据映射，业务页面联调通过。
- 2026-03-03：完成 CSV 导出能力（学生/课堂/成绩）并接入“我的”页面。
- 2026-03-03：完成 `student_info.db` 映射文档沉淀并接入 README 导航。
- 2026-03-03：完成学生列表课堂/考试计数展示，支持老师快速识别跟进状态。
- 2026-03-04：完成运行配置（角色+数据模式）与仓储层抽象，预留云开发接入路径。

## [UTC+8 2026-03-03 22:38] Phase 3 - PLAN 收敛与进度固化（Done）
- 目标：完善计划总览、阶段状态、执行日志与风险回滚说明，形成统一进度事实来源。
- 改动文件：`PLAN.md`。
- 验收标准：`PLAN.md` 具备更新规则、总览、阶段状态、执行日志，且本阶段记录位于最顶部。
- 风险与回滚：风险为后续更新未按规则维护；回滚方式为 `git revert` 本阶段提交并按规则补录新计划项。

## [UTC+8 2026-03-03 22:38] Phase 2 - README 文档完善（Done）
- 目标：补齐项目 README，明确项目定位、技术方案、协作方式和阶段路线图。
- 改动文件：`README.md`、`PLAN.md`。
- 验收标准：`README.md` 可作为项目入口文档；`PLAN.md` 顶部新增 Phase 2 完成记录并保留历史。
- 风险与回滚：风险为文档与后续实现偏离；回滚方式为 `git revert` 本阶段提交并重写 README。

## [UTC+8 2026-03-03 21:19] Phase 1 - PRD 初版（Done）
- 目标：完成学生管理小程序 PRD 初版，明确角色、功能范围、业务流程、数据模型和验收标准。
- 改动文件：`PRD.md`、`PLAN.md`。
- 验收标准：`PRD.md` 内容完整且中文可读；`PLAN.md` 已建立更新规则并新增本阶段记录。
- 风险与回滚：风险为需求边界调整导致内容改写；回滚方式为 `git revert` 本阶段提交并重新提交修订版。
