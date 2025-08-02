/**
 * Test Users Data
 * Predefined test users for various testing scenarios
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  religiousPractice: 'practicing' | 'moderately_practicing' | 'learning';
  guardianEmail?: string;
  profileStatus: 'approved' | 'pending_approval' | 'rejected';
  role?: 'user' | 'guardian';
  guardianFor?: string[];
}

export interface TestGuardian extends TestUser {
  role: 'guardian';
  guardianFor: string[];
  permissions: {
    canApproveMatches: boolean;
    canMonitorMessages: boolean;
    canArrangeMeetings: boolean;
  };
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

/**
 * Primary test users for standard testing scenarios
 */
export const testUsers: TestUser[] = [
  {
    id: 'test-user-1',
    email: 'test-user-1@test.faddl.com',
    password: 'TestPassword123!',
    firstName: 'Ahmed',
    lastName: 'Al-Rashid',
    age: 28,
    location: 'Dubai, UAE',
    religiousPractice: 'practicing',
    guardianEmail: 'guardian-1@test.faddl.com',
    profileStatus: 'approved'
  },
  {
    id: 'test-user-2',
    email: 'test-user-2@test.faddl.com',
    password: 'TestPassword123!',
    firstName: 'Fatima',
    lastName: 'Al-Zahra',
    age: 25,
    location: 'Cairo, Egypt',
    religiousPractice: 'practicing',
    guardianEmail: 'guardian-2@test.faddl.com',
    profileStatus: 'approved'
  },
  {
    id: 'test-user-3',
    email: 'test-user-3@test.faddl.com',
    password: 'TestPassword123!',
    firstName: 'Omar',
    lastName: 'Al-Faruq',
    age: 30,
    location: 'Riyadh, Saudi Arabia',
    religiousPractice: 'practicing',
    guardianEmail: 'guardian-3@test.faddl.com',
    profileStatus: 'approved'
  },
  {
    id: 'test-user-pending',
    email: 'pending@test.faddl.com',
    password: 'TestPassword123!',
    firstName: 'Yusuf',
    lastName: 'Al-Mansur',
    age: 27,
    location: 'Doha, Qatar',
    religiousPractice: 'moderately_practicing',
    guardianEmail: 'guardian-4@test.faddl.com',
    profileStatus: 'pending_approval'
  },
  {
    id: 'test-user-new-muslim',
    email: 'newmuslim@test.faddl.com',
    password: 'TestPassword123!',
    firstName: 'Michael',
    lastName: 'Johnson',
    age: 32,
    location: 'London, UK',
    religiousPractice: 'learning',
    guardianEmail: 'guardian-5@test.faddl.com',
    profileStatus: 'approved'
  }
];

/**
 * Guardian test users with specific permissions and responsibilities
 */
export const testGuardians: TestGuardian[] = [
  {
    id: 'test-guardian-1',
    email: 'guardian-1@test.faddl.com',
    password: 'GuardianPassword123!',
    firstName: 'Ibrahim',
    lastName: 'Al-Rashid',
    age: 55,
    location: 'Dubai, UAE',
    religiousPractice: 'practicing',
    profileStatus: 'approved',
    role: 'guardian',
    guardianFor: ['test-user-1'],
    permissions: {
      canApproveMatches: true,
      canMonitorMessages: true,
      canArrangeMeetings: true
    },
    notificationPreferences: {
      email: true,
      sms: false,
      push: true
    }
  },
  {
    id: 'test-guardian-2',
    email: 'guardian-2@test.faddl.com',
    password: 'GuardianPassword123!',
    firstName: 'Khadija',
    lastName: 'Al-Zahra',
    age: 50,
    location: 'Cairo, Egypt',
    religiousPractice: 'practicing',
    profileStatus: 'approved',
    role: 'guardian',
    guardianFor: ['test-user-2'],
    permissions: {
      canApproveMatches: true,
      canMonitorMessages: true,
      canArrangeMeetings: true
    },
    notificationPreferences: {
      email: true,
      sms: true,
      push: true
    }
  },
  {
    id: 'test-guardian-3',
    email: 'guardian-3@test.faddl.com',
    password: 'GuardianPassword123!',
    firstName: 'Abdullah',
    lastName: 'Al-Faruq',
    age: 58,
    location: 'Riyadh, Saudi Arabia',
    religiousPractice: 'practicing',
    profileStatus: 'approved',
    role: 'guardian',
    guardianFor: ['test-user-3'],
    permissions: {
      canApproveMatches: true,
      canMonitorMessages: true,
      canArrangeMeetings: true
    },
    notificationPreferences: {
      email: true,
      sms: false,
      push: false
    }
  },
  {
    id: 'test-guardian-secondary',
    email: 'guardian-secondary@test.faddl.com',
    password: 'GuardianPassword123!',
    firstName: 'Amina',
    lastName: 'Al-Hakeem',
    age: 45,
    location: 'Kuwait City, Kuwait',
    religiousPractice: 'practicing',
    profileStatus: 'approved',
    role: 'guardian',
    guardianFor: ['test-user-1'], // Shared guardianship
    permissions: {
      canApproveMatches: false, // Secondary guardian with limited permissions
      canMonitorMessages: true,
      canArrangeMeetings: false
    },
    notificationPreferences: {
      email: true,
      sms: false,
      push: true
    }
  }
];

