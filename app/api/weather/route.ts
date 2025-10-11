import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    // Return mock weather data when API key is not configured
    return NextResponse.json({
      weatherBrief: '22°C, Partly Cloudy',
      wind: 'Wind: 15 km/h',
      precipitation: 'Precipitation: 0 mm',
      aqi: 'AQI: 45 (Good)',
    });
  }

  try {
    const [weatherResponse, airPollutionResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
      fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    ]);

    if (!weatherResponse.ok || !airPollutionResponse.ok) {
      throw new Error('Failed to fetch data from OpenWeatherMap');
    }

    const weatherData = await weatherResponse.json();
    const airPollutionData = await airPollutionResponse.json();

    const aqi = airPollutionData.list[0].main.aqi;
    let aqiText = 'Good';
    if (aqi === 2) aqiText = 'Fair';
    if (aqi === 3) aqiText = 'Moderate';
    if (aqi === 4) aqiText = 'Poor';
    if (aqi === 5) aqiText = 'Very Poor';
    
    return NextResponse.json({
      weatherBrief: `${Math.round(weatherData.main.temp)}°C, ${weatherData.weather[0].main}`,
      wind: `Wind: ${Math.round(weatherData.wind.speed * 3.6)} km/h`,
      precipitation: `Precipitation: ${weatherData.rain ? weatherData.rain['1h'] : 0} mm`,
      aqi: `AQI: ${aqi} (${aqiText})`,
    });

  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
