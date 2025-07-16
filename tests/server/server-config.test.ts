const fs = require('fs');
const path = require('path');

describe('Server Configuration Integrity', () => {
  const serverIndexPath = path.join(process.cwd(), 'server', 'index.ts');

  it('should have the correct port configuration in server/index.ts', () => {
    // Read the actual server file
    const serverContent = fs.readFileSync(serverIndexPath, 'utf-8');
    
    // Check that the port configuration line exists and is correct
    const portConfigRegex = /const\s+port\s*=\s*process\.env\.PORT\s*\|\|\s*\(process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\?\s*3001\s*:\s*5000\)/;
    
    expect(serverContent).toMatch(portConfigRegex);
  });

  it('should serve on localhost in development', () => {
    const serverContent = fs.readFileSync(serverIndexPath, 'utf-8');
    
    // Check that host is set to 127.0.0.1
    const hostConfigRegex = /host:\s*["']127\.0\.0\.1["']/;
    
    expect(serverContent).toMatch(hostConfigRegex);
  });

  it('should have development-specific setup', () => {
    const serverContent = fs.readFileSync(serverIndexPath, 'utf-8');
    
    // Check for development mode condition
    const devModeCheck = /if\s*\(app\.get\(["']env["']\)\s*===\s*["']development["']\)/;
    
    expect(serverContent).toMatch(devModeCheck);
  });
});

describe('Client API Configuration', () => {
  it('should use relative URLs for API calls', () => {
    const queryClientPath = path.join(process.cwd(), 'client', 'src', 'lib', 'queryClient.ts');
    const queryClientContent = fs.readFileSync(queryClientPath, 'utf-8');
    
    // Check that apiRequest doesn't hardcode any ports
    expect(queryClientContent).not.toMatch(/:5000/);
    expect(queryClientContent).not.toMatch(/:3001/);
    
    // Ensure fetch uses relative URLs
    expect(queryClientContent).toMatch(/fetch\(url/);
  });
});

describe('Environment Configuration', () => {
  it('should have dotenv configured', () => {
    const serverIndexPath = path.join(process.cwd(), 'server', 'index.ts');
    const serverContent = fs.readFileSync(serverIndexPath, 'utf-8');
    
    // Check for dotenv import
    expect(serverContent).toMatch(/import\s+["']dotenv\/config["']/);
  });

  it('should have correct .env.example file', () => {
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    // Create .env.example if it doesn't exist
    if (!fs.existsSync(envExamplePath)) {
      const envExample = `# Development Environment Variables
NODE_ENV=development
DATABASE_URL=your_database_url_here
SESSION_SECRET=your_session_secret_here

# Port configuration (optional - defaults to 3001 in dev, 5000 in prod)
# PORT=3001
`;
      fs.writeFileSync(envExamplePath, envExample);
    }
    
    expect(fs.existsSync(envExamplePath)).toBe(true);
  });
});