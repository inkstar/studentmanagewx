# PLAN

## 更新规则
- 新增计划必须放在最前面。
- 每条新增计划标题使用 `[UTC+8 YYYY-MM-DD HH:mm]`。
- 废弃计划不删除，使用 `~~删除线~~` 保留历史。
- 每条计划包含：目标、改动文件、验收标准、风险与回滚。

## [UTC+8 2026-03-04 01:54] Phase 28 - 课程操作按钮图标化（Done）
- 目标：将课程记录列表中的操作按钮从汉字改为图标符号，提升界面一致性与信息密度。
- 改动文件：`pages/lesson/lesson.wxml`、`pages/lesson/lesson.wxss`、`PLAN.md`。
- 验收标准：操作区展示为图标（编辑/复制/查看/导图/删除），不再出现“改复看图删”文本；点击交互保持不变。
- 风险与回滚：风险为部分机型对个别符号字体渲染差异；回滚方式为 `git revert` 本阶段提交并恢复文字按钮。

## [UTC+8 2026-03-04 01:48] Phase 27 - 修复课程记录首屏空列表（Done）
- 目标：修复课程记录页默认状态看不到任何记录的问题，确保首屏可见已有记录。
- 改动文件：`pages/lesson/lesson.js`、`pages/lesson/lesson.wxml`、`PLAN.md`。
- 验收标准：课程记录页进入后默认展示全部年级记录；记录卡片中可见年级信息。
- 风险与回滚：风险为记录量大时首屏加载条数上升；回滚方式为 `git revert` 本阶段提交并改为显式年级筛选入口。

## [UTC+8 2026-03-04 01:46] Phase 26 - 修复课程导出图片按钮无响应（Done）
- 目标：修复课程列表点击“图”无反应的问题，确保任意列表态都可正常导出图片。
- 改动文件：`pages/lesson/lesson.wxml`、`pages/lesson/lesson.js`、`PLAN.md`。
- 验收标准：列表页点击“图”可出现“生成中”提示并打开图片预览；失败时显示明确错误提示而非静默失败。
- 风险与回滚：风险为低版本基础库仍可能存在 canvas 兼容性差异；回滚方式为 `git revert` 本阶段提交并退回旧导出逻辑。

## [UTC+8 2026-03-04 01:43] Phase 25 - 课程导出图片样式对齐本地导出页（Done）
- 目标：参考 `http://127.0.0.1:8080/api/lessons/155/export?type=image` 的导出模板，重做小程序课程导出图片版式。
- 改动文件：`pages/lesson/lesson.js`、`pages/lesson/lesson.wxml`、`pages/lesson/lesson.wxss`、`PLAN.md`。
- 验收标准：导出图采用橙色渐变头图、信息宫格、三段内容区、状态徽章与灰底页脚，整体信息层次与目标样式一致。
- 风险与回滚：风险为不同机型 canvas 文本测量存在换行差异；回滚方式为 `git revert` 本阶段提交并恢复旧版导出卡片。

## [UTC+8 2026-03-04 01:35] Phase 24 - 复制 educonnect 三页逻辑与风格（Done）
- 目标：将仪表盘、学生管理、课程记录三页完整迁移为 `educonnect-main` 的交互逻辑与视觉结构，并保持现有数据读写能力。
- 改动文件：`pages/index/index.js`、`pages/index/index.wxml`、`pages/index/index.wxss`、`pages/students/students.js`、`pages/students/students.wxml`、`pages/students/students.wxss`、`pages/lesson/lesson.js`、`pages/lesson/lesson.wxml`、`pages/lesson/lesson.wxss`、`PLAN.md`。
- 验收标准：仪表盘具备四统计卡+反馈率+分布+最近课程；学生页具备搜索+筛选抽屉+卡片清单+悬浮新增；课程页具备分类标签+卡片清单+浮动新增及原有增改删复制导图流程。
- 风险与回滚：风险为新交互层级增多导致少量机型滚动/遮罩表现差异；回滚方式为 `git revert` 本阶段提交并回退到 Phase 23 样式版本。