/**
 * Load testing users for performance and scalability testing
 */
export const generateLoadTestUsers = (count: number): TestUser[] => {
  const users: TestUser[] = [];
  
  for (let i = 0; i < count; i++) {
    users.push({
      id: `load-test-user-${i}`,
      email: `load-test-user-${i}@test.faddl.com`,
      password: 'LoadTestPassword123!',
      firstName: `TestUser${i}`,
      lastName: 'LoadTest',
      age: 25 + (i % 15), // Ages between 25-40
      location: `Test City ${i % 5}`, // Rotate through 5 cities
      religiousPractice: ['practicing', 'moderately_practicing', 'learning'][i % 3] as any,
      guardianEmail: `load-test-guardian-${i}@test.faddl.com`,
      profileStatus: 'approved'
    });
  }
  
  return users;
};

/**
 * Special case test users for edge case testing
 */
export const specialTestUsers: TestUser[] = [
  {
    id: 'test-user-single-parent',
    email: 'singleparent@test.faddl.com',
    password: 'TestPassword123!',
    firstName: 'Aisha',
    lastName: 'Al-Widowed',
    age: 35,
    location: 'Istanbul, Turkey',
    religiousPractice: 'practicing',
    guardianEmail: 'guardian-widowed@test.faddl.com',
    profileStatus: 'approved'
  },
  {
    id: 'test-user-convert',
    email: 'convert@test.faddl.com',
    password: 'TestPassword123!',
    firstName: 'Sarah',
    lastName: 'NewMuslim',
    age: 29,
    location: 'Toronto, Canada',
    religiousPractice: 'learning',
    guardianEmail: 'guardian-convert@test.faddl.com',
    profileStatus: 'approved'
  },
  {
    id: 'test-user-different-madhab',
    email: 'differentmadhab@test.faddl.com',
    password: 'TestPassword123!',
    firstName: 'Hassan',
    lastName: 'Al-Shafi',
    age: 31,
    location: 'Kuala Lumpur, Malaysia',
    religiousPractice: 'practicing',
    guardianEmail: 'guardian-shafi@test.faddl.com',
    profileStatus: 'approved'
  }
];

/**
 * Get user by ID
 */
export const getUserById = (id: string): TestUser | undefined => {
  return [...testUsers, ...specialTestUsers].find(user => user.id === id);
};

/**
 * Get guardian by ID
 */
export const getGuardianById = (id: string): TestGuardian | undefined => {
  return testGuardians.find(guardian => guardian.id === id);
};

/**
 * Get users by guardian
 */
export const getUsersByGuardian = (guardianId: string): TestUser[] => {
  const guardian = getGuardianById(guardianId);
  if (!guardian) return [];
  
  return [...testUsers, ...specialTestUsers].filter(user => 
    guardian.guardianFor.includes(user.id)
  );
};

/**
 * Get guardian for user
 */
export const getGuardianForUser = (userId: string): TestGuardian | undefined => {
  return testGuardians.find(guardian => guardian.guardianFor.includes(userId));
};

/**
 * Get all test accounts (users + guardians)
 */
export const getAllTestAccounts = (): (TestUser | TestGuardian)[] => {
  return [...testUsers, ...testGuardians, ...specialTestUsers];
};