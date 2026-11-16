# 焜焜 · 设计与插画作品集

这是最新网站的完整可编辑导出项目，包含生产构建、50 张作品的网页图片、缩略图与原始图片文件，以及所有页面和交互动效代码。

## 目录

```text
src/                   可编辑的 HTML、CSS、JavaScript 与全部资源
  assets/works/        优化后的作品图与缩略图
  assets/works/originals/  网站使用的原始图片
  assets/fonts/        本地 Noto Sans SC 字体、样式与 OFL 授权
dist/                  已生成、可直接部署的生产文件
  BUILD-INFO.json      文件列表、SHA-256 与源码版本
scripts/build.mjs      无第三方依赖的生产构建与资源检查
scripts/serve.mjs      本地静态预览服务
.openai/hosting.json   原 Sites 项目部署配置
EXPORT-INFO.json       导出版本与说明
package.json           构建和预览命令
```

## 直接使用生产构建

`dist/` 已构建完成。将 **dist 文件夹内的全部内容** 上传到静态网站托管服务的网站根目录，入口文件为 `index.html`。可使用 Nginx、Apache、Cloudflare Pages、Netlify 等静态托管服务。不需要数据库、后端服务或运行时环境变量。

如平台要求填写构建设置：构建命令为 `npm run build`，输出目录为 `dist`。若仅上传已构建文件，无需执行命令。

`.openai/hosting.json` 保留了原有 Sites 项目标识；部署到其他托管服务时只使用 `dist/` 即可。

## GitHub 仓库与自动部署

目标仓库：`https://github.com/huoribikun/Kunkun`。

项目已提供 `.github/workflows/deploy.yml`。代码推送至 `main` 后，GitHub Actions 会检查并构建，再发布 `dist/` 到 GitHub Pages。首次使用需要在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。此后更新 `src/` 并推送即可自动部署。

GitHub Pages 成功部署后，项目站点通常为 `https://huoribikun.github.io/Kunkun/`；具体以工作流返回的网址为准。资源使用相对路径，可部署在 `/Kunkun/` 子路径。

仓库上传的是整个项目目录的内容；不要只上传 `dist/`，否则不会包含源码和自动部署工作流。完整项目压缩包不含 `.git`、登录凭据或会话文件。

## 本地运行与修改

安装 Node.js 20 或更新版本，然后在本项目目录打开终端：

```sh
npm run dev
```

浏览器打开 `http://localhost:4173`。修改 `src/` 中的文件，刷新浏览器查看结果。项目没有第三方 npm 依赖，无需先执行 `npm install`。

生成生产构建并预览：

```sh
npm run build
npm run preview
```

构建会检查 JavaScript 语法、本地资源引用和作品资源，然后重新生成 `dist/` 与文件校验清单。请在 `src/` 中修改；直接对 `dist/` 的修改会在下次构建时被覆盖。

不要通过双击 `index.html` 使用 `file://` 预览：网站包含 ES modules，请使用上面的本地服务器或静态托管。

## 主要编辑位置

- `src/index.html`：页面文案、邮箱、电话、区块结构。
- `src/portfolio-data.js`：六个作品分类、50 张作品及原图路径。
- `src/style.css`：基础颜色、字体和响应式布局。
- `src/entrances.mjs`、`src/impact-titles.mjs`：滚动渐入、标题冲入与刹停回弹。
- `src/stack-gallery.mjs`、`src/scroll-story.mjs`：循环叠层画廊和插画场景卡片。
- `src/signature.mjs`：飞机绕飞、花朵落下。

## 资源与功能说明

- 导出保留了最新邮箱 `1610422716@qq.com`、电话 `19075433060` 及联系区文案“你会需要我的，对吧~”。
- 为便于完整迁移，原 Google Fonts 在线字体已在本导出中本地化；字体和授权文件均随项目提供，不再依赖在线字体服务。其余网站代码与图片保持最新版本内容。
- “合作需求清单”表单在浏览器本地生成内容，不会自动发送邮件或提交到服务器。邮箱和电话链接分别调用访问者设备的邮件和拨号应用。
- `originals/` 是网站使用的原始图片，不代表 Illustrator、Photoshop 等设计软件的可编辑工程文件。
- 图片与插画版权归相应权利人；字体采用随附的 SIL Open Font License。
- 本次检查包含构建、语法和资源完整性检查；未新增浏览器视觉验收。
