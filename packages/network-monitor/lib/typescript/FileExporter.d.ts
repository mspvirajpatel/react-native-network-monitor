import { LogEntry } from './Logger';
export declare const saveReportToFile: (logs: LogEntry[], format?: "json" | "text") => Promise<boolean>;
export declare const saveReportToJson: (logs: LogEntry[]) => Promise<boolean>;
export declare const saveReportToText: (logs: LogEntry[]) => Promise<boolean>;
//# sourceMappingURL=FileExporter.d.ts.map