import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config({ path: '../.env' });


const configuration =
    {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL:'https://api.g4f.icu/v1'
    }

const openai = new OpenAI(configuration);

const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
            role: "user",
            content: "Write a haiku about recursion in programming.",
        },
    ],
});

console.log(completion.choices[0].message);