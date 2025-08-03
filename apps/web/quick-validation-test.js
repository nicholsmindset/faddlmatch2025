#!/usr/bin/env node

/**
 * Quick Frontend Validation Test for FADDL Match
 * Validates basic functionality without requiring full Playwright setup
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}=== ${msg} ===${colors.reset}`)
};

class FrontendValidator {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async makeRequest(path = '', options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, {
        timeout: 10000,
        ...options
      }, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.abort();
        reject(new Error('Request timeout'));
      });
    });
  }

  async validateServerResponse() {
    log.header('Server Response Validation');
    
    try {
      const response = await this.makeRequest('/');
      
      if (response.statusCode === 200) {
        log.success('Homepage returns 200 status');
        this.results.passed++;
      } else {
        log.error(`Homepage returns ${response.statusCode} status`);
        this.results.failed++;
      }

      // Check content type
      if (response.headers['content-type']?.includes('text/html')) {
        log.success('Correct content-type header (text/html)');
        this.results.passed++;
      } else {
        log.error('Incorrect content-type header');
        this.results.failed++;
      }

      return response.body;
    } catch (error) {
      log.error(`Server request failed: ${error.message}`);
      this.results.failed++;
      return null;
    }
  }

  validateHTML(html) {
    log.header('HTML Structure Validation');
    
    if (!html) {
      log.error('No HTML content to validate');
      this.results.failed++;
      return;
    }

    // Check for DOCTYPE
    if (html.includes('<!DOCTYPE html>')) {
      log.success('DOCTYPE declaration present');
      this.results.passed++;
    } else {
      log.error('Missing DOCTYPE declaration');
      this.results.failed++;
    }

    // Check for html lang attribute
    if (html.includes('lang="en"')) {
      log.success('HTML lang attribute set correctly');
      this.results.passed++;
    } else {
      log.error('Missing or incorrect HTML lang attribute');
      this.results.failed++;
    }

    // Check for viewport meta tag
    if (html.includes('name="viewport"')) {
      log.success('Viewport meta tag present');
      this.results.passed++;
    } else {
      log.error('Missing viewport meta tag');
      this.results.failed++;
    }

    // Check for title tag
    if (html.includes('<title>FADDL Match')) {
      log.success('Page title present and branded');
      this.results.passed++;
    } else {
      log.error('Missing or incorrect page title');
      this.results.failed++;
    }

    // Check for meta description
    if (html.includes('name="description"')) {
      log.success('Meta description present');
      this.results.passed++;
    } else {
      log.warning('Meta description missing (SEO impact)');
      this.results.warnings++;
    }
  }

  validateAccessibility(html) {
    log.header('Basic Accessibility Validation');
    
    if (!html) return;

    // Check for semantic HTML elements
    const semanticElements = ['<main', '<header', '<footer', '<nav'];
    const foundElements = semanticElements.filter(element => html.includes(element));
    
    if (foundElements.length >= 3) {
      log.success(`Semantic HTML elements found: ${foundElements.length}/4`);
      this.results.passed++;
    } else {
      log.warning(`Limited semantic HTML: ${foundElements.length}/4 elements found`);
      this.results.warnings++;
    }

    // Check for heading hierarchy
    const headings = ['<h1', '<h2', '<h3'];
    const foundHeadings = headings.filter(heading => html.includes(heading));
    
    if (foundHeadings.length >= 2) {
      log.success(`Heading hierarchy present: ${foundHeadings.length} levels`);
      this.results.passed++;
    } else {
      log.error('Poor heading hierarchy');
      this.results.failed++;
    }

    // Check for alt attributes (basic check)
    if (html.includes('alt=')) {
      log.success('Alt attributes found for images');
      this.results.passed++;
    } else {
      log.info('No alt attributes found (may be no images)');
    }

    // Check for aria attributes
    if (html.includes('aria-') || html.includes('role=')) {
      log.success('ARIA attributes present');
      this.results.passed++;
    } else {
      log.warning('No ARIA attributes found');
      this.results.warnings++;
    }
  }

  validateCulturalContent(html) {
    log.header('Cultural and Religious Content Validation');
    
    if (!html) return;

    // Check for Islamic terminology
    const islamicTerms = ['Halal', 'Islamic', 'Muslim', 'guardian', 'matrimonial'];
    const foundTerms = islamicTerms.filter(term => 
      html.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundTerms.length >= 3) {
      log.success(`Islamic terminology present: ${foundTerms.join(', ')}`);
      this.results.passed++;
    } else {
      log.error('Insufficient Islamic terminology in content');
      this.results.failed++;
    }

    // Check for respectful language
    const problematicTerms = ['hookup', 'casual', 'dating app', 'swipe'];
    const foundProblematic = problematicTerms.filter(term => 
      html.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundProblematic.length === 0) {
      log.success('No inappropriate dating terminology found');
      this.results.passed++;
    } else {
      log.error(`Inappropriate terms found: ${foundProblematic.join(', ')}`);
      this.results.failed++;
    }

    // Check for family values emphasis
    const familyTerms = ['family', 'guardian', 'marriage', 'serious'];
    const foundFamily = familyTerms.filter(term => 
      html.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundFamily.length >= 2) {
      log.success(`Family values emphasized: ${foundFamily.join(', ')}`);
      this.results.passed++;
    } else {
      log.warning('Limited family values emphasis');
      this.results.warnings++;
    }
  }

  validatePerformance(html) {
    log.header('Basic Performance Validation');
    
    if (!html) return;

    // Check for CSS loading
    if (html.includes('stylesheet') || html.includes('.css')) {
      log.success('CSS stylesheets linked');
      this.results.passed++;
    } else {
      log.error('No CSS stylesheets found');
      this.results.failed++;
    }

    // Check for JavaScript loading
    if (html.includes('<script') || html.includes('.js')) {
      log.success('JavaScript files linked');
      this.results.passed++;
    } else {
      log.warning('No JavaScript files found');
      this.results.warnings++;
    }

    // Check for font preloading
    if (html.includes('preload') && html.includes('font')) {
      log.success('Font preloading implemented');
      this.results.passed++;
    } else {
      log.warning('No font preloading detected');
      this.results.warnings++;
    }

    // Estimate bundle size (rough)
    const estimatedSize = html.length;
    if (estimatedSize < 100000) { // ~100KB
      log.success(`Reasonable initial HTML size: ~${Math.round(estimatedSize/1000)}KB`);
      this.results.passed++;
    } else {
      log.warning(`Large initial HTML size: ~${Math.round(estimatedSize/1000)}KB`);
      this.results.warnings++;
    }
  }

  async validateAPI() {
    log.header('API Endpoint Validation');
    
    try {
      // Check health endpoint if exists
      const response = await this.makeRequest('/api/health');
      
      if (response.statusCode === 200) {
        log.success('Health API endpoint responds correctly');
        this.results.passed++;
      } else {
        log.info('Health API endpoint not found (optional)');
      }
    } catch (error) {
      log.info('Health API endpoint not available (optional)');
    }

    // Check for static assets
    try {
      const cssResponse = await this.makeRequest('/_next/static/css/app/layout.css');
      
      if (cssResponse.statusCode === 200) {
        log.success('CSS assets loading correctly');
        this.results.passed++;
      } else {
        log.warning('CSS assets may not be loading correctly');
        this.results.warnings++;
      }
    } catch (error) {
      log.warning('Could not validate CSS asset loading');
      this.results.warnings++;
    }
  }

  generateReport() {
    log.header('Validation Summary');
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n${colors.bold}Results:${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.results.warnings}${colors.reset}`);
    console.log(`${colors.blue}📊 Pass Rate: ${passRate}%${colors.reset}`);
    
    if (this.results.failed === 0) {
      log.success('🎉 All critical tests passed! Frontend ready for production.');
    } else if (this.results.failed <= 2) {
      log.warning('⚡ Minor issues found. Address before launch.');
    } else {
      log.error('🚨 Critical issues found. Fix before proceeding.');
    }
    
    console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
    console.log('1. Address any failed validations');
    console.log('2. Review warnings for improvements');
    console.log('3. Run full Playwright test suite');
    console.log('4. Perform manual accessibility testing');
    console.log('5. Test on actual mobile devices');
    
    return {
      passed: this.results.passed,
      failed: this.results.failed,
      warnings: this.results.warnings,
      passRate: parseFloat(passRate)
    };
  }

  async runAllValidations() {
    console.log(`${colors.bold}${colors.blue}FADDL Match Frontend Validation${colors.reset}`);
    console.log(`Testing: ${this.baseUrl}\n`);
    
    const html = await this.validateServerResponse();
    
    if (html) {
      this.validateHTML(html);
      this.validateAccessibility(html);
      this.validateCulturalContent(html);
      this.validatePerformance(html);
    }
    
    await this.validateAPI();
    
    return this.generateReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new FrontendValidator();
  
  validator.runAllValidations()
    .then(results => {
      process.exit(results.failed > 2 ? 1 : 0);
    })
    .catch(error => {
      console.error(`${colors.red}Validation failed: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = FrontendValidator;