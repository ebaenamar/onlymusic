/**
 * Test Authentication Setup
 * 
 * This script helps verify your authentication configuration.
 * Run it with: node scripts/test-auth.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}Compatible Vibes - Authentication Test${colors.reset}`);
console.log(`${colors.cyan}======================================${colors.reset}\n`);

// Check for .env.local file
const envPath = path.join(process.cwd(), '.env.local');
let envFileExists = false;

try {
  fs.accessSync(envPath, fs.constants.F_OK);
  envFileExists = true;
  console.log(`${colors.green}✓ .env.local file found${colors.reset}`);
} catch (err) {
  console.log(`${colors.red}✗ .env.local file not found${colors.reset}`);
  console.log(`${colors.yellow}  Create a .env.local file based on .env.example${colors.reset}\n`);
}

// Check for required environment variables
if (envFileExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const variables = {
    NEXTAUTH_SECRET: envContent.includes('NEXTAUTH_SECRET=') && !envContent.includes('NEXTAUTH_SECRET=your-nextauth-secret'),
    NEXTAUTH_URL: envContent.includes('NEXTAUTH_URL='),
    SPOTIFY_CLIENT_ID: envContent.includes('SPOTIFY_CLIENT_ID=') && !envContent.includes('SPOTIFY_CLIENT_ID=your_client_id'),
    SPOTIFY_CLIENT_SECRET: envContent.includes('SPOTIFY_CLIENT_SECRET=') && !envContent.includes('SPOTIFY_CLIENT_SECRET=your_client_secret'),
  };

  console.log('\nChecking environment variables:');
  
  Object.entries(variables).forEach(([key, exists]) => {
    if (exists) {
      console.log(`${colors.green}✓ ${key} is set${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ ${key} is missing or using default value${colors.reset}`);
    }
  });
}

console.log('\nAuthentication Methods:');
console.log(`${colors.green}✓ Demo Account${colors.reset} - Always available`);
console.log(`${colors.yellow}? Spotify OAuth${colors.reset} - Requires proper configuration\n`);

console.log(`${colors.magenta}Next Steps:${colors.reset}`);
console.log(`1. Run the development server: ${colors.cyan}npm run dev${colors.reset}`);
console.log(`2. Open http://localhost:3000/auth/signin in your browser`);
console.log(`3. Try signing in with the demo account (username: demo, password: demo123)`);
console.log(`4. If configured, try signing in with Spotify\n`);

console.log(`${colors.magenta}Troubleshooting:${colors.reset}`);
console.log(`- If Spotify authentication fails, check your client ID and secret`);
console.log(`- Verify your redirect URIs in the Spotify Developer Dashboard`);
console.log(`- The demo account should always work regardless of Spotify configuration\n`);

console.log(`${colors.cyan}Happy coding!${colors.reset}`);
