import { Platform, Share } from 'react-native';
import { generateExportReport, formatReportAsText } from './ExportReport';
const reportToJson = logs => {
  const report = generateExportReport(logs);
  return JSON.stringify(report, null, 2);
};
const reportToText = logs => {
  const report = generateExportReport(logs);
  return formatReportAsText(report);
};
const timestamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};
const tryWriteExpoFs = async (path, content) => {
  try {
    const fs = require('expo-file-system');
    await fs.writeAsStringAsync(path, content, {
      encoding: fs.EncodingType.UTF8
    });
    return true;
  } catch (_) {
    return false;
  }
};
const tryWriteRNFS = async (path, content) => {
  try {
    const RNFS = require('react-native-fs');
    await RNFS.writeFile(path, content, 'utf8');
    return true;
  } catch (_) {
    return false;
  }
};
const tryShareExpo = async path => {
  try {
    const Sharing = require('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Save Network Report'
      });
      return true;
    }
  } catch (_) {}
  return false;
};
const shareFile = async (path, title) => {
  if (Platform.OS === 'ios') {
    try {
      await Share.share({
        url: path,
        title
      });
      return;
    } catch (_) {}
  }
  try {
    await Share.share({
      message: `file://${path}`,
      title
    });
  } catch (_) {}
};
const writeWithFallback = async (dir, filename, content) => {
  const path = `${dir}${filename}`;
  if (await tryWriteExpoFs(path, content)) return path;
  if (await tryWriteRNFS(path, content)) return path;
  return null;
};
export const saveReportToFile = async (logs, format = 'json') => {
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
  let savedPath = null;
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
    title: filename
  });
  return true;
};
export const saveReportToJson = logs => saveReportToFile(logs, 'json');
export const saveReportToText = logs => saveReportToFile(logs, 'text');
//# sourceMappingURL=FileExporter.js.map