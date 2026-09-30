import { GoogleGenAI } from '@google/genai';

export async function extractImageContent(fileBase64: string, mimeType: string): Promise<string | null> {
    if (process.env.ENABLE_GEMINI_VISION !== 'true' || !process.env.GEMINI_API_KEY) {
        return null; // Disabled or no key
    }

    const prompt = "Output ONLY a factual description of visible content: error messages, dialog text, service/UI names, timestamps, visible values. No interpretation, no root-cause guessing, no suggested fixes.";
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        let response = null;
        // Retry up to 3 times to handle temporary 503 overload errors gracefully
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const responsePromise = ai.models.generateContent({
                    model: 'gemini-3.5-flash',
                    contents: [
                        prompt,
                        { inlineData: { mimeType: mimeType, data: fileBase64 } }
                    ]
                });

                const timeoutPromise = new Promise<null>((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 30000)
                );

                response = await Promise.race([responsePromise, timeoutPromise]) as any;
                break; // Break the loop on success
            } catch (err: any) {
                if (attempt === 3) throw err; // Throw on final attempt to trigger fallback
                console.log(`Gemini extraction attempt ${attempt} failed (likely 503 load spike), retrying in 1s...`, err.message || err);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (response && response.text) {
            return `[Attached image extraction]:\n${response.text.trim()}`;
        }
        return '[Attached image extraction]:\n(Image extraction returned empty. Acknowledge that the user attached an image but you cannot see the contents.)';
    } catch (e: any) {
        // Use console.log instead of console.error to avoid Next.js triggering a disruptive dev overlay
        console.log('Gemini image extraction permanently failed using @google/genai:', e.message || e);
        return '[Attached image extraction]:\n(Image extraction failed due to an API error. Acknowledge that the user attached an image but you cannot see the contents.)'; 
    }
}
