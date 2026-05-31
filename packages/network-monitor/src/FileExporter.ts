import { Platform, Share, Alert } from 'react-native';
import { generateExportReport, formatReportAsText, ExportReport } from './ExportReport';
import { LogEntry } from './Logger';

const reportToJson = (logs: LogEntry[]): string => {
  const report = generateExportReport(logs);
  return JSON.stringify(report, null, 2);
};

const reportToText = (logs: LogEntry[]): string => {
  const report = generateExportReport(logs);
  return formatReportAsText(report);
};

const timestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

const tryWriteExpoFs = async (path: string, content: string): Promise<boolean> => {
  try {
    const fs = require('expo-file-system');
    await fs.writeAsStringAsync(path, content, {
      encoding: fs.EncodingType.UTF8,
    });
    return true;
  } catch (_) {
    return false;
  }
};

const tryWriteRNFS = async (path: string, content: string): Promise<boolean> => {
  try {
    const RNFS = require('react-native-fs');
    await RNFS.writeFile(path, content, 'utf8');
    return true;
  } catch (_) {
    return false;
  }
};

const tryShareExpo = async (path: string): Promise<boolean> => {
  try {
    const Sharing = require('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Save Network Report',
      });
      return true;
    }
  } catch (_) {}
  return false;
};

const shareFile = async (path: string, title: string): Promise<void> => {
  if (Platform.OS === 'ios') {
    try {
      await Share.share({ url: path, title });
      return;
    } catch (_) {}
  }
  try {
    await Share.share({ message: `file://${path}`, title });
  } catch (_) {}
};

const writeWithFallback = async (
  dir: string,
  filename: string,
  content: string,
): Promise<string | null> => {
  const path = `${dir}${filename}`;

  if (await tryWriteExpoFs(path, content)) return path;
  if (await tryWriteRNFS(path, content)) return path;

  return null;
};

export const saveReportToFile = async (
  logs: LogEntry[],
  format: 'json' | 'text' = 'json',
): Promise<boolean> => {
  const ts = timestamp();
  const filename = `network-report_${ts}.${format === 'json' ? 'json' : 'txt'}`;
  const content = format === 'json' ? reportToJson(logs) : reportToText(logs);

  const expoDocDir = (() => {
    try {
      const fs = require('expo-file-system');
      return fs.documentDirectory;
    } catch (_) {
      return null;
    }
  })();

  const rnfsDocDir = (() => {
    try {
      const RNFS = require('react-native-fs');
      return RNFS.DocumentDirectoryPath + '/';
    } catch (_) {
      return null;
    }
  })();

  let savedPath: string | null = null;

  if (expoDocDir) {
    savedPath = await writeWithFallback(expoDocDir, filename, content);
    if (savedPath) {
      if (await tryShareExpo(savedPath)) return true;
      await shareFile(savedPath, filename);
      return true;
    }
  }

  if (rnfsDocDir) {
    savedPath = await writeWithFallback(rnfsDocDir, filename, content);
    if (savedPath) {
      await shareFile(savedPath, filename);
      return true;
    }
  }

  await Share.share({
    message: content.substring(0, 50000),
    title: filename,
  });

  return true;
};

export const saveReportToJson = (logs: LogEntry[]) =>
  saveReportToFile(logs, 'json');

export const saveReportToText = (logs: LogEntry[]) =>
  saveReportToFile(logs, 'text');
