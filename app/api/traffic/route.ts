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
      // Return enhanced mock traffic data when API key is not configured
      const trafficLevels = ['Light', 'Moderate', 'Heavy', 'Severe'];
      const randomLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)];
      const randomDelay = Math.floor(Math.random() * 25) + 1;
      const confidence = Math.floor(Math.random() * 30) + 70; // 70-100% confidence
      
      return NextResponse.json({ 
        trafficLevel: randomLevel, 
        travelDelayMinutes: randomDelay,
        confidence: confidence,
        lastUpdated: new Date().toISOString(),
        source: 'mock'
      });
    }

    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${apiKey}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`TomTom API request failed with status: ${response.status}`, errorBody);
        
        // Fallback to mock data on API failure
        const trafficLevels = ['Light', 'Moderate', 'Heavy'];
        const randomLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)];
        const randomDelay = Math.floor(Math.random() * 15) + 1;
        
        return NextResponse.json({ 
          trafficLevel: randomLevel, 
          travelDelayMinutes: randomDelay,
          confidence: 50,
          lastUpdated: new Date().toISOString(),
          source: 'fallback'
        });
      }

      const data = await response.json();
      const flowData = data.flowSegmentData;

      if (!flowData) {
        return NextResponse.json({ 
          trafficLevel: 'No Data', 
          travelDelayMinutes: 0,
          confidence: 0,
          lastUpdated: new Date().toISOString(),
          source: 'tomtom'
        });
      }

      const freeFlowSpeed = flowData.freeFlowSpeed;
      const currentSpeed = flowData.currentSpeed;
      const confidence = flowData.confidence || 85;
      
      let trafficLevel = 'Light';
      let severity = 1;
      
      if (currentSpeed < freeFlowSpeed * 0.3) {
        trafficLevel = 'Severe';
        severity = 4;
      } else if (currentSpeed < freeFlowSpeed * 0.5) {
        trafficLevel = 'Heavy';
        severity = 3;
      } else if (currentSpeed < freeFlowSpeed * 0.7) {
        trafficLevel = 'Moderate';
        severity = 2;
      }
      
      const travelTime = flowData.length / currentSpeed;
      const freeFlowTime = flowData.length / freeFlowSpeed;
      const delaySeconds = travelTime - freeFlowTime;
      const travelDelayMinutes = Math.round(delaySeconds / 60);

      return NextResponse.json({
        trafficLevel,
        travelDelayMinutes: travelDelayMinutes > 0 ? travelDelayMinutes : 0,
        confidence: Math.round(confidence),
        severity,
        currentSpeed: Math.round(currentSpeed),
        freeFlowSpeed: Math.round(freeFlowSpeed),
        lastUpdated: new Date().toISOString(),
        source: 'tomtom'
      });

    } catch (error: any) {
      console.error('Internal server error in traffic API route:', error);
      
      // Fallback to mock data on error
      const trafficLevels = ['Light', 'Moderate', 'Heavy'];
      const randomLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)];
      const randomDelay = Math.floor(Math.random() * 15) + 1;
      
      return NextResponse.json({ 
        trafficLevel: randomLevel, 
        travelDelayMinutes: randomDelay,
        confidence: 30,
        lastUpdated: new Date().toISOString(),
        source: 'fallback'
      });
    }
  } catch (error: any) {
    console.error('Traffic API error:', error);
    return NextResponse.json({ 
      trafficLevel: 'Unknown', 
      travelDelayMinutes: 0,
      confidence: 0,
      lastUpdated: new Date().toISOString(),
      source: 'error'
    });
  }
}