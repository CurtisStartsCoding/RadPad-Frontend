# RadMiddle Frontend MockUp

## Deployment to DigitalOcean

This project is configured for deployment to DigitalOcean App Platform. The following files are used for deployment:

- `Procfile`: Defines build and run commands for DigitalOcean
- `.do/app.yaml`: DigitalOcean App Platform configuration
- `.env`: Environment variables for production
- `.gitignore`: Ensures proper files are included in deployment

### Deployment Steps

1. Push your code to GitHub
2. In DigitalOcean App Platform, create a new app
3. Select your GitHub repository
4. DigitalOcean will automatically detect the configuration from the Procfile and .do/app.yaml
5. Review the settings and deploy

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the application
npm run build

# Start the application
npm start
```

### Environment Variables

The following environment variables are used:

- `NODE_ENV`: Set to "production" for deployment
- `PORT`: The port the application will run on (default: 8080)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS
- `DEFAULT_ALLOWED_ORIGIN`: Default allowed origin if ALLOWED_ORIGINS is not set (default: "http://localhost:3000")
- `API_URL`: The URL of the API server (default: "https://api.radorderpad.com")
- `VITE_API_URL`: Client-side version of API_URL for the frontend (used in Vite builds)

A `.env.example` file is provided as a template. Copy this file to `.env` and update the values as needed for your environment.

### Troubleshooting

If you encounter deployment issues:

1. Check the DigitalOcean logs for error messages
2. Ensure all required environment variables are set
3. Verify that the build and start commands in the Procfile are correct
4. Make sure the .do/app.yaml file is properly configured