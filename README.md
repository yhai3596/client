# VOC - 朋友圈客户画像分析助手

## 📖 项目简介
VOC (Voice of Customer) 是一款基于**火山引擎豆包大模型 (Doubao LLM)** 的智能销售辅助工具。旨在帮助销售人员通过分析客户的朋友圈截图，快速生成多维度的客户画像报告及实操性极强的销售建议，从而提升销售效率和转化率。

### 核心价值
- **精准画像**：透过朋友圈生活点滴，还原客户的职业身份、性格特征及消费层级。
- **深度洞察**：分析客户深层心理痛点与核心欲望，挖掘潜在成交机会。
- **实操策略**：提供“金牌销售”级别的具体沟通话术、破冰开场白及异议处理技巧。

## ✨ 功能特点
1.  **多模态分析**：支持上传多张朋友圈截图（建议5张以上），结合补充文本信息进行综合分析。
2.  **结构化报告**：
    -   **核心洞察**：一针见血的客户价值评估。
    -   **兴趣与性格**：MBTI倾向、情绪底色、审美偏好。
    -   **心理与消费**：决策逻辑、资产评估、买单理由。
    -   **销售策略**：包含具体的破冰话术、产品推荐及跟进节奏。
3.  **隐私安全**：图片仅用于实时分析，不进行永久存储。
4.  **演示模式**：未配置 API Key 时自动降级为演示模式，方便快速体验 UI 交互。

## 🛠 技术栈
- **前端**：HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **后端**：Node.js, Express
- **AI模型**：火山引擎豆包大模型 (Doubao-Vision-Pro)
- **部署**：支持 Vercel 一键部署

## 🚀 快速开始 (本地开发)

### 1. 克隆项目
```bash
git clone <你的仓库地址>
cd voc-app
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在项目根目录创建一个 `.env` 文件，并填入你的火山引擎 API 配置：
```env
# 火山引擎 API Key
ARK_API_KEY=your_ark_api_key_here

# 火山引擎模型接入点 ID (Endpoint ID)
ARK_MODEL_ID=your_endpoint_id_here
```
> 💡 提示：如果没有配置 Key，项目将以“演示模式”运行，返回模拟数据。

### 4. 启动服务
```bash
npm start
```
访问 `http://localhost:3000` 即可使用。

## ☁️ 部署指南 (Vercel)

本项目已针对 Vercel 进行了配置，可实现零成本一键部署。

### 步骤 1：准备 GitHub 仓库
1. 在 GitHub 上创建一个新的空仓库。
2. 将本地代码推送到仓库：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

### 步骤 2：导入 Vercel
1. 登录 [Vercel](https://vercel.com)。
2. 点击 **Add New...** -> **Project**。
3. 选择 **Import** 刚刚创建的 GitHub 仓库。

### 步骤 3：配置环境变量 (重要)
在 Vercel 部署页面的 **Environment Variables** 区域，添加以下变量：
- `ARK_API_KEY`: 你的火山引擎 API Key
- `ARK_MODEL_ID`: 你的模型接入点 ID

### 步骤 4：完成部署
点击 **Deploy**，等待约 1 分钟即可访问你的线上应用。

---
**License**: ISC
