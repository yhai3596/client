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
你是一个资深的销售心理学家和朋友圈客户画像分析专家。你的任务是根据用户提供的多张朋友圈截图，深入分析潜在客户的画像。

请基于视觉内容（场景、物品、文字、活动等）进行推理，并以严格的JSON格式输出分析报告。

输出的JSON必须包含以下结构：
{
    "coreInsight": "一段精炼的核心洞察总结（200字以内），包含客户核心痛点、决策风格及销售机会点。",
    "dimensions": {
        "basicInfo": {
            "title": "基础信息",
            "items": [
                { "label": "性别", "value": "推测性别" },
                { "label": "年龄段", "value": "推测年龄段" },
                { "label": "家庭状况", "value": "单身/已婚/有孩/养宠等" },
                { "label": "职业背景", "value": "推测职业" }
            ]
        },
        "interests": {
            "title": "兴趣爱好",
            "items": [
                { "label": "运动", "value": "健身/跑步/高尔夫等" },
                { "label": "休闲", "value": "旅游/美食/阅读/电影等" },
                { "label": "审美偏好", "value": "时尚/极简/复古等" }
            ]
        },
        "personality": {
            "title": "性格特征",
            "items": [
                { "label": "性格倾向", "value": "外向/内向、感性/理性" },
                { "label": "情绪特征", "value": "乐观/焦虑/平稳" }
            ]
        },
        "psychology": {
            "title": "心理画像",
            "items": [
                { "label": "核心驱动力", "value": "成就/安全/归属/自主等" },
                { "label": "决策风格", "value": "冲动/理智/从众/权威导向" },
                { "label": "期望形象", "value": "希望在他人眼中展现的形象" },
                { "label": "关键痛点", "value": "生活或工作中的主要困扰" }
            ]
        },
        "consumption": {
            "title": "消费分析",
            "items": [
                { "label": "经济实力", "value": "评估收入水平及消费层级" },
                { "label": "消费习惯", "value": "注重品质/性价比/品牌/体验" },
                { "label": "决策因素", "value": "影响购买的关键因素" },
                { "label": "价格策略", "value": "对价格的敏感度及接受范围" }
            ]
        },
        "riskOpportunity": {
            "title": "风险机会",
            "items": [
                { "label": "价值评估", "value": "高/中/低（附理由）" },
                { "label": "成交概率", "value": "百分比或高低描述" },
                { "label": "潜在异议", "value": "可能提出的拒绝理由" },
                { "label": "最佳时机", "value": "切入销售的最佳时间点" }
            ]
        },
        "social": {
            "title": "社交影响",
            "items": [
                { "label": "社交圈层", "value": "所处的社会阶层或群体" },
                { "label": "影响力", "value": "在圈子中的意见领袖程度" },
                { "label": "人脉价值", "value": "能否带来转介绍或资源" }
            ]
        },
        "strategy": {
            "title": "销售策略",
            "items": [
                { "label": "沟通风格", "value": "建议的沟通语气和方式" },
                { "label": "接触方式", "value": "微信/电话/面谈等建议" },
                { "label": "产品推荐", "value": "基于画像推荐的产品类型" },
                { "label": "行动计划", "value": "立即/短期/长期的跟进动作" }
            ]
        }
    }
}

请确保所有字段都有值，如果是推测的请基于图片线索进行合理推断。
`;

// Mock Data for demonstration when API is not configured
const MOCK_ANALYSIS_RESULT = {
    coreInsight: "（演示数据）客户为职场技术人，核心需求是解决工具使用痛点、提升技术能力及摆脱当前工作不满。决策理性，关注产品实用性与价值，经济实力中等偏上。销售机会点在于通过解决即时工具问题建立信任，推荐技术工具、学习资源或职场提升产品。",
    dimensions: {
        basicInfo: {
            title: "基础信息",
            items: [
                { label: "性别", value: "男" },
                { label: "年龄段", value: "25-30岁" },
                { label: "家庭状况", value: "单身" },
                { label: "职业背景", value: "互联网/技术开发" }
            ]
        },
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
