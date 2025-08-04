#!/usr/bin/env node

/**
 * FADDL Match Platform End-to-End Test Script
 * Tests all core functionality with realistic scenarios
 */

const chalk = require('chalk');
const axios = require('axios');

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com' 
  : 'http://localhost:3000';

class FaddlMatchTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow
    };
    
    console.log(`[${timestamp}] ${colors[type](`${type.toUpperCase()}: ${message}`)}`);
  }

  async test(name, testFn) {
    try {
      this.log(`Running test: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      this.log(`✅ ${name} - PASSED`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`❌ ${name} - FAILED: ${error.message}`, 'error');
    }
  }

  async runAllTests() {
    this.log('🚀 Starting FADDL Match Platform Tests', 'info');
    
    // Test 1: API Health Check
    await this.test('API Health Check', async () => {
      const response = await axios.get(`${BASE_URL}/api/health`);
      if (response.status !== 200) throw new Error('Health check failed');
    });

    // Test 2: Profiles API
    await this.test('Profiles API', async () => {
      const response = await axios.get(`${BASE_URL}/api/profiles`);
      if (!response.data.profiles || response.data.profiles.length === 0) {
        throw new Error('No profiles returned');
      }
    });

    // Test 3: Matches API
    await this.test('Matches API - Daily', async () => {
      const response = await axios.get(`${BASE_URL}/api/matches?type=daily`);
      if (!response.data.matches) throw new Error('No matches data returned');
    });

    // Test 4: Matches API - Mutual
    await this.test('Matches API - Mutual', async () => {
      const response = await axios.get(`${BASE_URL}/api/matches?type=mutual`);
      if (!response.data.matches) throw new Error('No mutual matches data returned');
    });

    // Test 5: Like Action
    await this.test('Like Action', async () => {
      const response = await axios.post(`${BASE_URL}/api/matches`, {
        action: 'like',
        targetUserId: 'test-user-2'
      });
      if (!response.data.message) throw new Error('Like action failed');
    });

    // Test 6: Pass Action
    await this.test('Pass Action', async () => {
      const response = await axios.post(`${BASE_URL}/api/matches`, {
        action: 'pass',
        targetUserId: 'test-user-3'
      });
      if (!response.data.message) throw new Error('Pass action failed');
    });

    // Test 7: Messages API
    await this.test('Messages API', async () => {
      const response = await axios.get(`${BASE_URL}/api/messages`);
      if (!response.data.conversations) throw new Error('No conversations returned');
    });

    // Test 8: Send Message
    await this.test('Send Message', async () => {
      const response = await axios.post(`${BASE_URL}/api/messages`, {
        conversation_id: 'test-conv-1',
        content: 'Assalamu alaikum! This is a test message.'
      });
      if (!response.data.message) throw new Error('Message sending failed');
    });

    // Test 9: Photo Upload Simulation
    await this.test('Photo Upload Simulation', async () => {
      const response = await axios.post(`${BASE_URL}/api/simulation/users`, {
        action: 'simulate_photo_upload',
        data: { userId: 'test-user' }
      });
      if (!response.data.upload) throw new Error('Photo upload simulation failed');
    });

    // Test 10: Browsing Simulation
    await this.test('Browsing Simulation', async () => {
      const response = await axios.post(`${BASE_URL}/api/simulation/users`, {
        action: 'simulate_browsing',
        data: { userId: 'test-user' }
      });
      if (!response.data.session) throw new Error('Browsing simulation failed');
    });

    // Test 11: Matching Simulation
    await this.test('Matching Simulation', async () => {
      const response = await axios.post(`${BASE_URL}/api/simulation/users`, {
        action: 'simulate_matching',
        data: { userId: 'test-user', targetId: 'test-target' }
      });
      if (!response.data.flow) throw new Error('Matching simulation failed');
    });

    // Test 12: Messaging Simulation
    await this.test('Messaging Simulation', async () => {
      const response = await axios.post(`${BASE_URL}/api/simulation/users`, {
        action: 'simulate_messaging',
        data: { userId: 'test-user', targetId: 'test-target' }
      });
      if (!response.data.conversation) throw new Error('Messaging simulation failed');
    });

    // Test 13: Simulation Users Data
    await this.test('Simulation Users Data', async () => {
      const response = await axios.get(`${BASE_URL}/api/simulation/users`);
      if (!response.data.users || response.data.users.length === 0) {
        throw new Error('No simulation users data');
      }
    });

    this.printResults();
  }

  printResults() {
    console.log('\n' + chalk.bold('='.repeat(60)));
    console.log(chalk.bold.blue('           FADDL MATCH TEST RESULTS'));
    console.log(chalk.bold('='.repeat(60)));
    
    console.log(`\n📊 ${chalk.bold('SUMMARY')}:`);
    console.log(`   ✅ Passed: ${chalk.green(this.results.passed)}`);
    console.log(`   ❌ Failed: ${chalk.red(this.results.failed)}`);
    console.log(`   📋 Total:  ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log(`\n🚨 ${chalk.bold.red('FAILED TESTS')}:`);
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   ❌ ${test.name}: ${chalk.red(test.error)}`);
        });
    }

    console.log(`\n🎯 ${chalk.bold('SUCCESS RATE')}: ${chalk.cyan(
      Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)
    )}%`);

    if (this.results.failed === 0) {
      console.log(chalk.green.bold('\n🎉 ALL TESTS PASSED! Your platform is working perfectly!'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  Some tests failed. Please check the issues above.'));
    }

    console.log('\n' + chalk.bold('='.repeat(60)) + '\n');
  }
}

// Check if axios is available
try {
  require('axios');
} catch (error) {
  console.log(chalk.red('❌ axios is required. Please install it:'));
  console.log(chalk.yellow('npm install axios'));
  process.exit(1);
}

// Check if chalk is available  
try {
  require('chalk');
} catch (error) {
  console.log('❌ chalk is required. Please install it:');
  console.log('npm install chalk');
  process.exit(1);
}

// Run tests
const tester = new FaddlMatchTester();
tester.runAllTests().catch(error => {
  console.error(chalk.red('❌ Test runner failed:'), error.message);
  process.exit(1);
});