## [UTC+8 2026-03-04 01:26] Phase 23 - 参考 educonnect-main 的 UI 主题重构（Done）
- 目标：参考 `00/educonnect-main` 视觉语言，将小程序 UI 统一到靛蓝渐变主题，并优化表格与操作按钮观感。
- 改动文件：`app.json`、`app.wxss`、`pages/students/students.wxss`、`pages/lesson/lesson.wxss`、`.gitignore`、`PLAN.md`。
- 验收标准：全局主题改为 `educonnect` 风格（主色/渐变/卡片/按钮）；学生页与课程页操作区风格一致；`00/` 目录被 git 忽略且不参与提交。
- 风险与回滚：风险为个别设备字体渲染差异导致视觉略有偏差；回滚方式为 `git revert` 本阶段提交并恢复上一版配色。

## [UTC+8 2026-03-04 01:15] Phase 22 - 参考 read3 的学生与课程模块重构（Done）
- 目标：按 `00/read3.md` 完成学生管理与课程记录模块重构，补齐课程记录筛选、增改删复制、导出图片与 Markdown 预览，并统一导出字段。
- 改动文件：`pages/lesson/lesson.js`、`pages/lesson/lesson.wxml`、`pages/lesson/lesson.wxss`、`pages/students/students.js`、`utils/db.js`、`utils/exporter.js`、`PLAN.md`。
- 验收标准：课程页默认为列表，支持按学生关键词筛选；新增记录时隐藏列表；支持查看/编辑/复制/删除/导出图片；表单包含日期+起止时间+三段内容+知识点字段并提供预览；学生与课程 CSV 字段覆盖 read3 核心结构。
- 风险与回滚：风险为导出图片在不同基础库兼容性差异；回滚方式为 `git revert` 本阶段提交并保留 CSV 导出与 CRUD 功能。

## [UTC+8 2026-03-04 01:07] Phase 21 - 学生管理页参考图重构（Done）
- 目标：参考给定后台模板截图，将学生页重构为“表格清单 + 操作列”形态，补齐导出和编辑能力。
- 改动文件：`pages/students/students.js`、`pages/students/students.wxml`、`pages/students/students.wxss`、`utils/db.js`、`utils/repository.js`、`README.md`、`PLAN.md`。
- 验收标准：学生页具备表头列（姓名/年级/联系方式/薄弱知识点/操作）；支持导出、查看、编辑、删除；新增面板支持新增与批量导入。
- 风险与回滚：风险为移动端窄屏下列宽拥挤；回滚方式为 `git revert` 本阶段提交并恢复卡片清单布局。

## [UTC+8 2026-03-04 01:01] Phase 20 - 学生清单化与删除能力（Done）
- 目标：学生页切换为“记录清单优先”形态，并提供新增与删除学生能力；保持课程页与学生页年级化选择一致。
- 改动文件：`pages/students/students.js`、`pages/students/students.wxml`、`pages/lesson/lesson.js`、`pages/lesson/lesson.wxml`、`utils/db.js`、`utils/repository.js`、`README.md`、`PLAN.md`。
- 验收标准：学生页默认展示清单；管理员可点击新增学生并执行删除（含确认弹窗）；课程新增支持年级和学生选择。
- 风险与回滚：风险为误删学生导致关联记录丢失；回滚方式为 `git revert` 本阶段提交并改为软删除策略。

## [UTC+8 2026-03-04 00:58] Phase 19 - 年级化重构（课程与学生）(Done)
- 目标：将学生管理与课程记录从班级中心改为年级中心，支持固定年级（六至九年级、高一至高三）与课程新增时选择年级和学生。
- 改动文件：`utils/db.js`、`utils/repository.js`、`pages/students/students.js`、`pages/students/students.wxml`、`pages/lesson/lesson.js`、`pages/lesson/lesson.wxml`、`README.md`、`PLAN.md`。
- 验收标准：学生页可按年级筛选并按年级新增；课程新增表单支持“年级 + 学生”选择；课程列表可按当前年级展示。
- 风险与回滚：风险为历史数据缺少 grade 字段导致初始分组不准确；回滚方式为 `git revert` 本阶段提交并回退到班级选择逻辑。

## [UTC+8 2026-03-04 00:50] Phase 18 - 课程列表化与详情/我的视觉闭环（Done）
- 目标：课程页改为“列表优先 + 新增按钮”模式，并将学生详情页、我的页统一为同一套信息卡/表单块风格。
- 改动文件：`pages/lesson/lesson.js`、`pages/lesson/lesson.wxml`、`pages/student-detail/student-detail.wxml`、`pages/profile/profile.wxml`、`utils/db.js`、`utils/repository.js`、`README.md`、`PLAN.md`。
- 验收标准：课程页默认展示课程记录列表并支持新增；学生详情与我的页视觉组件一致（hero + card + form-block + list-item）；课程历史显示课程状态、教师、时长等信息。
- 风险与回滚：风险为单页逻辑增多影响可维护性；回滚方式为 `git revert` 本阶段提交并恢复“表单优先”课程页。

