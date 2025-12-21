# Deploying AI-or-Not to Vercel

## Method 1: Deploy via Vercel Website (Easiest)

1. **Create a Vercel Account**
   - Go to https://vercel.com/signup
   - Sign up with GitHub (recommended)

2. **Push Your Code to GitHub**
   ```bash
   cd /home/colonel/Desktop/AI-or-Not
   git add .
   git commit -m "Update: Moved files to public folder"
   git push origin main
   ```

3. **Import Project to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"
   - Vercel will auto-detect it's a static site
   - Click "Deploy"

4. **Done!** Your site will be live at `https://your-project-name.vercel.app`

## Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Your Project Directory**
   ```bash
   cd /home/colonel/Desktop/AI-or-Not
   vercel
   ```

4. **Follow the Prompts**
   - Set up and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: (press enter for default)
   - Directory: ./ (press enter)
   - Want to override settings: No

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

**Note:** The HTML files are in the `public/` folder. Vercel will automatically serve them from there based on the `vercel.json` configuration.

## Project Structure

```
AI-or-Not/
├── public/              # All web files are here
│   ├── index.html
│   ├── detector.html
│   ├── about.html
│   ├── contact.html
│   ├── styles.css
│   └── script.js
├── vercel.json         # Vercel configuration (points to public/)
└── README.md
```

## Configuration Details

Your `vercel.json` is configured to:
- Serve files from the `public/` directory
- Route all requests appropriately
- Serve `index.html` as the home page

## Custom Domain (Optional)

1. Go to your project dashboard on Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Environment Variables (For Future API Integration)

When you add your AI model API:
1. Go to Project Settings → Environment Variables
2. Add your API keys and endpoints
3. Reference them in your JavaScript code

## Important Notes

- Your site is purely static (HTML/CSS/JS)
- No server-side code is included
- The AI detection currently uses placeholder logic
- When you add real AI detection, you'll need to:
  - Create API endpoints (Vercel Serverless Functions)
  - Or connect to external AI service
  - Add environment variables for API keys

## Vercel Features You Get

✅ Automatic HTTPS
✅ Global CDN
✅ Instant rollbacks
✅ Preview deployments
✅ Analytics
✅ Edge Network
✅ 100GB bandwidth/month (free tier)

## Quick Deploy Command

```bash
# One-time setup
npm install -g vercel
vercel login

# Deploy
cd /home/colonel/Desktop/AI-or-Not
vercel --prod
```

Your site will be live in seconds! 🚀

## Testing Locally

Before deploying, test locally:

```bash
cd /home/colonel/Desktop/AI-or-Not
python -m http.server 8000
# Visit: http://localhost:8000/public/
```

## Troubleshooting

**Issue:** 404 errors on deployment
- **Solution:** Make sure `vercel.json` is in the root directory and properly configured

**Issue:** Styles not loading
- **Solution:** Check that all paths in HTML files are relative (no leading slashes)

**Issue:** Pages not found
- **Solution:** Verify all HTML files are in the `public/` folder
