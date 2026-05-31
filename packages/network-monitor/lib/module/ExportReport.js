import { getDeviceInfo } from './DeviceInfo';
export const generateExportReport = logs => {
  const deviceInfo = getDeviceInfo();
  const now = new Date().toISOString();
  const timestamps = logs.map(l => new Date(l.timestamp).getTime()).filter(t => !isNaN(t)).sort();
  const sessionStart = timestamps.length > 0 ? timestamps[0] : Date.now();
  const sessionDurationMs = Date.now() - sessionStart;
  const networkLogs = logs.filter(l => l.type === 'request' || l.type === 'response' || l.type === 'error' && l.url);
  const consoleLogs = logs.filter(l => l.type === 'info' || l.type === 'error' && !l.url);
  const wsLogs = logs.filter(l => l.type === 'websocket');
  const perfLogs = logs.filter(l => l.type === 'performance');
  const errorLogs = logs.filter(l => l.type === 'error' || l.status && l.status >= 400);
  const responseTimes = networkLogs.filter(l => l.durationMs !== undefined && l.durationMs !== null).map(l => l.durationMs);
  const avg = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
  const maxResp = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
  const minResp = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const byMethod = {};
  const byStatus = {};
  let successCount = 0;
  let errorCount = 0;
  let timeouts = 0;
  let redirectedCount = 0;
  networkLogs.forEach(l => {
    if (l.method) {
      byMethod[l.method] = (byMethod[l.method] || 0) + 1;
    }
    if (l.status !== undefined) {
      const code = l.status >= 400 ? '4xx/5xx' : l.status >= 300 ? '3xx' : l.status >= 200 ? '2xx' : '1xx';
      byStatus[code] = (byStatus[code] || 0) + 1;
      if (l.status >= 200 && l.status < 400) successCount++;else if (l.status >= 400) errorCount++;
    }
    if (l.isRedirected) redirectedCount++;
  });
  const byType = {};
  logs.forEach(l => {
    byType[l.type] = (byType[l.type] || 0) + 1;
  });
  const topLatency = [...logs].filter(l => l.durationMs !== undefined && l.durationMs !== null).sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0)).slice(0, 10);
  const timeline = logs.map(l => ({
    timestamp: l.timestamp,
    type: l.type,
    method: l.method,
    status: l.status,
    url: l.url,
    message: l.message,
    durationMs: l.durationMs
  })).reverse();
  return {
    generatedAt: now,
    app: {
      platform: deviceInfo.platform,
      osVersion: deviceInfo.osVersion,
      deviceName: deviceInfo.deviceName,
      screenWidth: deviceInfo.screenWidth,
      screenHeight: deviceInfo.screenHeight,
      screenScale: deviceInfo.screenScale,
      appVersion: deviceInfo.appVersion
    },
    summary: {
      totalLogs: logs.length,
      networkRequests: networkLogs.length,
      consoleLogs: consoleLogs.length,
      webSocketEvents: wsLogs.length,
      performanceEntries: perfLogs.length,
      errors: errorLogs.length,
      avgResponseTimeMs: avg,
      maxResponseTimeMs: maxResp,
      minResponseTimeMs: minResp,
      sessionDurationMs,
      byType
    },
    network: {
      byMethod,
      byStatus,
      successCount,
      errorCount,
      timeouts,
      redirectedCount
    },
    topLatency,
    errors: errorLogs.slice(0, 50),
    logs,
    timeline
  };
};
export const formatReportAsText = report => {
  const lines = [];
  const sep = '='.repeat(60);
  const sub = '-'.repeat(40);
  lines.push(sep);
  lines.push('  NETWORK MONITOR EXPORT REPORT');
  lines.push(`  Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push(sep);
  lines.push('');
  lines.push('── APP / DEVICE ──');
  lines.push(`  Platform:     ${report.app.platform} ${report.app.osVersion}`);
  lines.push(`  Device:       ${report.app.deviceName}`);
  lines.push(`  Screen:       ${report.app.screenWidth}x${report.app.screenHeight} @${report.app.screenScale}x`);
  if (report.app.appVersion) lines.push(`  App Version:  ${report.app.appVersion}`);
  lines.push('');
  lines.push('── SUMMARY ──');
  lines.push(`  Total Logs:           ${report.summary.totalLogs}`);
  lines.push(`  Network Requests:     ${report.summary.networkRequests}`);
  lines.push(`  Console Logs:         ${report.summary.consoleLogs}`);
  lines.push(`  WebSocket Events:     ${report.summary.webSocketEvents}`);
  lines.push(`  Performance Entries:  ${report.summary.performanceEntries}`);
  lines.push(`  Errors:               ${report.summary.errors}`);
  lines.push(`  Session Duration:     ${(report.summary.sessionDurationMs / 1000).toFixed(1)}s`);
  lines.push(`  Avg Response Time:    ${report.summary.avgResponseTimeMs}ms`);
  lines.push(`  Max Response Time:    ${report.summary.maxResponseTimeMs}ms`);
  lines.push(`  Min Response Time:    ${report.summary.minResponseTimeMs}ms`);
  lines.push('');
  lines.push('── NETWORK BREAKDOWN ──');
  lines.push(`  Success (2xx/3xx):    ${report.network.successCount}`);
  lines.push(`  Errors (4xx/5xx):     ${report.network.errorCount}`);
  lines.push(`  Redirected Requests:  ${report.network.redirectedCount}`);
  lines.push(`  By Method: ${JSON.stringify(report.network.byMethod)}`);
  lines.push(`  By Status: ${JSON.stringify(report.network.byStatus)}`);
  lines.push('');
  if (report.topLatency.length > 0) {
    lines.push('── SLOWEST REQUESTS (top 10) ──');
    report.topLatency.forEach((l, i) => {
      lines.push(`  ${i + 1}. [${l.durationMs}ms] ${l.method || '?'} ${l.url || l.message || ''}`);
    });
    lines.push('');
  }
  if (report.errors.length > 0) {
    lines.push('── ERRORS ──');
    report.errors.slice(0, 20).forEach(l => {
      lines.push(`  • ${l.method || ''} ${l.url || ''} ${l.status ? `(${l.status})` : ''} ${l.message || ''}`);
    });
    lines.push('');
  }
  lines.push('── TIMELINE ──');
  report.timeline.slice(0, 50).forEach(t => {
    const time = new Date(t.timestamp).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const tag = (t.method || t.type || '?').padEnd(8);
    const info = t.url || t.message || '';
    lines.push(`  ${time}  ${tag}  ${info}`);
  });
  if (report.timeline.length > 50) {
    lines.push(`  ... and ${report.timeline.length - 50} more entries`);
  }
  lines.push('');
  lines.push(sep);
  return lines.join('\n');
};
//# sourceMappingURL=ExportReport.js.map