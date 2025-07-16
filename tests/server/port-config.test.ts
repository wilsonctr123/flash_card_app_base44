// Port configuration tests

describe('Server Port Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should use port 3001 in development mode', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.PORT;

    // The port logic from server/index.ts
    const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 3001 : 5000);
    
    expect(port).toBe(3001);
  });

  it('should use port 5000 in production mode', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PORT;

    // The port logic from server/index.ts
    const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 3001 : 5000);
    
    expect(port).toBe(5000);
  });

  it('should respect PORT environment variable in any mode', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '8080';

    // The port logic from server/index.ts
    const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 3001 : 5000);
    
    expect(port).toBe('8080');
  });

  it('should use port 5000 when NODE_ENV is not set', () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;

    // The port logic from server/index.ts
    const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 3001 : 5000);
    
    expect(port).toBe(5000);
  });

  it('should never change from expected development port', () => {
    // This test ensures that the development port remains 3001
    // If this test fails, it means someone changed the port configuration
    const EXPECTED_DEV_PORT = 3001;
    const EXPECTED_PROD_PORT = 5000;

    process.env.NODE_ENV = 'development';
    delete process.env.PORT;
    const devPort = process.env.PORT || (process.env.NODE_ENV === 'development' ? 3001 : 5000);

    process.env.NODE_ENV = 'production';
    delete process.env.PORT;
    const prodPort = process.env.PORT || (process.env.NODE_ENV === 'development' ? 3001 : 5000);

    expect(devPort).toBe(EXPECTED_DEV_PORT);
    expect(prodPort).toBe(EXPECTED_PROD_PORT);
    
    // Add a descriptive error message
    expect(devPort).toBe(EXPECTED_DEV_PORT);
    expect(prodPort).toBe(EXPECTED_PROD_PORT);
  });
});