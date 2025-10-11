import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const apiKey = process.env.TOMTOM_API_KEY;
    
    if (!apiKey) {
      // Return mock traffic data when API key is not configured
      const trafficLevels = ['Light', 'Moderate', 'Heavy'];
      const randomLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)];
      const randomDelay = Math.floor(Math.random() * 15) + 1;
      
      return NextResponse.json({ 
        trafficLevel: randomLevel, 
        travelDelayMinutes: randomDelay 
      });
    }

    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${apiKey}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`TomTom API request failed with status: ${response.status}`, errorBody);
        return NextResponse.json({ error: 'Failed to retrieve data from TomTom API.' }, { status: response.status });
      }

      const data = await response.json();
      const flowData = data.flowSegmentData;

      if (!flowData) {
        return NextResponse.json({ trafficLevel: 'No Data', travelDelayMinutes: 0 });
      }

      const freeFlowSpeed = flowData.freeFlowSpeed;
      const currentSpeed = flowData.currentSpeed;
      
      let trafficLevel = 'Light';
      if (currentSpeed < freeFlowSpeed * 0.4) trafficLevel = 'Heavy';
      else if (currentSpeed < freeFlowSpeed * 0.7) trafficLevel = 'Moderate';
      
      const travelTime = flowData.length / currentSpeed;
      const freeFlowTime = flowData.length / freeFlowSpeed;
      const delaySeconds = travelTime - freeFlowTime;
      const travelDelayMinutes = Math.round(delaySeconds / 60);

      return NextResponse.json({
        trafficLevel,
        travelDelayMinutes: travelDelayMinutes > 0 ? travelDelayMinutes : 0,
      });

    } catch (error: any) {
      console.error('Internal server error in traffic API route:', error);
      return NextResponse.json({ error: 'Internal server error fetching traffic data' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Traffic API error:', error);
    return NextResponse.json({ 
      trafficLevel: 'Unknown', 
      travelDelayMinutes: 0 
    });
  }
}