#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database migration...');

  try {
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Create a sample user for testing
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const sampleUser = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        name: 'Demo User',
        password: hashedPassword,
      },
    });

    console.log('✅ Sample user created:', sampleUser.email);

    // Create sample driver metrics
    const sampleMetrics = await prisma.driverMetrics.create({
      data: {
        userId: sampleUser.id,
        hardBrakes: 2,
        smoothAcceleration: 4.2,
        speedCompliance: 3,
        laneDiscipline: 1,
        followingDistance: 2.5,
        distractionLevel: 1,
        tripDuration: 25.5,
        distanceTraveled: 12.3,
        overallScore: 87,
        safetyScore: 89,
        efficiencyScore: 85,
        comfortScore: 87,
      },
    });

    console.log('✅ Sample driver metrics created');

    // Create sample user preferences
    const samplePreferences = await prisma.userPreferences.upsert({
      where: { userId: sampleUser.id },
      update: {},
      create: {
        userId: sampleUser.id,
        likes: ['podcasts', 'music', 'news'],
        dislikes: ['heavy-metal', 'talk-radio'],
      },
    });

    console.log('✅ Sample user preferences created');

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📋 Sample Data Created:');
    console.log(`   User: ${sampleUser.email} (password: password123)`);
    console.log(`   Driver Metrics: ${sampleMetrics.id}`);
    console.log(`   Preferences: ${samplePreferences.id}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: demo@example.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Unexpected error:', e);
    process.exit(1);
  });
