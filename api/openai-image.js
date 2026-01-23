import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const API_KEY = process.env.VITE_OPENAI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Missing VITE_OPENAI_API_KEY on server' });
    }

    try {
        const { prompt, size, quality } = req.body;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size: size || '1024x1024',
                quality: quality || 'standard',
                response_format: 'url'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ error: error.error?.message || 'OpenAI Image API Error' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('OpenAI image proxy error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
