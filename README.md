# DLI Student Support Application

## Deployment Guide for cPanel

### Prerequisites
- Node.js 18.x or later
- cPanel access with Node.js Selector support
- Domain or subdomain where the application will be hosted

### Build Instructions

1. **Local Build**
```bash
# Install dependencies
npm install

# Create production build
npm run build

# The build output will be in the .next directory
```

2. **Files to Upload to cPanel**
- `.next/` directory (contains the built application)
- `public/` directory (contains static assets)
- `package.json` and `package-lock.json`
- `.htaccess` file
- `next.config.js`
- `node_modules/` directory (or install dependencies on server)

### cPanel Deployment Steps

1. **Set up Node.js Version**
   - In cPanel, go to "Node.js Selector"
   - Create a new application
   - Select Node.js version 18.x or later
   - Set the application path to your domain/subdomain
   - Set the application URL
   - Save the configuration

2. **Upload Files**
   - Use File Manager or FTP to upload all required files
   - Maintain the directory structure as in the local project

3. **Install Dependencies**
   ```bash
   # If you didn't upload node_modules, run:
   npm install --production
   ```

4. **Start the Application**
   ```bash
   # Start the Next.js server
   npm start
   ```

5. **Configure Application Entry**
   - Make sure the application entry point in cPanel points to:
     ```
     npm start
     ```

### Environment Variables
Make sure to set up the following environment variables in cPanel:
- `NODE_ENV=production`
- Any other environment variables your application needs

### Troubleshooting

1. **404 Errors**
   - Check if .htaccess is properly uploaded
   - Verify Node.js application is running
   - Check error logs in cPanel

2. **White Screen**
   - Check browser console for errors
   - Verify all static assets are properly uploaded
   - Check Node.js application logs

3. **Performance Issues**
   - Enable compression in .htaccess (already included)
   - Verify caching headers are working
   - Check server resources in cPanel

### Maintenance

- Regular updates:
  ```bash
  npm update
  npm run build
  ```
- Monitor error logs in cPanel
- Keep Node.js version up to date
- Regularly backup your application

### Support
For technical support or questions about the deployment process, please contact your system administrator or create a support ticket. 