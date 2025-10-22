import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  // Enhanced mock traffic data with more realistic patterns
  const trafficLevels = ['Light', 'Moderate', 'Heavy', 'Severe'];
  const randomLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)];
  
  // More realistic delay ranges based on traffic level
  let randomDelay;
  switch (randomLevel) {
    case 'Light':
      randomDelay = Math.floor(Math.random() * 3) + 1; // 1-3 minutes
      break;
    case 'Moderate':
      randomDelay = Math.floor(Math.random() * 8) + 3; // 3-10 minutes
      break;
    case 'Heavy':
      randomDelay = Math.floor(Math.random() * 15) + 8; // 8-22 minutes
      break;
    case 'Severe':
      randomDelay = Math.floor(Math.random() * 25) + 15; // 15-39 minutes
      break;
    default:
      randomDelay = Math.floor(Math.random() * 10) + 1;
  }
  
  const confidence = Math.floor(Math.random() * 20) + 80; // 80-100% confidence
  
  return NextResponse.json({ 
    trafficLevel: randomLevel, 
    travelDelayMinutes: randomDelay,
    confidence: confidence,
    lastUpdated: new Date().toISOString(),
    source: 'mock'
  });
}