## [UTC+8 2026-03-04 00:45] Phase 17 - 课程长文本输入区增高（Done）
- 目标：提高课程内容、课程作业、课堂评语输入区高度，优化长文本录入体验。
- 改动文件：`app.wxss`、`pages/lesson/lesson.wxml`、`PLAN.md`。
- 验收标准：课程内容与课程作业为更高多行输入区；每个学生评语改为中等高度多行输入区，文本不再拥挤。
- 风险与回滚：风险为页面纵向滚动长度增加；回滚方式为 `git revert` 本阶段提交并恢复单行输入。

## [UTC+8 2026-03-04 00:39] Phase 16 - 表单分组化与移动端录入体验重构（Done）
- 目标：继续参考 00 模板，将课程记录/学习进度/学生新增改为分组表单，修复输入框高度与垂直对齐问题。
- 改动文件：`app.wxss`、`pages/lesson/lesson.wxml`、`pages/scores/scores.wxml`、`pages/students/students.wxml`、`PLAN.md`。
- 验收标准：输入框与选择框在手机端高度统一且文本垂直居中；课程/进度页改为“字段标签+输入控件”分组结构；主操作按钮保持底部操作区风格。
- 风险与回滚：风险为旧设备上 sticky 区域覆盖内容；回滚方式为 `git revert` 本阶段提交并恢复普通流式按钮布局。

## [UTC+8 2026-03-04 00:29] Phase 15 - 表单控件高度与布局修正（Done）
- 目标：修复多页面输入框高度异常和文本垂直对齐问题，提升手机端录入体验。
- 改动文件：`app.wxss`、`pages/scores/scores.wxml`、`PLAN.md`。
- 验收标准：输入框与选择框高度统一（84rpx），文本不再被压缩；学习进度页双科目输入横向布局稳定。
- 风险与回滚：风险为不同设备下控件默认样式差异；回滚方式为 `git revert` 本阶段提交并按机型单独调优。

## [UTC+8 2026-03-04 00:22] Phase 14 - 参考 00/README 的结构化重构（Done）
- 目标：按 `00/README.md` 的产品结构重构小程序代码与界面，统一为“仪表盘/学生管理/课程记录/学习进度”模型。
- 改动文件：`utils/db.js`、`utils/repository.js`、`app.json`、`app.wxss`、`pages/index/*`、`pages/lesson/*`、`pages/scores/*`、`pages/students/*`、`pages/student-detail/*`、`pages/profile/profile.wxml`、`README.md`、`PLAN.md`。
- 验收标准：Tab 与页面语义对齐 00 模板；课程记录支持状态/时长/科目/教师；学习进度支持掌握程度；仪表盘展示出勤率与掌握分布。
- 风险与回滚：风险为历史字段兼容性问题导致旧数据展示差异；回滚方式为 `git revert` 本阶段提交并保留旧字段映射逻辑。

## [UTC+8 2026-03-04 00:11] Phase 13 - 批量导入体验增强（Done）
- 目标：提升学生批量导入可用性，增加模板复制与导入结果反馈，减少手工格式错误成本。
- 改动文件：`pages/students/students.js`、`pages/students/students.wxml`、`README.md`、`PLAN.md`。
- 验收标准：管理员可一键复制导入模板；执行导入后弹窗显示成功与忽略条数。
- 风险与回滚：风险为 CSV 规则变更造成误导；回滚方式为 `git revert` 本阶段提交并恢复基础导入入口。

## [UTC+8 2026-03-04 00:09] Phase 12 - 学生批量 CSV 粘贴导入（Done）
- 目标：支持在小程序内通过粘贴 CSV 文本批量导入学生，提高初始化效率。
- 改动文件：`pages/students/students.js`、`pages/students/students.wxml`、`utils/db.js`、`utils/repository.js`、`README.md`、`PLAN.md`。
- 验收标准：管理员可在学生页粘贴多行 CSV 并批量导入；导入后列表实时刷新并显示成功条数。
- 风险与回滚：风险为 CSV 手工格式不规范导致部分行被忽略；回滚方式为 `git revert` 本阶段提交并恢复单条录入模式。

