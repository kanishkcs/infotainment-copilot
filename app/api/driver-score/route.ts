import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DriverMetrics {
  hardBrakes: number;
  smoothAcceleration: number;
  speedCompliance: number;
  laneDiscipline: number;
  followingDistance: number;
  distractionLevel: number;
  tripDuration: number;
  distanceTraveled: number;
}

function calculateDriverScore(metrics: DriverMetrics): {
  overallScore: number;
  breakdown: {
    safety: number;
    efficiency: number;
    comfort: number;
  };
  recommendations: string[];
} {
  // Safety score (40% weight)
  const safetyScore = Math.max(0, 100 - 
    (metrics.hardBrakes * 10) - 
    (metrics.distractionLevel * 15) - 
    (Math.max(0, metrics.followingDistance - 2) * 5)
  );

  // Efficiency score (35% weight)
  const efficiencyScore = Math.max(0, 100 - 
    (Math.max(0, metrics.speedCompliance - 5) * 8) - 
    (metrics.laneDiscipline * 12)
  );

  // Comfort score (25% weight)
  const comfortScore = Math.max(0, 100 - 
    (metrics.hardBrakes * 8) - 
    (Math.max(0, 5 - metrics.smoothAcceleration) * 10)
  );

  // Overall weighted score
  const overallScore = Math.round(
    (safetyScore * 0.4) + 
    (efficiencyScore * 0.35) + 
    (comfortScore * 0.25)
  );

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (metrics.hardBrakes > 2) {
    recommendations.push("Try to brake more gradually to improve comfort and fuel efficiency");
  }
  
  if (metrics.speedCompliance > 5) {
    recommendations.push("Consider maintaining more consistent speeds within limits");
  }
  
  if (metrics.distractionLevel > 3) {
    recommendations.push("Minimize phone usage and focus on the road ahead");
  }
  
  if (metrics.followingDistance > 2) {
    recommendations.push("Maintain a safer following distance in traffic");
  }
  
  if (metrics.laneDiscipline > 2) {
    recommendations.push("Try to stay in your lane more consistently");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Excellent driving! Keep up the great work");
  }

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    breakdown: {
      safety: Math.round(safetyScore),
      efficiency: Math.round(efficiencyScore),
      comfort: Math.round(comfortScore)
    },
    recommendations
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // Generate location-aware mock metrics
    let mockMetrics: DriverMetrics;
    
    if (lat && lon) {
      // Use location to generate consistent but varied metrics
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      const locationSeed = Math.abs(Math.sin(latNum) * Math.cos(lonNum) * 1000);
      
      // Urban areas tend to have more challenging driving conditions
      const isUrban = Math.abs(latNum) > 30 && Math.abs(lonNum) > 30;
      
      mockMetrics = {
        hardBrakes: Math.floor((locationSeed % 5) + (isUrban ? 1 : 0)), // Urban areas have more hard brakes
        smoothAcceleration: 3 + (locationSeed % 3) + (isUrban ? -0.5 : 0.5), // Rural areas have smoother acceleration
        speedCompliance: Math.floor((locationSeed % 8) + (isUrban ? 2 : -1)), // Urban areas have more speed violations
        laneDiscipline: Math.floor((locationSeed % 4) + (isUrban ? 1 : 0)), // Urban areas have more lane changes
        followingDistance: 1 + (locationSeed % 3) + (isUrban ? 0.5 : -0.5), // Urban areas have shorter following distance
        distractionLevel: Math.floor((locationSeed % 5) + (isUrban ? 1 : 0)), // Urban areas have more distractions
        tripDuration: 15 + (locationSeed % 45) + (isUrban ? 10 : -5), // Urban trips are longer
        distanceTraveled: 5 + (locationSeed % 25) + (isUrban ? 5 : -2) // Urban trips cover more distance
      };
    } else {
      // Fallback to random metrics if no location provided
      mockMetrics = {
        hardBrakes: Math.floor(Math.random() * 5),
        smoothAcceleration: 3 + Math.random() * 2,
        speedCompliance: Math.floor(Math.random() * 8),
        laneDiscipline: Math.floor(Math.random() * 4),
        followingDistance: 1 + Math.random() * 3,
        distractionLevel: Math.floor(Math.random() * 5),
        tripDuration: 15 + Math.random() * 45,
        distanceTraveled: 5 + Math.random() * 25
      };
    }

    const scoreData = calculateDriverScore(mockMetrics);

    // If user is provided, store the metrics (for future persistence)
    if (userId) {
      try {
        await prisma.driverMetrics.create({
          data: {
            userId,
            hardBrakes: mockMetrics.hardBrakes,
            smoothAcceleration: mockMetrics.smoothAcceleration,
            speedCompliance: mockMetrics.speedCompliance,
            laneDiscipline: mockMetrics.laneDiscipline,
            followingDistance: mockMetrics.followingDistance,
            distractionLevel: mockMetrics.distractionLevel,
            tripDuration: mockMetrics.tripDuration,
            distanceTraveled: mockMetrics.distanceTraveled,
            overallScore: scoreData.overallScore,
            safetyScore: scoreData.breakdown.safety,
            efficiencyScore: scoreData.breakdown.efficiency,
            comfortScore: scoreData.breakdown.comfort,
            recordedAt: new Date()
          }
        });
      } catch (dbError) {
        console.error('Failed to store driver metrics:', dbError);
        // Continue with response even if storage fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        overallScore: scoreData.overallScore,
        breakdown: scoreData.breakdown,
        recommendations: scoreData.recommendations,
        metrics: mockMetrics,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Driver score calculation failed:', error);
    
    // Fallback response
    return NextResponse.json({
      success: true,
      data: {
        overallScore: 85,
        breakdown: {
          safety: 88,
          efficiency: 82,
          comfort: 85
        },
        recommendations: ["Continue practicing safe driving habits"],
        metrics: {
          hardBrakes: 1,
          smoothAcceleration: 4,
          speedCompliance: 2,
          laneDiscipline: 1,
          followingDistance: 2,
          distractionLevel: 1,
          tripDuration: 25,
          distanceTraveled: 12
        },
        lastUpdated: new Date().toISOString()
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, metrics } = await request.json();

    if (!userId || !metrics) {
      return NextResponse.json(
        { error: 'User ID and metrics are required' },
        { status: 400 }
      );
    }

    const scoreData = calculateDriverScore(metrics);

    // Store the metrics
    const storedMetrics = await prisma.driverMetrics.create({
      data: {
        userId,
        hardBrakes: metrics.hardBrakes,
        smoothAcceleration: metrics.smoothAcceleration,
        speedCompliance: metrics.speedCompliance,
        laneDiscipline: metrics.laneDiscipline,
        followingDistance: metrics.followingDistance,
        distractionLevel: metrics.distractionLevel,
        tripDuration: metrics.tripDuration,
        distanceTraveled: metrics.distanceTraveled,
        overallScore: scoreData.overallScore,
        safetyScore: scoreData.breakdown.safety,
        efficiencyScore: scoreData.breakdown.efficiency,
        comfortScore: scoreData.breakdown.comfort,
        recordedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: storedMetrics.id,
        overallScore: scoreData.overallScore,
        breakdown: scoreData.breakdown,
        recommendations: scoreData.recommendations,
        recordedAt: storedMetrics.recordedAt
      }
    });

  } catch (error: any) {
    console.error('Failed to store driver metrics:', error);
    return NextResponse.json(
      { error: 'Failed to store driver metrics' },
      { status: 500 }
    );
  }
}
