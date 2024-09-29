import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import OpenAI from "openai";

dotenv.config({ path: '../.env' });
const configuration =
    {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL:'https://api.g4f.icu/v1'
    }
const CLIENTPATH = 'http://localhost:5173'

const openai = new OpenAI(configuration);

const app = new express();

/**
 * cors 中间件 默认给配置了，
 * const corsOptions = {
 *     origin: 'https://yourdomain.com', // 只允许特定域名访问
 *     methods: ['GET', 'POST'], // 只允许 GET 和 POST 方法
 *     allowedHeaders: ['Content-Type', 'Authorization'], // 只允许特定请求头
 *     credentials: true // 如果需要支持跨域发送 Cookie
 * };
 *
 * app.use(cors(corsOptions));
 */
const corsOptions = {
    origin: CLIENTPATH, // 只允许特定域名访问
    methods: ['GET', 'POST'], // 只允许 GET 和 POST 方法
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Connection'], // 只允许特定请求头
    credentials: false // 如果需要支持跨域发送 Cookie
};
app.use(cors(corsOptions));
app.use(express.json())

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'visiting get root path'
    })
})

app.post('/', async (req,res) => {
    try {
        const prompt = req.body.prompt
        console.log('prompt' + prompt.toString())
        const completion = await openai.chat.completions.create({
            // model: "gpt-4o-mini",
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        res.status(200).send({
            bot: completion.choices[0].message.content
        })
    } catch(e) {
        console.log(e)
        res.status(500).send({e})
    }
})

let currentPrompt = ''; // 存储当前的 prompt

// 处理 POST 请求，接收 prompt
app.post('/stream', (req, res) => {
    currentPrompt = req.body.prompt;
    console.log('Received prompt:', currentPrompt);
    res.status(200).send({ message: 'Prompt received' });
});

// SSE 端点
app.get('/events', async (req, res) => {
    console.log('Received /events:', req);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // 立即发送头部数据给客户端，建立连接

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: currentPrompt,
                },
            ],
            stream: true, // 使用流模式
        });

        for await (const message of completion) {
            // 将每一个 delta 数据逐步发送给客户端
            if (message.choices[0].delta?.content) {
                const deltaContent = message.choices[0].delta.content;
                res.write(`data: ${JSON.stringify({ message: deltaContent })}\n\n`);
            }
        }

        // 发送结束标志
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end(); // 完成后结束响应
    } catch (error) {
        console.error('Error while streaming:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end(); // 发生错误时结束响应
    }

    // 清理资源
    req.on('close', () => {
        console.log('Client disconnected');
        res.end(); // 客户端断开连接时结束响应
    });
});

app.listen(5174, ()=> {console.log('running on localhost 5174 http://localhost:5174')})