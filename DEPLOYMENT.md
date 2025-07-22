# SmartMove Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended)
1. Push code to GitHub repository
2. Import project in Vercel dashboard
3. Set environment variables:
   - `GOOGLE_CLOUD_PROJECT=triple-access-466622-j8`
   - `GOOGLE_APPLICATION_CREDENTIALS` (paste JSON content)
4. Deploy automatically

### Option 2: Netlify
1. Push code to GitHub repository  
2. Import project in Netlify dashboard
3. Set environment variables:
   - `GOOGLE_CLOUD_PROJECT=triple-access-466622-j8`
   - `GOOGLE_APPLICATION_CREDENTIALS` (paste JSON content)
4. Deploy automatically

## Environment Variables Required

### Google Service Account (Configured)
Your project is already configured with service account authentication:

- **Project ID:** `triple-access-466622-j8`
- **Service Account:** `smart-move-assist-api@triple-access-466622-j8.iam.gserviceaccount.com`

For deployment, you'll need to set these environment variables:
- `GOOGLE_CLOUD_PROJECT=triple-access-466622-j8`
- `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON content)

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Build passes locally: `npm run build`
- [ ] Type checking passes: `npm run typecheck`
- [ ] No security vulnerabilities: `npm audit`
- [ ] Google AI API key is valid and has quota

## Local Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Copy environment template: `cp .env.example .env.local`
4. Add your Google AI API key to `.env.local`
5. Start development server: `npm run dev`

## Production Considerations

### Performance
- Images are stored in localStorage (5-10MB limit per domain)
- Consider implementing image optimization/compression
- Large photo collections may impact performance

### Scaling
- Currently uses localStorage - not suitable for multi-device sync
- Consider migrating to Firebase/Supabase for production users
- Implement user authentication for data privacy

### Monitoring
- Add error tracking (Sentry, LogRocket)
- Implement analytics (Google Analytics, Plausible)
- Monitor API usage and costs

## Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Clear `.next` folder and rebuild
- Verify all dependencies are installed

### AI Features Not Working
- Verify Google AI API key is set correctly
- Check API quota and billing in Google Cloud Console
- Test API key with simple API call

### Images Not Loading
- Check browser localStorage usage
- Clear browser storage if needed
- Verify image file sizes are reasonable

## Next Steps After Deployment

1. Test all features on deployed version
2. Set up monitoring and error tracking
3. Plan user authentication implementation
4. Consider database migration for persistence
5. Implement CI/CD pipeline for automated deployments