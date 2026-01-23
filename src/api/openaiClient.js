import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

const SYSTEM_PROMPT = `
You remain a helpful assistant that outputs strictly JSON. 
You are an expert encyclopedia of Movies, TV Series, and Books.
Your task is to fetch accurate details for the given title.
Respond with a JSON object matching this schema:
{
  "title": "Exact Title",
  "year": "YYYY",
  "age_restriction": "Rating (e.g. PG-13, R, TV-MA)",
  "runtime_minutes": "number (for movies)",
  "total_pages": "number (for books)",
  "seasons_count": "number (for series)",
  "genre": ["Array", "Of", "Genres"],
  "description": "Short summary",
  "actors": ["Array", "Of", "Main", "Actors"],
  "author": "Author Name (for books)",
  "poster_url": "Valid HTTP URL to a poster image if known, otherwise null",
  "platform": "Common streaming platform or publisher",
  "release_date": "YYYY-MM-DD"
}
`;

/**
 * Fetch details for a Movie, Series, or Book using Gemini.
 * @param {string} title 
 * @param {'movie'|'series'|'book'} type 
 * @param {string} language 
 */
export async function fetchMediaDetails(title, type, language = 'English') {
    const userPrompt = `
    Find details for the ${type}: "${title}".
    Language: ${language}.
    If there are multiple matches, pick the most popular/canonical one.
    Ensure "type" match is strict (do not return a movie if asked for a book, unless it is the only adaptation, but prefer the original).
  `;

    try {
        const response = await fetch("/api/gemini-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: SYSTEM_PROMPT,
                userPrompt
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Gemini API Error");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("fetchMediaDetails failed:", error);
        throw error;
    }
}

/**
 * Generate a creative prompt for image generation using Gemini.
 * @param {string} bookTitle 
 * @param {number} pageNumber 
 * @param {string} pageText 
 */
export async function generateIllustrationPrompt(bookTitle, pageNumber, pageText = "") {
    const prompt = `
    You are an expert book illustrator.
    Context:
    Book Title: "${bookTitle}"
    Page Number: ${pageNumber}
    ${pageText ? `Page Text excerpt: "${pageText}"` : "Imagine a scene fitting for this page."}

    Task:
    Create a detailed, atmospheric, visual description for an illustration of this page.
    Style: Vintage, etching, 19th-century classic literature style, black and white or sepia, high contrast, woodcut.
    
    Constraint: 
    Respond with ONLY the visual description string. Do not include quotes.
    Keep it under 50 words.
  `;

    try {
        const response = await fetch("/api/gemini-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: "You are a creative assistant focused on visual descriptions for book illustrations.",
                userPrompt: prompt
            })
        });

        if (!response.ok) throw new Error("Gemini Chat Error");
        const data = await response.json();
        return data.text || data.response;
    } catch (error) {
        console.error("generateIllustrationPrompt failed:", error);
        throw error;
    }
}

/**
 * Generate an image using Pollinations.ai (free service, no API key needed)
 * @param {string} prompt 
 */
export async function generateImage(prompt) {
    try {
        // Enhance prompt for vintage book illustration style
        const enhancedPrompt = `${prompt}. Style: vintage etching, ink drawing, woodcut, black and white, highly detailed, masterpiece.`;

        // Pollinations.ai - free image generation, no API key required
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true`;

        // Return the direct URL (Pollinations generates on-demand)
        return { url };
    } catch (error) {
        console.error("generateImage failed:", error);
        throw error;
    }
}
