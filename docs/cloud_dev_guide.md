# 云开发接入说明（骨架版）

## 目标
当前页面层已通过 `utils/repository.js` 做了统一数据访问抽象。若要切换到云开发，可在仓储层优先调用云函数，失败后回退本地数据。

## 已提供内容
1. 云函数目录：`cloudfunctions/studentManage/`
2. 云函数入口：`cloudfunctions/studentManage/index.js`
3. 客户端封装：`utils/cloudClient.js`
4. 运行时配置：`utils/runtime.js`（支持 `LOCAL/CLOUD`）

## 本地启用步骤
1. 在微信开发者工具中打开“云开发”并初始化环境。
2. 在“我的”页面将数据模式切换到 `CLOUD`。
3. 填写环境 ID 并保存。
4. 右键上传并部署 `cloudfunctions/studentManage`。

## 下一步改造建议
1. 在 `utils/repository.js` 中为每个方法增加云函数调用分支。
2. 云函数接数据库集合（students, lessons, exams, weakness_logs）。
3. 加入权限校验：老师仅可访问绑定班级，管理员可全局访问。
