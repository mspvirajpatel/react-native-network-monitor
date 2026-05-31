import { LogEntry } from './Logger';
export interface ExportReport {
    generatedAt: string;
    app: {
        platform: string;
        osVersion: string;
        deviceName: string;
        screenWidth: number;
        screenHeight: number;
        screenScale: number;
        appVersion?: string;
    };
    summary: {
        totalLogs: number;
        networkRequests: number;
        consoleLogs: number;
        webSocketEvents: number;
        performanceEntries: number;
        errors: number;
        avgResponseTimeMs: number;
        maxResponseTimeMs: number;
        minResponseTimeMs: number;
        sessionDurationMs: number;
        byType: Record<string, number>;
    };
    network: {
        byMethod: Record<string, number>;
        byStatus: Record<string, number>;
        successCount: number;
        errorCount: number;
        timeouts: number;
        redirectedCount: number;
    };
    topLatency: LogEntry[];
    errors: LogEntry[];
    logs: LogEntry[];
    timeline: {
        timestamp: string;
        type: string;
        method?: string;
        status?: number;
        url?: string;
        message?: string;
        durationMs?: number;
    }[];
}
export declare const generateExportReport: (logs: LogEntry[]) => ExportReport;
export declare const formatReportAsText: (report: ExportReport) => string;
//# sourceMappingURL=ExportReport.d.ts.map