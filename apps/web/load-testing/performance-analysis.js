/**
 * 📊 Performance Analysis & Reporting Tool
 * Analyzes load test results and generates actionable insights
 */

const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
  constructor(resultsDir) {
    this.resultsDir = resultsDir;
    this.analysis = {
      timestamp: new Date().toISOString(),
      summary: {},
      endpoints: {},
      recommendations: [],
      criticalIssues: [],
      scalabilityInsights: {}
    };
  }

  // Analyze k6 test results
  analyzeK6Results(k6File) {
    try {
      const rawData = fs.readFileSync(k6File, 'utf8');
      const lines = rawData.trim().split('\n');
      const metrics = lines.map(line => JSON.parse(line));
      
      // Filter for HTTP request metrics
      const httpMetrics = metrics.filter(m => m.type === 'Point' && m.metric === 'http_req_duration');
      const errorMetrics = metrics.filter(m => m.type === 'Point' && m.metric === 'http_req_failed');
      
      // Calculate performance statistics
      const responseTimes = httpMetrics.map(m => m.data.value);
      const errorRates = errorMetrics.map(m => m.data.value);
      
      this.analysis.k6Results = {
        totalRequests: httpMetrics.length,
        averageResponseTime: this.calculateAverage(responseTimes),
        p95ResponseTime: this.calculatePercentile(responseTimes, 95),
        p99ResponseTime: this.calculatePercentile(responseTimes, 99),
        errorRate: (errorRates.filter(r => r === 1).length / errorRates.length) * 100,
        throughput: this.calculateThroughput(httpMetrics),
        endpointBreakdown: this.analyzeEndpointPerformance(httpMetrics)
      };
      
      // Performance assessment
      this.assessPerformance();
      
    } catch (error) {
      console.error('Error analyzing k6 results:', error.message);
    }
  }

  // Analyze Artillery test results  
  analyzeArtilleryResults(artilleryFile) {
    try {
      const data = JSON.parse(fs.readFileSync(artilleryFile, 'utf8'));
      
      this.analysis.artilleryResults = {
        scenariosCompleted: data.aggregate?.counters?.['vusers.completed'] || 0,
        scenariosFailed: data.aggregate?.counters?.['vusers.failed'] || 0,
        requestsCompleted: data.aggregate?.counters?.['http.requests'] || 0,
        averageResponseTime: data.aggregate?.summaries?.['http.response_time']?.mean || 0,
        p95ResponseTime: data.aggregate?.summaries?.['http.response_time']?.p95 || 0,
        p99ResponseTime: data.aggregate?.summaries?.['http.response_time']?.p99 || 0,
        rps: data.aggregate?.rates?.['http.request_rate'] || 0
      };
      
    } catch (error) {
      console.error('Error analyzing Artillery results:', error.message);
    }
  }

  // Analyze database performance
  analyzeDatabaseResults(dbFile) {
    try {
      const content = fs.readFileSync(dbFile, 'utf8');
      
      // Parse database test results (basic parsing)
      const lines = content.split('\n');
      const performanceSection = this.extractSection(lines, 'Performance Test');
      const resourceSection = this.extractSection(lines, 'Resource Monitoring');
      
      this.analysis.databaseResults = {
        queryPerformance: this.parseDatabasePerformance(performanceSection),
        resourceUtilization: this.parseDatabaseResources(resourceSection),
        connectionPoolHealth: this.assessConnectionPool(resourceSection)
      };
      
    } catch (error) {
      console.error('Error analyzing database results:', error.message);
    }
  }

  // Calculate performance metrics
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  calculateThroughput(metrics) {
    if (metrics.length === 0) return 0;
    
    const timestamps = metrics.map(m => new Date(m.data.time));
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const durationSeconds = (maxTime - minTime) / 1000;
    
    return durationSeconds > 0 ? metrics.length / durationSeconds : 0;
  }

  analyzeEndpointPerformance(metrics) {
    const endpoints = {};
    
    metrics.forEach(metric => {
      const endpoint = metric.data.tags?.url || 'unknown';
      if (!endpoints[endpoint]) {
        endpoints[endpoint] = {
          requestCount: 0,
          responseTimes: [],
          errors: 0
        };
      }
      
      endpoints[endpoint].requestCount++;
      endpoints[endpoint].responseTimes.push(metric.data.value);
    });
    
    // Calculate statistics for each endpoint
    Object.keys(endpoints).forEach(endpoint => {
      const data = endpoints[endpoint];
      data.averageResponseTime = this.calculateAverage(data.responseTimes);
      data.p95ResponseTime = this.calculatePercentile(data.responseTimes, 95);
      data.p99ResponseTime = this.calculatePercentile(data.responseTimes, 99);
    });
    
    return endpoints;
  }

  // Performance assessment and recommendations
  assessPerformance() {
    const k6 = this.analysis.k6Results;
    if (!k6) return;
    
    // Response time assessment
    if (k6.p95ResponseTime > 1000) {
      this.analysis.criticalIssues.push({
        type: 'performance',
        severity: 'high',
        issue: 'High response times detected',
        details: `95th percentile response time: ${k6.p95ResponseTime.toFixed(2)}ms`,
        recommendation: 'Investigate database queries, add caching, optimize edge functions'
      });
    }
    
    // Error rate assessment
    if (k6.errorRate > 1) {
      this.analysis.criticalIssues.push({
        type: 'reliability',
        severity: 'critical',
        issue: 'High error rate detected',
        details: `Error rate: ${k6.errorRate.toFixed(2)}%`,
        recommendation: 'Investigate failing endpoints, check edge function stability'
      });
    }
    
    // Throughput assessment
    if (k6.throughput < 10) { // Less than 10 RPS
      this.analysis.recommendations.push({
        type: 'scalability',
        priority: 'medium',
        recommendation: 'Low throughput detected - consider infrastructure scaling',
        details: `Current throughput: ${k6.throughput.toFixed(2)} RPS`
      });
    }
    
    // Generate scalability insights
    this.generateScalabilityInsights();
  }

  generateScalabilityInsights() {
    const k6 = this.analysis.k6Results;
    if (!k6) return;
    
    // Estimate capacity based on current performance
    const currentRPS = k6.throughput;
    const avgResponseTime = k6.averageResponseTime;
    
    // Simple capacity estimation
    const estimatedMaxUsers = Math.floor(1000 / avgResponseTime * currentRPS);
    
    this.analysis.scalabilityInsights = {
      currentPerformance: {
        rps: currentRPS,
        avgResponseTime: avgResponseTime,
        concurrentUsers: k6.totalRequests / (k6.totalRequests / currentRPS / 60) // Rough estimate
      },
      estimatedCapacity: {
        maxConcurrentUsers: estimatedMaxUsers,
        maxRPS: currentRPS * 2, // Conservative estimate
        bottleneckLikely: avgResponseTime > 500 ? 'Database or Edge Functions' : 'Unknown'
      },
      recommendations: this.generateCapacityRecommendations(estimatedMaxUsers, avgResponseTime)
    };
  }

  generateCapacityRecommendations(maxUsers, avgResponseTime) {
    const recommendations = [];
    
    if (maxUsers < 500) {
      recommendations.push('Scale edge function memory allocation');
      recommendations.push('Implement database connection pooling optimization');
      recommendations.push('Add Redis caching layer');
    }
    
    if (avgResponseTime > 500) {
      recommendations.push('Optimize database queries with proper indexing');
      recommendations.push('Implement query result caching');
      recommendations.push('Consider database read replicas');
    }
    
    if (maxUsers < 1000) {
      recommendations.push('Consider auto-scaling policies');
      recommendations.push('Implement CDN for static assets');
      recommendations.push('Optimize edge function cold starts');
    }
    
    return recommendations;
  }

  // Database analysis helpers
  extractSection(lines, sectionName) {
    const startIndex = lines.findIndex(line => line.includes(sectionName));
    if (startIndex === -1) return [];
    
    const endIndex = lines.findIndex((line, index) => 
      index > startIndex && line.startsWith('===')
    );
    
    return lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex);
  }

  parseDatabasePerformance(lines) {
    // Parse database performance test results
    const results = {};
    
    lines.forEach(line => {
      const parts = line.trim().split('|').map(p => p.trim());
      if (parts.length >= 5) {
        const testName = parts[0];
        results[testName] = {
          avgTime: parseFloat(parts[1]) || 0,
          maxTime: parseFloat(parts[2]) || 0,
          minTime: parseFloat(parts[3]) || 0,
          totalTime: parseFloat(parts[4]) || 0
        };
      }
    });
    
    return results;
  }

  parseDatabaseResources(lines) {
    const resources = {};
    
    lines.forEach(line => {
      const parts = line.trim().split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const metric = parts[0];
        resources[metric] = {
          current: parseFloat(parts[1]) || 0,
          max: parseFloat(parts[2]) || null,
          percentage: parseFloat(parts[3]) || null
        };
      }
    });
    
    return resources;
  }

  assessConnectionPool(resourceData) {
    // Assess database connection pool health
    const connections = resourceData['Active Connections'];
    if (!connections) return 'unknown';
    
    if (connections.percentage > 80) {
      return 'critical - connection pool nearly exhausted';
    } else if (connections.percentage > 60) {
      return 'warning - high connection usage';
    } else {
      return 'healthy';
    }
  }

  // Generate comprehensive report
  generateReport() {
    const report = {
      ...this.analysis,
      executiveSummary: this.generateExecutiveSummary(),
      detailedFindings: this.generateDetailedFindings(),
      actionPlan: this.generateActionPlan()
    };
    
    return report;
  }

  generateExecutiveSummary() {
    const k6 = this.analysis.k6Results;
    const artillery = this.analysis.artilleryResults;
    
    return {
      overallHealth: this.analysis.criticalIssues.length === 0 ? 'Good' : 'Needs Attention',
      keyMetrics: {
        averageResponseTime: k6?.averageResponseTime || 'N/A',
        p95ResponseTime: k6?.p95ResponseTime || 'N/A',
        errorRate: k6?.errorRate || 'N/A',
        throughput: k6?.throughput || 'N/A'
      },
      primaryConcerns: this.analysis.criticalIssues.slice(0, 3),
      capacityAssessment: this.analysis.scalabilityInsights?.estimatedCapacity || 'Pending analysis'
    };
  }

  generateDetailedFindings() {
    return {
      performanceAnalysis: {
        responseTimeDistribution: this.analyzeResponseTimeDistribution(),
        endpointPerformance: this.analysis.k6Results?.endpointBreakdown || {},
        errorAnalysis: this.analyzeErrors()
      },
      scalabilityAnalysis: this.analysis.scalabilityInsights,
      reliabilityAnalysis: {
        errorPatterns: this.analyzeErrorPatterns(),
        availabilityMetrics: this.calculateAvailabilityMetrics()
      }
    };
  }

  generateActionPlan() {
    const actions = [];
    
    // Add critical issues as immediate actions
    this.analysis.criticalIssues.forEach(issue => {
      actions.push({
        priority: 'immediate',
        action: issue.recommendation,
        reason: issue.details,
        impact: 'high'
      });
    });
    
    // Add recommendations as planned actions
    this.analysis.recommendations.forEach(rec => {
      actions.push({
        priority: rec.priority || 'medium',
        action: rec.recommendation,
        reason: rec.details,
        impact: 'medium'
      });
    });
    
    // Add scalability recommendations
    if (this.analysis.scalabilityInsights?.recommendations) {
      this.analysis.scalabilityInsights.recommendations.forEach(rec => {
        actions.push({
          priority: 'planned',
          action: rec,
          reason: 'Scalability improvement',
          impact: 'medium'
        });
      });
    }
    
    return actions.sort((a, b) => {
      const priorityOrder = { immediate: 0, high: 1, medium: 2, planned: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Additional analysis methods
  analyzeResponseTimeDistribution() {
    const k6 = this.analysis.k6Results;
    if (!k6) return null;
    
    return {
      fast: k6.averageResponseTime < 200 ? 'Excellent' : 'Needs improvement',
      acceptable: k6.p95ResponseTime < 500 ? 'Good' : 'Poor',
      slow: k6.p99ResponseTime > 1000 ? 'Critical' : 'Acceptable'
    };
  }

  analyzeErrors() {
    // Placeholder for error analysis
    return {
      totalErrors: 0,
      errorTypes: [],
      errorTrends: 'stable'
    };
  }

  analyzeErrorPatterns() {
    // Placeholder for error pattern analysis
    return {
      timeBasedPatterns: 'none detected',
      endpointSpecificIssues: 'none detected',
      loadBasedFailures: 'none detected'
    };
  }

  calculateAvailabilityMetrics() {
    const k6 = this.analysis.k6Results;
    if (!k6) return null;
    
    const availability = 100 - k6.errorRate;
    return {
      availability: availability,
      uptime: availability > 99.9 ? 'Excellent' : availability > 99.5 ? 'Good' : 'Poor',
      target: '99.9%',
      current: `${availability.toFixed(2)}%`
    };
  }

  // Save analysis to file
  saveAnalysis(outputFile) {
    const report = this.generateReport();
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`📊 Analysis saved to: ${outputFile}`);
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const resultsDir = args[0] || './results';
  
  console.log('🔍 Analyzing load test results...');
  
  const analyzer = new PerformanceAnalyzer(resultsDir);
  
  // Find and analyze result files
  const files = fs.readdirSync(resultsDir);
  
  const k6File = files.find(f => f.includes('k6_comprehensive_load_test') && f.endsWith('.json'));
  const artilleryFile = files.find(f => f.includes('artillery_sustained_load') && f.endsWith('.json'));
  const dbFile = files.find(f => f.includes('database_stress_test') && f.endsWith('.txt'));
  
  if (k6File) {
    console.log(`📈 Analyzing k6 results: ${k6File}`);
    analyzer.analyzeK6Results(path.join(resultsDir, k6File));
  }
  
  if (artilleryFile) {
    console.log(`🎯 Analyzing Artillery results: ${artilleryFile}`);
    analyzer.analyzeArtilleryResults(path.join(resultsDir, artilleryFile));
  }
  
  if (dbFile) {
    console.log(`🗄️ Analyzing database results: ${dbFile}`);
    analyzer.analyzeDatabaseResults(path.join(resultsDir, dbFile));
  }
  
  // Generate and save final analysis
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(resultsDir, `performance_analysis_${timestamp}.json`);
  
  const finalReport = analyzer.saveAnalysis(outputFile);
  
  // Print executive summary
  console.log('\n📋 Executive Summary:');
  console.log(`Overall Health: ${finalReport.executiveSummary.overallHealth}`);
  console.log(`Average Response Time: ${finalReport.executiveSummary.keyMetrics.averageResponseTime}ms`);
  console.log(`Error Rate: ${finalReport.executiveSummary.keyMetrics.errorRate}%`);
  console.log(`Throughput: ${finalReport.executiveSummary.keyMetrics.throughput} RPS`);
  
  if (finalReport.executiveSummary.primaryConcerns.length > 0) {
    console.log('\n🚨 Primary Concerns:');
    finalReport.executiveSummary.primaryConcerns.forEach(concern => {
      console.log(`- ${concern.issue}: ${concern.details}`);
    });
  }
  
  console.log(`\n✅ Complete analysis available in: ${outputFile}`);
}

module.exports = PerformanceAnalyzer;