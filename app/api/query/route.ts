import { NextRequest, NextResponse } from 'next/server';

const getFallbackResponse = (query: string, context: any) => {
  const lowerCaseQuery = query.toLowerCase();
  
  // Context-aware fallback responses
  const timeContext = context.timeOfDay || 'day';
  const locationContext = context.location || 'city';
  const duration = context.duration || 15;
  const traffic = context.traffic || 'Unknown';
  const weather = context.weather || 'Unknown';
  
  if (lowerCaseQuery.includes('news')) {
    return { 
      type: 'Fallback', 
      message: `For your ${duration}-minute ${timeContext} drive, I recommend checking a 2-minute news roundup. Given the ${traffic} traffic conditions, this will keep you informed without distraction.` 
    };
  }
  
  if (lowerCaseQuery.includes('weather')) {
    return { 
      type: 'Fallback', 
      message: `Current weather shows ${weather}. For your ${locationContext} drive, consider adjusting your route or timing based on these conditions.` 
    };
  }
  
  if (lowerCaseQuery.includes('music') || lowerCaseQuery.includes('podcast')) {
    return { 
      type: 'Fallback', 
      message: `For your ${duration}-minute ${timeContext} drive, I suggest a curated playlist or podcast. Given the ${traffic} traffic, something engaging will help pass the time safely.` 
    };
  }
  
  if (lowerCaseQuery.includes('traffic')) {
    return { 
      type: 'Fallback', 
      message: `Current traffic is ${traffic}. For your ${locationContext} route, consider alternative paths or adjusting your departure time to avoid delays.` 
    };
  }
  
  return { 
    type: 'Fallback', 
    message: `For your ${duration}-minute ${timeContext} drive in ${locationContext} with ${traffic} traffic, I recommend staying focused on the road and using hands-free features for any assistance you need.` 
  };
};

async function queryHuggingFace(prompt: string, context: any) {
  const token = process.env.HUGGING_FACE_API_TOKEN;
  
  if (!token) {
    // Enhanced mock response when API key is not configured
    const timeContext = context.timeOfDay || 'day';
    const locationContext = context.location || 'city';
    const duration = context.duration || 15;
    const traffic = context.traffic || 'Unknown';
    const weather = context.weather || 'Unknown';
    
    const contextualResponses = [
      `For your ${duration}-minute ${timeContext} drive in ${locationContext}, I recommend starting with a quick traffic check. Given the ${traffic} conditions and ${weather} weather, consider these options:\n\n🎵 Music: Try a ${duration}-minute playlist or podcast\n📱 Navigation: Use real-time traffic updates\n☕ Break: Plan a quick stop if needed\n\nStay safe and enjoy your journey!`,
      
      `Based on your ${timeContext} ${locationContext} drive with ${traffic} traffic, here are my suggestions:\n\n🚗 Route: Check for alternative paths\n🎧 Audio: ${duration}-minute podcast or music\n📊 Weather: Current conditions show ${weather}\n⏰ Timing: Consider traffic patterns\n\nDrive safely!`,
      
      `For your ${duration}-minute journey in ${locationContext} during ${timeContext} with ${traffic} traffic:\n\n🗺️ Navigation: Use live traffic data\n🎵 Entertainment: Curated ${duration}-min playlist\n🌤️ Weather: ${weather} conditions noted\n⛽ Fuel: Check levels before departure\n\nHave a great trip!`
    ];
    
    return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
  }

  const TIMEOUT_DURATION = 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'InfotainmentCoPilot/1.0'
        },
        method: "POST",
        body: JSON.stringify({ 
          inputs: prompt, 
          parameters: { 
            max_new_tokens: 300, 
            return_full_text: false,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true
          } 
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API Error:', response.status, errorText);
      
      if (errorText.includes("is currently loading")) {
        throw new Error("The AI model is starting up. Please try again in 30 seconds.");
      }
      if (response.status === 429) {
        throw new Error("AI service is temporarily busy. Please try again in a moment.");
      }
      if (response.status === 401) {
        throw new Error("AI service authentication failed. Please check configuration.");
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result || !Array.isArray(result) || !result[0]?.generated_text) {
      throw new Error("Invalid response from AI service");
    }
    
    return result[0].generated_text.trim();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('The AI request timed out. The service may be busy.');
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Create a comprehensive prompt for the AI
    const timeContext = context.timeOfDay || 'day';
    const locationContext = context.location || 'city';
    const duration = context.duration || 15;
    const traffic = context.traffic || 'Unknown';
    const weather = context.weather || 'Unknown';
    const delay = context.delay || 0;

    const systemPrompt = `You are an intelligent driving assistant for a ${duration}-minute ${timeContext} trip in ${locationContext}. 
Current conditions: Traffic is ${traffic}${delay > 0 ? ` with ${delay} minute delay` : ''}, Weather is ${weather}.
User query: "${query}"

Provide helpful, concise, and safe driving advice. Focus on practical suggestions that enhance the driving experience while maintaining safety. Keep responses under 200 words and include relevant emojis.`;

    try {
      const aiResponse = await queryHuggingFace(systemPrompt, context);
      
      return NextResponse.json({
        response: { 
          type: 'AI_Response', 
          message: aiResponse, 
          query,
          context: {
            timeOfDay: timeContext,
            location: locationContext,
            duration,
            traffic,
            weather,
            delay
          }
        }
      });

    } catch (aiError: any) {
      console.error('AI Service failed:', aiError.message);
      
      // Use context-aware fallback
      const fallback = getFallbackResponse(query, context);
      return NextResponse.json({ 
        response: fallback,
        error: aiError.message 
      });
    }

  } catch (error: any) {
    console.error('Query handler failed:', error.message);
    
    const fallback = getFallbackResponse("general query", {});
    return NextResponse.json({ 
      response: fallback,
      error: error.message 
    });
  }
}
