# 部署指南：从 GitHub 到 Vercel

本指南将帮助你将 VOC 项目通过 GitHub 部署到 Vercel 平台。

## 1. 准备工作（已完成）

我们已经为你完成了以下代码层面的准备：
- [x] 添加 `vercel.json` 配置文件，用于告诉 Vercel 如何构建和运行 Express 服务。
- [x] 更新 `package.json`，添加了 `"start": "node server.js"` 启动脚本。
- [x] 检查 `.gitignore`，确保 `.env` 和 `node_modules` 不会被上传。

## 2. 推送代码到 GitHub

如果你还没有将代码上传到 GitHub，请按照以下步骤操作：

1.  **在 GitHub 上创建新仓库**：
    *   登录 [GitHub](https://github.com)。
    *   点击右上角的 **+** 号 -> **New repository**。
    *   输入仓库名称（例如 `voc-app`），保持 Public 或 Private 均可。
    *   **不要**勾选 "Initialize this repository with a README/gitignore/license"（因为我们本地已经有了）。
    *   点击 **Create repository**。

2.  **在本地终端推送代码**：
    打开终端（Terminal），在项目根目录下运行以下命令（替换 `<你的GitHub用户名>` 和 `<仓库名>`）：

    ```bash
    # 初始化 git（如果尚未初始化）
    git init

    # 添加所有文件
    git add .

    # 提交更改
    git commit -m "Initial commit for Vercel deployment"

    # 关联远程仓库
    git remote add origin https://github.com/<你的GitHub用户名>/<仓库名>.git

    # 推送代码
    git push -u origin main
    ```
    *(如果你的默认分支是 master，请将最后一行改为 `git push -u origin master`)*

## 3. 在 Vercel 上部署

1.  **登录 Vercel**：
    *   访问 [Vercel](https://vercel.com) 并登录（推荐使用 GitHub 账号登录）。

2.  **导入项目**：
    *   在 Dashboard 点击 **Add New ...** -> **Project**。
    *   在 **Import Git Repository** 列表中找到刚才创建的 `voc-app` 仓库，点击 **Import**。

3.  **配置项目**：
    *   **Framework Preset**: Vercel 会自动识别，通常选择 **Other** 即可（因为我们使用了 `vercel.json`）。
    *   **Root Directory**: 保持默认 `./`。
    *   **Environment Variables** (关键步骤)：
        展开此选项，添加你在 `.env` 文件中使用的环境变量：
        *   **Name**: `ARK_API_KEY`  **Value**: 你的火山引擎 API Key
        *   **Name**: `ARK_MODEL_ID` **Value**: 你的火山引擎模型 ID (Endpoint ID)
        *   点击 **Add** 添加每一项。

4.  **开始部署**：
    *   点击 **Deploy** 按钮。
    *   等待约 1-2 分钟，Vercel 会自动构建并部署项目。

5.  **访问项目**：
    *   部署完成后，屏幕上会显示 **Congratulations!**。
    *   点击生成的预览图或域名（例如 `https://voc-app.vercel.app`）即可访问你的应用。

## 4. 后续更新

以后每次你在本地修改代码并推送到 GitHub (`git push`)，Vercel 会自动检测并触发新的部署。