## [UTC+8 2026-03-04 00:06] Phase 11 - 云函数健康检测入口（Done）
- 目标：在小程序端增加云函数健康检查入口，帮助快速验证环境与部署状态。
- 改动文件：`pages/profile/profile.js`、`pages/profile/profile.wxml`、`README.md`、`PLAN.md`。
- 验收标准：我的页可点击“检测云函数”，成功时提示可用并显示健康状态，失败时展示不可用提示。
- 风险与回滚：风险为未部署云函数时用户误判为代码问题；回滚方式为 `git revert` 本阶段提交并隐藏检测入口。

## [UTC+8 2026-03-04 00:04] Phase 10 - 云函数与客户端调用骨架（Done）
- 目标：落地云开发接入骨架，补齐云函数目录、客户端调用封装与接入文档，确保后续可平滑切换到真实云数据库。
- 改动文件：`cloudfunctions/studentManage/*`、`utils/cloudClient.js`、`docs/cloud_dev_guide.md`、`README.md`、`PLAN.md`。
- 验收标准：项目内存在可部署云函数骨架和客户端调用封装；文档给出从本地模式切换到云模式的操作路径。
- 风险与回滚：风险为骨架未接真实数据时造成预期落差；回滚方式为 `git revert` 本阶段提交并保留 `LOCAL` 运行模式。

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
- Phase 10 云函数与客户端调用骨架：Done
- Phase 11 云函数健康检测入口：Done
- Phase 12 学生批量 CSV 粘贴导入：Done
- Phase 13 批量导入体验增强：Done
- Phase 14 参考 00/README 结构化重构：Done
- Phase 15 表单控件高度与布局修正：Done
- Phase 16 表单分组化与移动端录入体验重构：Done
- Phase 17 课程长文本输入区增高：Done
- Phase 18 课程列表化与详情/我的视觉闭环：Done
- Phase 19 年级化重构（课程与学生）：Done
- Phase 20 学生清单化与删除能力：Done
- Phase 21 学生管理页参考图重构：Done
- Phase 22 参考 read3 的学生与课程模块重构：Done
- Phase 23 参考 educonnect-main 的 UI 主题重构：Done
- Phase 24 复制 educonnect 三页逻辑与风格：Done
- Phase 25 课程导出图片样式对齐本地导出页：Done
- Phase 26 修复课程导出图片按钮无响应：Done
- Phase 27 修复课程记录首屏空列表：Done
- Phase 28 课程操作按钮图标化：Done

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
- 2026-03-04：完成云函数目录与客户端调用封装，新增云开发接入指引文档。
- 2026-03-04：完成我的页云函数健康检测入口，支持一键验证部署状态。
- 2026-03-04：完成学生页 CSV 粘贴批量导入能力，提升数据初始化效率。
- 2026-03-04：完成批量导入模板复制与结果反馈弹窗，降低使用门槛。
- 2026-03-04：完成按 00/README 的模块化重构，统一仪表盘/课程/进度模型并改版 UI。
- 2026-03-04：修复输入框高度与文本显示问题，统一表单控件尺寸。
- 2026-03-04：完成课程/进度/学生表单分组化重构，移动端录入体验进一步优化。
- 2026-03-04：完成课程内容、作业与评语输入区增高，支持长文本录入。
- 2026-03-04：完成课程页列表化与新增入口重构，学生详情页和我的页完成视觉闭环统一。
- 2026-03-04：完成年级化重构，学生页和课程页均支持年级选择，课程新增支持指定学生。
- 2026-03-04：完成学生页清单优先重构与删除学生能力，课程新增保持年级+学生选择。
- 2026-03-04：完成学生页后台表格风格改版，补齐导出与编辑操作。
- 2026-03-04：完成 read3 版学生与课程模块重构，课程页支持筛选/增改删复制/导出图片与 Markdown 预览。
- 2026-03-04：完成 educonnect 风格主题改版，统一全局配色并确保 `00/` 目录不入库。
- 2026-03-04：完成仪表盘/学生管理/课程记录三页按 educonnect 逻辑与风格迁移，保留小程序业务操作闭环。
- 2026-03-04：完成课程导出图片改版，导出样式对齐本地 /api/lessons/.../export?type=image 模板。
- 2026-03-04：修复课程列表“图”按钮无响应，导出流程增加加载提示与失败弹窗。
- 2026-03-04：修复课程记录默认空列表，改为首屏展示全部年级记录并显示年级信息。
- 2026-03-04：将课程记录操作按钮由汉字改为图标符号，保持原有交互能力。

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
