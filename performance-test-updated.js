const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 DEBY E-COMMERCE PERFORMANCE RE-TEST');
console.log('======================================\n');

// Test server connectivity first
console.log('🌐 SERVER CONNECTIVITY TEST');
console.log('-----------------------------');

function testServer(port, name) {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`powershell "Test-NetConnection -ComputerName localhost -Port ${port} | Select-Object TcpTestSucceeded"`, { timeout: 5000 });
    const output = result.toString();
    
    if (output.includes('True')) {
      console.log(`✅ ${name} (port ${port}): Running`);
      return true;
    } else {
      console.log(`❌ ${name} (port ${port}): Not accessible`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} (port ${port}): Connection failed`);
    return false;
  }
}

const frontendRunning = testServer(4001, 'Frontend Server');
const backendRunning = testServer(5000, 'Backend Server');

// Bundle Size Analysis
console.log('\n📦 BUNDLE SIZE ANALYSIS (POST-OPTIMIZATION)');
console.log('---------------------------------------------');

const distPath = path.join(__dirname, 'frontend', 'dist');
const jsPath = path.join(distPath, 'js');
const assetsPath = path.join(distPath, 'assets');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ ${label} directory not found`);
    return { totalSize: 0, files: [] };
  }

  const files = fs.readdirSync(dirPath);
  let totalSize = 0;
  const fileAnalysis = [];

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && !file.includes('.map')) {
      const size = stats.size;
      totalSize += size;
      fileAnalysis.push({
        name: file,
        size: size,
        formatted: formatBytes(size)
      });
    }
  });

  fileAnalysis.sort((a, b) => b.size - a.size);

  console.log(`\n${label}:`);
  console.log(`Total Size: ${formatBytes(totalSize)}`);
  console.log(`File Count: ${fileAnalysis.length}`);
  
  // Show top 10 largest files
  console.log('\nLargest Files:');
  fileAnalysis.slice(0, 10).forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.name} - ${file.formatted}`);
  });

  return { totalSize, files: fileAnalysis };
}

const jsAnalysis = analyzeDirectory(jsPath, 'JavaScript Files');
const assetsAnalysis = analyzeDirectory(assetsPath, 'CSS & Assets');
const totalBundleSize = jsAnalysis.totalSize + assetsAnalysis.totalSize;

console.log(`\n🎯 TOTAL BUNDLE SIZE: ${formatBytes(totalBundleSize)}`);

// Performance Score Calculation
console.log('\n\n🎯 UPDATED PERFORMANCE SCORE');
console.log('-----------------------------');

let score = 100;
let improvements = [];
let issues = [];

// Server connectivity scoring
if (frontendRunning && backendRunning) {
  improvements.push('✅ Both servers running correctly');
} else {
  if (!frontendRunning) {
    score -= 25;
    issues.push('Frontend server not accessible');
  }
  if (!backendRunning) {
    score -= 25;
    issues.push('Backend server not accessible');
  }
}

// Bundle size scoring
const bundleSizeMB = totalBundleSize / (1024 * 1024);
if (bundleSizeMB > 2) {
  score -= 15;
  issues.push(`Large bundle size: ${formatBytes(totalBundleSize)}`);
} else if (bundleSizeMB > 1.5) {
  score -= 10;
  issues.push(`Moderate bundle size: ${formatBytes(totalBundleSize)}`);
} else {
  improvements.push(`✅ Good bundle size: ${formatBytes(totalBundleSize)}`);
}

// Check for compression
const hasCompression = jsAnalysis.files.some(file => file.name.includes('.br'));
if (hasCompression) {
  improvements.push('✅ Brotli compression enabled');
} else {
  score -= 5;
  issues.push('No compression detected');
}

// Check for code splitting
const hasCodeSplitting = jsAnalysis.files.length > 10;
if (hasCodeSplitting) {
  improvements.push('✅ Code splitting implemented');
} else {
  score -= 10;
  issues.push('Limited code splitting');
}

console.log(`Overall Performance Score: ${score}/100`);

if (score >= 90) {
  console.log('🟢 Excellent performance!');
} else if (score >= 75) {
  console.log('🟡 Good performance!');
} else if (score >= 60) {
  console.log('🟡 Acceptable performance with room for improvement');
} else {
  console.log('🔴 Performance needs attention');
}

console.log('\n📈 IMPROVEMENTS MADE:');
improvements.forEach(improvement => console.log(improvement));

if (issues.length > 0) {
  console.log('\n⚠️ REMAINING ISSUES:');
  issues.forEach(issue => console.log(`  • ${issue}`));
}

// API Test
console.log('\n\n🔌 API CONNECTIVITY TEST');
console.log('-------------------------');

if (backendRunning) {
  try {
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    try {
      const healthResult = execSync('curl -s http://localhost:5000/api/health', { timeout: 5000 });
      console.log('✅ Health endpoint: Accessible');
    } catch (error) {
      console.log('⚠️ Health endpoint: Not configured');
    }
    
    // Test products endpoint
    try {
      const productsResult = execSync('curl -s http://localhost:5000/api/products', { timeout: 5000 });
      console.log('✅ Products API: Accessible');
    } catch (error) {
      console.log('⚠️ Products API: Connection issue');
    }
    
  } catch (error) {
    console.log('❌ API testing failed');
  }
} else {
  console.log('❌ Backend server not running - skipping API tests');
}

// Performance Recommendations
console.log('\n\n⚡ NEXT OPTIMIZATION STEPS');
console.log('---------------------------');

const nextSteps = [];

if (bundleSizeMB > 1.5) {
  nextSteps.push('🎯 Further reduce bundle size with tree shaking');
}

if (!hasCompression) {
  nextSteps.push('🗜️ Enable compression for all assets');
}

nextSteps.push('📱 Run mobile performance audit');
nextSteps.push('🚀 Set up production deployment');
nextSteps.push('📊 Implement performance monitoring');

nextSteps.forEach(step => console.log(step));

console.log('\n\n🎉 TESTING COMPLETE!');
console.log('====================');
console.log(`Frontend: http://localhost:4001 ${frontendRunning ? '✅' : '❌'}`);
console.log(`Backend: http://localhost:5000 ${backendRunning ? '✅' : '❌'}`);
console.log(`Bundle Size: ${formatBytes(totalBundleSize)}`);
console.log(`Performance Score: ${score}/100`);

if (frontendRunning && backendRunning && score >= 75) {
  console.log('\n🚀 READY FOR PRODUCTION DEPLOYMENT!');
} else if (frontendRunning && backendRunning) {
  console.log('\n✅ Application is functional - optimization recommended');
} else {
  console.log('\n⚠️ Fix server issues before deployment');
}
