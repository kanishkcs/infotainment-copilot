import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  // Return mock traffic data
  const trafficLevels = ['Light', 'Moderate', 'Heavy'];
  const randomLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)];
  const randomDelay = Math.floor(Math.random() * 15) + 1;
  
  return NextResponse.json({ 
    trafficLevel: randomLevel, 
    travelDelayMinutes: randomDelay 
  });
}
