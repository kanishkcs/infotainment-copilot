# Infotainment Co-Pilot Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Git

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure your variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

#### Required Variables:
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Random secret key for NextAuth.js
- `TOMTOM_API_KEY`: TomTom API key for maps and traffic
- `NEXT_PUBLIC_TOMTOM_API_KEY`: Same as above (for client-side)

#### Optional Variables:
- `HUGGING_FACE_API_TOKEN`: For real AI responses (has fallback)
- `OPENWEATHER_API_KEY`: For weather data (has fallback)

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## API Keys Setup

### TomTom API Key
1. Visit [TomTom Developer Portal](https://developer.tomtom.com/)
2. Create a free account
3. Create a new project
4. Get your API key from the project dashboard
5. Add to both `TOMTOM_API_KEY` and `NEXT_PUBLIC_TOMTOM_API_KEY`

### Hugging Face API Key (Optional)
1. Visit [Hugging Face](https://huggingface.co/settings/tokens)
2. Create a free account
3. Generate a new token
4. Add to `HUGGING_FACE_API_TOKEN`

### OpenWeatherMap API Key (Optional)
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for free
3. Get your API key
4. Add to `OPENWEATHER_API_KEY`

## Database Migration

If you need to reset or migrate your database:

```bash
# Reset database (WARNING: This will delete all data)
npx prisma db push --force-reset

# Or create a new migration
npx prisma migrate dev --name init
```

## Production Deployment

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
AUTH_SECRET="your-production-secret"
TOMTOM_API_KEY="your-tomtom-api-key"
NEXT_PUBLIC_TOMTOM_API_KEY="your-tomtom-api-key"
HUGGING_FACE_API_TOKEN="your-hugging-face-token"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

### Build and Deploy
```bash
npm run build
npm start
```

## Features Overview

### ✅ Implemented Features
- **Real Traffic Data**: Enhanced TomTom integration with fallback
- **AI Responses**: Hugging Face integration with context-aware fallbacks
- **Dynamic Driver Score**: Real-time scoring with metrics and recommendations
- **Professional UI**: Polished glass-morphism design with smooth animations
- **User Authentication**: Complete signup/login system
- **Voice Interface**: Speech recognition for hands-free interaction
- **Real-time Data**: Weather, traffic, and location integration

### 🔄 Fallback Systems
- Traffic data falls back to realistic mock data if TomTom API fails
- AI responses use context-aware fallbacks if Hugging Face is unavailable
- Weather data has multiple fallback sources
- All services gracefully degrade without breaking the app

### 📊 Driver Score System
- **Safety Score**: Based on hard brakes, distractions, following distance
- **Efficiency Score**: Based on speed compliance and lane discipline  
- **Comfort Score**: Based on smooth acceleration and braking patterns
- **Recommendations**: Personalized suggestions for improvement

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` format
   - Ensure PostgreSQL is running
   - Verify database exists

2. **API Key Issues**
   - Verify API keys are correctly set
   - Check API key permissions and quotas
   - App will work with fallbacks if APIs fail

3. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check Node.js version (requires 18+)
   - Clear `.next` folder and rebuild

4. **Authentication Issues**
   - Ensure `AUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain
   - Verify database schema is up to date

### Getting Help
- Check the console for error messages
- Verify all environment variables are set
- Ensure all API keys are valid and have proper permissions
- The app includes comprehensive fallback systems for graceful degradation
