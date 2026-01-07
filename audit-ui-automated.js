/**
 * Automated UI Audit Tool
 * Checks production pages for common UI issues
 */

const BASE_URL = 'https://tripavailweb-web.vercel.app';

const issues = [];
let testsPassed = 0;
let testsFailed = 0;

function log(status, category, issue, page, severity = 'MEDIUM') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} [${severity}] ${category}: ${issue}`);
  
  if (status === 'FAIL') {
    issues.push({ page, category, issue, severity });
    testsFailed++;
  } else if (status === 'PASS') {
    testsPassed++;
  }
}

async function fetchPage(path) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url);
    const html = await response.text();
    return { status: response.status, html, url };
  } catch (error) {
    return { status: 0, html: '', url, error: error.message };
  }
}

// Test 1: Typography Consistency
function checkTypography(html, page) {
  const h1Matches = html.match(/text-([\d]+xl)/g) || [];
  const uniqueSizes = [...new Set(h1Matches)];
  
  if (uniqueSizes.length > 6) {
    log('FAIL', 'Typography', `Too many font sizes (${uniqueSizes.length}) - should have 4-5 max`, page, 'CRITICAL');
  } else {
    log('PASS', 'Typography', 'Reasonable number of font sizes', page);
  }
  
  // Check for inconsistent line-height
  if (html.includes('leading-') && html.includes('line-height')) {
    log('FAIL', 'Typography', 'Mixed Tailwind and inline line-height styles', page, 'MEDIUM');
  } else {
    log('PASS', 'Typography', 'Consistent line-height approach', page);
  }
}

// Test 2: Button Consistency
function checkButtons(html, page) {
  const buttonPatterns = html.match(/className="[^"]*btn|button|px-\d+ py-\d+[^"]*"/g) || [];
  const bgColors = html.match(/bg-(blue|green|red|gray|neutral)-\d+/g) || [];
  const uniqueColors = [...new Set(bgColors)];
  
  if (uniqueColors.length > 8) {
    log('FAIL', 'Buttons', `Too many button colors (${uniqueColors.length}) - need design system`, page, 'CRITICAL');
  } else {
    log('PASS', 'Buttons', 'Reasonable button color palette', page);
  }
  
  // Check for transition classes
  const hasTransitions = html.includes('transition');
  if (!hasTransitions && buttonPatterns.length > 0) {
    log('FAIL', 'Buttons', 'Buttons missing transition effects', page, 'LOW');
  } else if (hasTransitions) {
    log('PASS', 'Buttons', 'Buttons have transitions', page);
  }
}

// Test 3: Spacing Consistency
function checkSpacing(html, page) {
  const margins = html.match(/m[tbrlxy]?-\d+/g) || [];
  const paddings = html.match(/p[tbrlxy]?-\d+/g) || [];
  
  // Check if using 8pt grid (multiples of 2: 2, 4, 6, 8, 10, 12, 16, 20, 24, 32)
  const allSpacing = [...margins, ...paddings];
  const oddNumbers = allSpacing.filter(s => {
    const num = parseInt(s.match(/\d+/)[0]);
    return num % 2 !== 0 && num > 1; // 1 is ok, but 3, 5, 7, 9 are not
  });
  
  if (oddNumbers.length > 5) {
    log('FAIL', 'Spacing', `Found ${oddNumbers.length} odd spacing values - not following 8pt grid`, page, 'MEDIUM');
  } else {
    log('PASS', 'Spacing', 'Mostly following consistent spacing', page);
  }
}

// Test 4: Loading States
function checkLoadingStates(html, page) {
  const hasSkeletons = html.includes('skeleton') || html.includes('animate-pulse');
  const hasLoadingText = html.includes('Loading');
  const hasSpinner = html.includes('spinner') || html.includes('rotate');
  
  if (!hasSkeletons && !hasSpinner && hasLoadingText) {
    log('FAIL', 'Loading', 'Only text loading state - needs skeleton/spinner', page, 'MEDIUM');
  } else if (hasSkeletons || hasSpinner) {
    log('PASS', 'Loading', 'Has proper loading indicators', page);
  }
}

// Test 5: Empty States
function checkEmptyStates(html, page) {
  const hasEmptyMessage = html.includes('No ') || html.includes('empty') || html.includes('not found');
  const hasEmptyIllustration = html.includes('text-6xl') || html.includes('text-5xl');
  
  if (hasEmptyMessage && !hasEmptyIllustration) {
    log('FAIL', 'Empty State', 'Empty states lack illustration/icon', page, 'LOW');
  } else if (hasEmptyMessage && hasEmptyIllustration) {
    log('PASS', 'Empty State', 'Has proper empty state design', page);
  }
}

// Test 6: Mobile Responsiveness
function checkMobileResponsiveness(html, page) {
  const hasMobileClasses = html.includes('md:') || html.includes('sm:') || html.includes('lg:');
  const hasOverflowProtection = html.includes('overflow-x-auto') || html.includes('overflow-hidden');
  
  if (!hasMobileClasses) {
    log('FAIL', 'Mobile', 'No responsive classes found - may break on mobile', page, 'CRITICAL');
  } else {
    log('PASS', 'Mobile', 'Has responsive breakpoints', page);
  }
  
  // Check for tables without overflow protection
  const hasTables = html.includes('<table');
  if (hasTables && !hasOverflowProtection) {
    log('FAIL', 'Mobile', 'Tables without overflow protection - will break on mobile', page, 'CRITICAL');
  }
}

// Test 7: Accessibility
function checkAccessibility(html, page) {
  const hasAltTags = html.includes('alt=');
  const hasAriaLabels = html.includes('aria-label') || html.includes('aria-');
  const hasSemanticHTML = html.includes('<nav') && html.includes('<main') && html.includes('<header');
  
  if (!hasSemanticHTML) {
    log('FAIL', 'Accessibility', 'Missing semantic HTML (nav/main/header)', page, 'MEDIUM');
  } else {
    log('PASS', 'Accessibility', 'Has semantic HTML structure', page);
  }
}

// Test 8: Performance
function checkPerformance(html, page) {
  const htmlSize = new Blob([html]).size / 1024; // KB
  
  if (htmlSize > 500) {
    log('FAIL', 'Performance', `Large HTML size (${htmlSize.toFixed(0)}KB) - may be slow`, page, 'MEDIUM');
  } else {
    log('PASS', 'Performance', `HTML size reasonable (${htmlSize.toFixed(0)}KB)`, page);
  }
  
  // Check for inline styles (bad practice)
  const inlineStyles = html.match(/style="/g) || [];
  if (inlineStyles.length > 10) {
    log('FAIL', 'Performance', `Too many inline styles (${inlineStyles.length}) - use Tailwind`, page, 'LOW');
  }
}

async function auditPage(path, pageName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 Auditing: ${pageName} (${path})`);
  console.log('='.repeat(60));
  
  const { status, html, url } = await fetchPage(path);
  
  if (status !== 200) {
    log('FAIL', 'Availability', `Page returned ${status}`, pageName, 'CRITICAL');
    return;
  }
  
  log('PASS', 'Availability', 'Page loads successfully', pageName);
  
  checkTypography(html, pageName);
  checkButtons(html, pageName);
  checkSpacing(html, pageName);
  checkLoadingStates(html, pageName);
  checkEmptyStates(html, pageName);
  checkMobileResponsiveness(html, pageName);
  checkAccessibility(html, pageName);
  checkPerformance(html, pageName);
}

