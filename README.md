# Yang Lab 网站

Hugo + StackNote 的实验室网站首版。暖白、珊瑚橙、玫红配色；首页使用实验室真实合照。

## 实时预览

当前会话中已启动：<http://localhost:1313/>。保存文件后浏览器自动刷新。

以后打开 PowerShell，在此文件夹运行：

```powershell
./Start-Preview.ps1
```

这个脚本优先使用系统安装的 Hugo，否则使用当前工作区下载的 Hugo。将网站单独移到另一台电脑时，请安装 **Hugo Extended 0.160.0 或更新版本**，然后运行：

```powershell
hugo server --buildDrafts --disableFastRender
```

不要同时启动两个占用 1313 端口的预览。关闭终端会停止预览。网站运行不需要 Node、数据库或外部字体服务。

## 更新内容

| 内容 | 修改位置 |
| --- | --- |
| 名称、联系方式、首页简介 | `hugo.toml` 的 `[params]` |
| 首页合照 | `assets/images/lab-group.png`；或修改 `heroImage` |
| 成员姓名、职位、头像路径 | `data/people.json` |
| 研究方向 | `data/research.json` |
| 经费、资助机构 | `data/funding.json` |
| 论文及统计 | `data/publications.json` |
| 配色、间距、手机布局 | `assets/css/lab.css` |
| 页面结构 | `layouts/index.html` |

论文列表按年份分组，支持标题、作者、期刊关键词和年份筛选。新增论文时复制一条记录修改字段即可；年份选项与每年的条目数自动生成。`doi` 字段填写 `10.xxxx/xxxxx`，留空则不显示 DOI 链接。总计 68、30、2 来自截图中的不同统计范围，不会以当前录入的 22 条记录替代这些总计。

头像取自原始 PPT，姓名与头像的对应关系使用 PPT 内的分组信息。Hugo 自动读取照片方向并生成 WebP。原始照片保留在 `assets` 下，发布目录只包含页面使用的派生图片。

## 部署到 GitHub Pages

1. 在 GitHub 创建网站仓库。
2. 将 **本文件夹内的内容** 放在仓库根目录，包括隐藏的 `.github` 文件夹。不要把整个 `yang-lab` 文件夹再套一层。
3. 将源码推送到 `main` 分支。
4. 在仓库 `Settings → Pages → Build and deployment → Source` 选择 **GitHub Actions**。
5. 在 `Actions` 查看 `Build and deploy Hugo to GitHub Pages` 工作流。需要时点击手动运行。

工作流自动采用 GitHub Pages 提供的地址，兼容 `用户名.github.io` 和 `用户名.github.io/仓库名/`。主题已随项目保存，无需另外拉取子模块。

正式发布前，将 `hugo.toml` 中 `baseURL` 改为实际站点 URL，并完成内容核对后将 `preview = true` 改为 `false`。预览模式显示简短提示且禁止搜索引擎索引，**不提供访问控制**。仓库和 Pages 的可见性请按实验室需要选择。

当前只完成本地网站和部署配置，尚未创建远程仓库、推送或公开发布。GitHub Pages 实际部署需在目标仓库验证。

## 内容范围与素材

- 研究方向、经费和成果总数：导师提供的截图。
- 成员信息与独立头像：同目录的 `Department Introduction-Yang lab-20260915.pptx`，第 1 页。
- 首页合照：用户在本次聊天提供的原始图片，保留全幅比例。
- 联系方式：UMN 官方教师目录及 Extension 页面，见 `SOURCES.md`。
- 已录入论文 22 条：2026 年 6 条、2025 年 4 条、2024 年 5 条、2023 年 7 条。缺少 2022 年列表及其余完整 CV；论文尚未逐条文献核验。截图未给出的 DOI 没有猜填。
- 推广成果先链接官方 UMN Extension 资源；尚未取得 32 篇成果的逐条清单。
- 设计过程中生成的插画没有用于最终网站。

## 主题和许可

使用 [StackNote](https://github.com/myimilo/hugo-theme-stacknote)，固定参考提交 `604182eeb581a51604ac3bfedf4219769e880e69`。主题保存在 `themes/stacknote/`，MIT 许可和版权信息保留在原目录。站点使用主题基础模板、样式和文章模板，并在顶层 `layouts/`、`assets/css/lab.css` 中添加实验室定制。

Cormorant Garamond 与 Outfit 字体自托管，OFL 许可保存在 `licenses/`。实验室照片与内容不因主题许可而自动成为开源素材。

## 本地构建检查

```powershell
hugo --gc --minify --panicOnWarning
```

`public/` 为自动生成的发布文件，不需要提交。`resources/` 与缓存同样已列入 `.gitignore`。


## 简化首页与 Lab News

首页只保留介绍、团队合照、简介横条和 Lab News。Research、People、Projects、Extension、Contact 已拆成独立页面。

新闻位于 `content/news/`：每条新闻一个 Markdown 文件，可配置 `title`、`date`、`description`、`tags` 和 `cover`。首页直接复用 StackNote 的 `post-card.html`，展示最新的一张大卡片与三条小卡片；完整列表位于 `/news/`。

当前四篇文章是明确标注的**排版草稿**，`draft = true`。本地预览使用 `--buildDrafts` 显示它们；正式构建不加该参数，因此不会发布这些示例。撰写真实新闻后，将对应文章设为 `draft = false`。尚无公开新闻时页面显示简短空状态。

Alumni 页面位于 `/people/alumni/`，数据保存在 `data/alumni.json`。每条记录可含 `name`、`role`、`years`、`currentPosition`。当前为空，未虚构校友信息。
