"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveReportToText = exports.saveReportToJson = exports.saveReportToFile = void 0;
var _reactNative = require("react-native");
var _ExportReport = require("./ExportReport");
const reportToJson = logs => {
  const report = (0, _ExportReport.generateExportReport)(logs);
  return JSON.stringify(report, null, 2);
};
const reportToText = logs => {
  const report = (0, _ExportReport.generateExportReport)(logs);
  return (0, _ExportReport.formatReportAsText)(report);
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
  if (_reactNative.Platform.OS === 'ios') {
    try {
      await _reactNative.Share.share({
        url: path,
        title
      });
      return;
    } catch (_) {}
  }
  try {
    await _reactNative.Share.share({
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
const saveReportToFile = async (logs, format = 'json') => {
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
  await _reactNative.Share.share({
    message: content.substring(0, 50000),
    title: filename
  });
  return true;
};
exports.saveReportToFile = saveReportToFile;
const saveReportToJson = logs => saveReportToFile(logs, 'json');
exports.saveReportToJson = saveReportToJson;
const saveReportToText = logs => saveReportToFile(logs, 'text');
exports.saveReportToText = saveReportToText;
//# sourceMappingURL=FileExporter.js.map