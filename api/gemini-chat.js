import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const API_KEY = process.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Missing VITE_GEMINI_API_KEY on server' });
    }

    try {
        const { systemPrompt, userPrompt } = req.body;

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        const fullPrompt = `${systemPrompt}\n\nUser Query:\n${userPrompt}`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Try to parse as JSON for auto-fetch, otherwise return raw text
        try {
            const jsonData = JSON.parse(text);
            return res.status(200).json(jsonData);
        } catch {
            // For illustration prompts, return as object with text field
            return res.status(200).json({ text });
        }
    } catch (error) {
        console.error('Gemini proxy error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