async function runAudit() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 AUTOMATED UI AUDIT');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  const pages = [
    ['/', 'Homepage'],
    ['/traveler/discovery', 'Discovery Page'],
    ['/host', 'Host Dashboard'],
    ['/operator/tours', 'Operator Tours'],
    ['/admin/providers', 'Admin Providers'],
  ];
  
  for (const [path, name] of pages) {
    await auditPage(path, name);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📝 Total Issues: ${issues.length}`);
  
  // Group by severity
  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  const low = issues.filter(i => i.severity === 'LOW');
  
  console.log(`\n🔴 CRITICAL Issues: ${critical.length}`);
  critical.forEach(i => console.log(`   - ${i.page}: ${i.issue}`));
  
  console.log(`\n🟡 MEDIUM Issues: ${medium.length}`);
  medium.forEach(i => console.log(`   - ${i.page}: ${i.issue}`));
  
  console.log(`\n🟢 LOW Issues: ${low.length}`);
  low.forEach(i => console.log(`   - ${i.page}: ${i.issue}`));
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 RECOMMENDED ACTION');
  console.log('='.repeat(60));
  
  if (critical.length === 0 && medium.length <= 3) {
    console.log('✅ UI is in good shape! Fix medium issues if time allows.');
  } else if (critical.length <= 2) {
    console.log('⚠️  Fix critical issues first (1-2 hours), then move to payments.');
  } else if (critical.length <= 5) {
    console.log('🚨 Multiple critical issues. Allocate 1 day to fix, then payments.');
  } else {
    console.log('🔥 Major UI overhaul needed. Consider 1-week sprint.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📝 Next: Open browser and do manual visual audit');
  console.log('   - Check actual look & feel');
  console.log('   - Test interactions (clicks, hovers)');
  console.log('   - Verify mobile on real device');
  console.log('='.repeat(60) + '\n');
}

runAudit().catch(console.error);
