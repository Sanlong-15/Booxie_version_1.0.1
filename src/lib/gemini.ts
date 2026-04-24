import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiAI(): GoogleGenAI | null {
  if (!aiInstance) {
    // Try to get API key from process.env (Vite define) or import.meta.env
    let apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                   (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                   (import.meta as any).env?.GEMINI_API_KEY;
                   
    // If key is missing or invalid, use the hardcoded fallback
    if (!apiKey || apiKey === 'undefined' || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
      apiKey = process.env.GEMINI_API_KEY;
    }
    
    if (!apiKey) return null;
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

/**
 * Executes a Gemini AI call with exponential backoff for transient errors (503 High Demand).
 */
export async function callGeminiWithRetry<T = any>(
  fn: () => Promise<T>,
  retries = 5,
  initialDelay = 1200
): Promise<T> {
  let attempt = 0;
  
  while (true) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 35000)
      );
      
      const result = await Promise.race([fn(), timeoutPromise]) as T;
      return result;
    } catch (err: any) {
      // Direct stringification for robust error checking
      const errStr = JSON.stringify(err).toLowerCase();
      const isTransient = 
        err?.status === 'UNAVAILABLE' || 
        err?.message?.includes('503') || 
        err?.message?.includes('high demand') || 
        errStr.includes('503') ||
        errStr.includes('unavailable') ||
        err?.status === 'INTERNAL' ||
        err?.message === 'AI_TIMEOUT';
        
      if (isTransient && attempt < retries) {
        attempt++;
        // Slightly more aggressive jittered backoff to handle spikes
        const delay = Math.pow(1.8, attempt) * initialDelay + (Math.random() * 500);
        console.warn(`Gemini Load spike (Attempt ${attempt}/${retries}). Waiting ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      throw err;
    }
  }
}
