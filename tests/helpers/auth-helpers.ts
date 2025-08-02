import { Page, expect } from '@playwright/test';

/**
 * Authentication Helper Functions
 * Handles user authentication, session management, and auth-related utilities
 */

export interface AuthSession {
  userId: string;
  email: string;
  role: 'user' | 'guardian';
  sessionToken?: string;
  expiresAt?: string;
}

/**
 * Authenticate a user for testing
 * This function simulates the authentication process without going through the full login flow
 */
export async function authenticateUser(page: Page, email: string, password?: string): Promise<void> {
  try {
    // For testing, we'll use a simplified authentication approach
    // In a real implementation, this would interact with Clerk or your auth provider
    
    // Set authentication cookies/localStorage to simulate logged-in state
    await page.evaluate(({ email }) => {
      // Mock authentication state
      localStorage.setItem('auth_user', JSON.stringify({
        email: email,
        id: email.split('@')[0], // Use email prefix as ID for testing
        authenticated: true,
        role: email.includes('guardian') ? 'guardian' : 'user'
      }));
      
      // Mock Clerk session (if using Clerk)
      localStorage.setItem('clerk_session', JSON.stringify({
        user: {
          id: email.split('@')[0],
          emailAddress: email,
          role: email.includes('guardian') ? 'guardian' : 'user'
        },
        token: 'mock_jwt_token_for_testing'
      }));
    }, { email });
    
    // Set authentication cookies
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: 'mock_auth_token_' + Date.now(),
        domain: 'localhost',
        path: '/',
        expires: Date.now() / 1000 + 3600 // 1 hour from now
      },
      {
        name: 'user_session',
        value: email.split('@')[0],
        domain: 'localhost', 
        path: '/',
        expires: Date.now() / 1000 + 3600
      }
    ]);
    
    console.log(`✅ Authenticated user: ${email}`);
    
  } catch (error) {
    console.error(`❌ Authentication failed for ${email}:`, error);
    throw error;
  }
}

/**
 * Authenticate multiple users for multi-user tests
 */
export async function authenticateMultipleUsers(
  pages: Page[], 
  emails: string[]
): Promise<void> {
  if (pages.length !== emails.length) {
    throw new Error('Number of pages must match number of emails');
  }
  
  const authPromises = pages.map((page, index) => 
    authenticateUser(page, emails[index])
  );
  
  await Promise.all(authPromises);
  console.log(`✅ Authenticated ${emails.length} users`);
}

/**
 * Clear authentication state
 */
export async function clearAuthentication(page: Page): Promise<void> {
  try {
    // Clear localStorage auth data
    await page.evaluate(() => {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('clerk_session');
      localStorage.clear();
    });
    
    // Clear authentication cookies
    await page.context().clearCookies();
    
    console.log('✅ Cleared authentication state');
    
  } catch (error) {
    console.error('❌ Failed to clear authentication:', error);
    throw error;
  }
}

/**
 * Verify user is authenticated
 */
