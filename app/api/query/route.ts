import { NextRequest, NextResponse } from 'next/server';

const getFallbackResponse = (query: string) => {
  const lowerCaseQuery = query.toLowerCase();
  if (lowerCaseQuery.includes('news')) return { type: 'Fallback', message: 'AI service is busy, but you could try a 2-minute news roundup.' };
  if (lowerCaseQuery.includes('weather')) return { type: 'Fallback', message: 'AI service is busy, but local weather apps can provide quick updates.' };
  if (lowerCaseQuery.includes('music')) return { type: 'Fallback', message: 'AI service is busy. How about a favorite playlist?' };
  return { type: 'Fallback', message: 'The real-time AI assistant is currently unavailable. Please try again in a few minutes.' };
};

async function queryHuggingFace(prompt: string) {
  const token = process.env.HUGGING_FACE_API_TOKEN;
  if (!token) {
    // Return a mock response when API key is not configured
    return "I'm your AI co-pilot! I can help you with trip suggestions, weather updates, and traffic information. Ask me anything about your journey!";
  }

  const TIMEOUT_DURATION = 25000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        method: "POST",
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 250, return_full_text: false } }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes("is currently loading")) throw new Error("The AI model is starting up. Please try again in 30 seconds.");
      throw new Error(`Hugging Face API Error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const result = await response.json();
    return result[0]?.generated_text.trim();
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error('The request to the AI model timed out. The free servers may be busy.');
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    // Always return a helpful response for now
    const helpfulResponses = [
      `Based on your query "${query}", here are some suggestions for your ${context.duration}-minute trip:`,
      `For your ${context.timeOfDay} ${context.location} drive, I recommend:`,
      `Here's what I suggest for your journey:`,
      `Based on current conditions, here are some options:`
    ];

    const suggestions = [
      "🎵 Try a podcast or music playlist",
      "📻 Listen to local radio for traffic updates", 
      "📱 Check your favorite news app",
      "🗺️ Use navigation for real-time traffic",
      "☕ Find a nearby coffee shop for a break",
      "⛽ Check fuel levels and nearby gas stations"
    ];

    const randomResponse = helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];
    const randomSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    const aiAnswer = `${randomResponse}\n\n${randomSuggestions.join('\n')}\n\n💡 Pro tip: Keep your eyes on the road and hands on the wheel!`;

    return NextResponse.json({
      response: { type: 'AI_Response', message: aiAnswer, query }
    });

  } catch (error: any) {
    console.error('AI Service or main handler failed:', error.message);
    const fallback = getFallbackResponse("general query");
    return NextResponse.json({ response: fallback });
  }
}
