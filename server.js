const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client for Volcengine Ark
const client = new OpenAI({
    apiKey: process.env.ARK_API_KEY,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// System Prompt for Customer Persona Analysis
const SYSTEM_PROMPT = `
你是具备非凡洞察力的**金牌销售导师**和**商业心理学家**。你的特长是透过朋友圈的蛛丝马迹，精准还原一个人的生活状态、消费层级，并制定极具杀伤力的销售战术。

**你的分析风格：**
1.  **拒绝废话**：不要堆砌“性格开朗”、“热爱生活”这种通用词。要说“可能是刚买了房压力大的中产”、“正在备考的焦虑职场人”。
2.  **大胆推测（仅限心理与消费）**：在性格、心理、消费能力、痛点等维度，则需要你发挥洞察力，进行大胆的推理和估算。这部分**内容越详细越好**，不要吝啬字数。
3.  **结构化输出**：如果某个维度的分析包含多个要点（如消费习惯有3点），请使用HTML换行标签 <br> 或分号进行分隔，确保前端展示时清晰易读。
4.  **落地实操**：销售策略必须包含**具体的沟通话术（带引号）**，就像你直接教销售人员怎么发微信一样。
5.  **深度心理**：分析客户的“恐惧”和“贪婪”，利用价格锚点、互惠原理等心理学技巧。

你的任务是根据用户提供的朋友圈截图及补充信息，输出一份严格的JSON格式报告。

**输出JSON结构要求（必须完全包含以下字段）：**
{
    "coreInsight": "（200字以内）核心洞察。必须包含：具体的职业/身份推测、核心痛点（他现在最烦什么）、具体的经济实力评估（给出数字范围）、以及最直接的成交机会点。",
    "dimensions": {
        "interests": {
            "title": "兴趣爱好",
            "items": [
                { "label": "高频活动", "value": "从图片中提取的具体活动（如夜跑、露营、烘焙）" },
                { "label": "内容偏好", "value": "关注的话题（如搞钱、育儿、美妆成分分析）" },
                { "label": "审美风格", "value": "具体的风格描述（如极简风、多巴胺穿搭、新中式）" }
            ]
        },
        "personality": {
            "title": "性格特征",
            "items": [
                { "label": "MBTI倾向", "value": "推测E/I或J/P倾向（如：ESTJ-执行力强的管家）" },
                { "label": "情绪底色", "value": "焦虑/松弛/鸡血/佛系（附带简要说明）" }
            ]
        },
        "psychology": {
            "title": "心理画像",
            "items": [
                { "label": "核心欲望", "value": "他最想要什么？（多点请用<br>换行，如：1. 被认可<br>2. 省时间）" },
                { "label": "决策逻辑", "value": "感性冲动 vs 数据考据 vs 熟人推荐" },
                { "label": "社交面具", "value": "他希望别人觉得他是什么样的人？" },
                { "label": "深层痛点", "value": "目前生活中最大的麻烦或焦虑源（多点请用<br>换行）" }
            ]
        },
        "consumption": {
            "title": "消费分析",
            "items": [
                { "label": "资产评估", "value": "估算月薪/年薪范围（如：年薪30w-50w）" },
                { "label": "消费分层", "value": "如：Lululemon女孩 / 拼多多实用党 / 轻奢入门" },
                { "label": "买单理由", "value": "什么能让他立刻掏钱？（如：颜值、稀缺性、占便宜）" },
                { "label": "价格敏感度", "value": "对价格的真实态度及对策" }
            ]
        },
        "riskOpportunity": {
            "title": "风险机会",
            "items": [
                { "label": "客户价值", "value": "S/A/B/C级（给出理由）" },
                { "label": "成交概率", "value": "具体的百分比（如85%）" },
                { "label": "潜在雷区", "value": "千万不能说的话或触碰的禁忌（多点请用<br>换行）" },
                { "label": "最佳时机", "value": "具体的时间段（如：周五晚上、发薪日后）" }
            ]
        },
        "social": {
            "title": "社交影响",
            "items": [
                { "label": "圈层定位", "value": "所在的具体圈子（如：海淀妈妈群、金融搞钱圈）" },
                { "label": "人脉价值", "value": "是否有转介绍潜力" }
            ]
        },
        "strategy": {
            "title": "销售策略",
            "items": [
                { "label": "沟通调性", "value": "建议的语态（如：像老大哥一样建议 / 像迷妹一样夸赞）" },
                { "label": "破冰话术", "value": "给出一句具体的开场白，带引号（如：“我看你最近去了...，我也...”）" },
                { "label": "产品推荐", "value": "针对性的产品组合建议（多点请用<br>换行）" },
                { "label": "定价策略", "value": "如何报价？（如：运用价格锚点，先报高价再...）" },
                { "label": "关系推进", "value": "Step1: ...<br>Step2: ...<br>Step3: ..." },
                { "label": "异议处理", "value": "如果客户嫌贵/犹豫，该怎么回？（给出一句金句）" },
                { "label": "跟进计划", "value": "具体的追单节奏（24h/3天/7天）" },
                { "label": "行动指令", "value": "销售员看完报告后应立即做的第一件事" }
            ]
        }
    }
}
`;

// Mock Data for demonstration when API is not configured
const MOCK_ANALYSIS_RESULT = {
    coreInsight: "（演示数据）客户为职场技术人，核心需求是解决工具使用痛点、提升技术能力及摆脱当前工作不满。决策理性，关注产品实用性与价值，经济实力中等偏上。销售机会点在于通过解决即时工具问题建立信任，推荐技术工具、学习资源或职场提升产品。",
    dimensions: {
        interests: {
            title: "兴趣爱好",
            items: [
                { label: "运动", value: "健身、夜跑" },
                { label: "休闲", value: "阅读技术博客、科幻电影" },
                { label: "审美偏好", value: "极简科技风" }
            ]
        },
        personality: {
            title: "性格特征",
            items: [
                { label: "性格倾向", value: "理智、内向" },
                { label: "情绪特征", value: "平稳、偶有职场焦虑" }
            ]
        },
        psychology: {
            title: "心理画像",
            items: [
                { label: "核心驱动力", value: "自我实现、技术精进" },
                { label: "决策风格", value: "理智型，看重数据和逻辑" },
                { label: "期望形象", value: "专业、靠谱的技术专家" },
                { label: "关键痛点", value: "技术瓶颈、职业晋升受阻" }
            ]
        },
        consumption: {
            title: "消费分析",
            items: [
                { label: "经济实力", value: "中等偏上" },
                { label: "消费习惯", value: "注重品质与效能" },
                { label: "决策因素", value: "产品性能、用户口碑" },
                { label: "价格策略", value: "愿意为高价值工具付费" }
            ]
        },
        riskOpportunity: {
            title: "风险机会",
            items: [
                { label: "价值评估", value: "高（具有长期成长性）" },
                { label: "成交概率", value: "70%" },
                { label: "潜在异议", value: "价格过高、是否有更开源替代" },
                { label: "最佳时机", value: "工作日晚间或周末" }
            ]
        },
        social: {
            title: "社交影响",
            items: [
                { label: "社交圈层", value: "技术极客圈" },
                { label: "影响力", value: "小范围技术意见领袖" },
                { label: "人脉价值", value: "潜在的技术人才推荐源" }
            ]
        },
        strategy: {
            title: "销售策略",
            items: [
                { label: "沟通风格", value: "专业、直接、去套路化" },
                { label: "接触方式", value: "微信留言，避免电话打扰" },
                { label: "产品推荐", value: "高级开发工具订阅、技术大会门票" },
                { label: "行动计划", value: "发送相关技术白皮书作为破冰" }
            ]
        }
    }
};

// API Endpoint: Upload and Analyze
app.post('/api/analyze', upload.array('images', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '请至少上传一张图片' });
        }
        
        if (req.files.length < 5) {
             return res.status(400).json({ error: '根据要求，请至少上传5张图片以保证分析准确度。' });
        }

        console.log(`Received ${req.files.length} images for analysis.`);

        // Check if API Key is configured correctly
        const apiKey = process.env.ARK_API_KEY;
        const modelId = process.env.ARK_MODEL_ID;
        
        if (!apiKey || apiKey === 'your_ark_api_key_here' || !modelId || modelId === 'your_endpoint_id_here') {
            console.warn("⚠️  API Key or Model ID not configured. Falling back to MOCK data mode.");
            
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            return res.json({
                success: true,
                data: MOCK_ANALYSIS_RESULT,
                warning: "演示模式：由于未配置 API Key，当前显示为模拟数据。"
            });
        }

        // Prepare messages for Doubao Vision
        const content = [
            { type: "text", text: "这是客户的朋友圈截图，请分析这些图片，生成客户画像报告。" }
        ];

        // Add supplementary info if available
        if (req.body.supplementaryInfo) {
             content.push({ 
                type: "text", 
                text: `用户补充的客户背景信息：${req.body.supplementaryInfo}。请将此信息与图片内容结合进行综合分析。` 
            });
        }

        // Append images
        for (const file of req.files) {
            const base64Image = file.buffer.toString('base64');
            content.push({
                type: "image_url",
                image_url: {
                    url: `data:${file.mimetype};base64,${base64Image}`
                }
            });
        }

        console.log("Calling Doubao API...");
        
        const response = await client.chat.completions.create({
            model: process.env.ARK_MODEL_ID,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: content }
            ],
            response_format: { type: "json_object" } // Force JSON output if supported, otherwise prompt handles it
        });

        const analysisResult = JSON.parse(response.choices[0].message.content);
        
        console.log("Analysis complete.");

        res.json({
            success: true,
            data: analysisResult
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: '分析失败，请检查服务器日志或稍后重试。' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Ensure you have created a .env file with ARK_API_KEY and ARK_MODEL_ID`);
});