export async function verifyAuthentication(page: Page, expectedEmail?: string): Promise<boolean> {
  try {
    const authState = await page.evaluate(() => {
      const authUser = localStorage.getItem('auth_user');
      return authUser ? JSON.parse(authUser) : null;
    });
    
    if (!authState || !authState.authenticated) {
      return false;
    }
    
    if (expectedEmail && authState.email !== expectedEmail) {
      console.warn(`Expected ${expectedEmail}, but found ${authState.email}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Authentication verification failed:', error);
    return false;
  }
}

/**
 * Get current authenticated user info
 */
export async function getCurrentUser(page: Page): Promise<AuthSession | null> {
  try {
    const authState = await page.evaluate(() => {
      const authUser = localStorage.getItem('auth_user');
      return authUser ? JSON.parse(authUser) : null;
    });
    
    if (!authState) return null;
    
    return {
      userId: authState.id,
      email: authState.email,
      role: authState.role,
      sessionToken: 'mock_token'
    };
    
  } catch (error) {
    console.error('❌ Failed to get current user:', error);
    return null;
  }
}

/**
 * Switch user role (for testing role-based features)
 */
export async function switchUserRole(page: Page, role: 'user' | 'guardian'): Promise<void> {
  try {
    await page.evaluate((role) => {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const user = JSON.parse(authUser);
        user.role = role;
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    }, role);
    
    console.log(`✅ Switched user role to: ${role}`);
    
  } catch (error) {
    console.error(`❌ Failed to switch role to ${role}:`, error);
    throw error;
  }
}

/**
 * Simulate session expiration
 */
export async function expireSession(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const user = JSON.parse(authUser);
        user.authenticated = false;
        user.expired = true;
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    });
    
    // Clear auth cookies
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: '',
        domain: 'localhost',
        path: '/',
        expires: 1 // Expired timestamp
      }
    ]);
    
    console.log('✅ Simulated session expiration');
    
  } catch (error) {
    console.error('❌ Failed to expire session:', error);
    throw error;
  }
}

/**
 * Wait for authentication redirect
 */
export async function waitForAuthRedirect(page: Page, timeout: number = 5000): Promise<void> {
  try {
    await page.waitForURL(url => 
      url.pathname.includes('/login') || 
      url.pathname.includes('/signin') || 
      url.pathname.includes('/auth'), 
      { timeout }
    );
    
    console.log('✅ Authentication redirect detected');
    
  } catch (error) {
    console.error('❌ No authentication redirect detected:', error);
    throw error;
  }
}

/**
 * Mock Clerk authentication responses
 */
export async function mockClerkAuth(page: Page, user: any): Promise<void> {
  try {
    // Mock Clerk API responses
    await page.route('**/clerk/v1/**', async route => {
      const url = route.request().url();
      
      if (url.includes('/sessions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            response: {
              object: 'session',
              id: 'mock_session_id',
              status: 'active',
              user: user
            }
          })
        });
      } else if (url.includes('/users')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            response: user
          })
        });
      } else {
        await route.continue();
      }
    });
    
    console.log('✅ Mocked Clerk authentication');
    
  } catch (error) {
    console.error('❌ Failed to mock Clerk auth:', error);
    throw error;
  }
}

/**
 * Wait for WebSocket connection (used in real-time tests)
 */
export async function waitForWebSocket(page: Page, timeout: number = 10000): Promise<void> {
  try {
    await page.evaluate(async (timeout) => {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (window.socket && window.socket.connected) {
            resolve(true);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('WebSocket connection timeout'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        
        const startTime = Date.now();
        checkConnection();
      });
    }, timeout);
    
    console.log('✅ WebSocket connection established');
    
  } catch (error) {
    console.error('❌ WebSocket connection failed:', error); 
    throw error;
  }
}

/**
 * Verify user permissions
 */
export async function verifyUserPermissions(
  page: Page, 
  expectedPermissions: string[]
): Promise<boolean> {
  try {
    const hasPermissions = await page.evaluate((permissions) => {
      const authUser = localStorage.getItem('auth_user');
      if (!authUser) return false;
      
      const user = JSON.parse(authUser);
      
      // Check if user has required permissions (mock implementation)
      if (user.role === 'guardian') {
        const guardianPermissions = ['view_conversations', 'approve_matches', 'monitor_messages'];
        return permissions.every(p => guardianPermissions.includes(p));
      } else if (user.role === 'user') {
        const userPermissions = ['send_messages', 'view_matches', 'request_approvals'];
        return permissions.every(p => userPermissions.includes(p));
      }
      
      return false;
    }, expectedPermissions);
    
    return hasPermissions;
    
  } catch (error) {
    console.error('❌ Permission verification failed:', error);
    return false;
  }
}

/**
 * Mock authentication failure
 */
export async function mockAuthFailure(page: Page): Promise<void> {
  try {
    await page.route('**/api/auth/**', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Authentication failed',
          code: 'UNAUTHORIZED'
        })
      });
    });
    
    console.log('✅ Mocked authentication failure');
    
  } catch (error) {
    console.error('❌ Failed to mock auth failure:', error);
    throw error;
  }
}

/**
 * Test authentication persistence across page reloads
 */
export async function testAuthPersistence(page: Page, email: string): Promise<boolean> {
  try {
    // Authenticate user
    await authenticateUser(page, email);
    
    // Navigate to a protected page
    await page.goto('/messages');
    
    // Verify authentication
    const beforeReload = await verifyAuthentication(page, email);
    
    // Reload page
    await page.reload();
    
    // Verify authentication persists
    const afterReload = await verifyAuthentication(page, email);
    
    return beforeReload && afterReload;
    
  } catch (error) {
    console.error('❌ Auth persistence test failed:', error);
    return false;
  }
}