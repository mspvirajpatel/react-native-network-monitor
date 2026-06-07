import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import styleSheet, { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { LogEntry } from '../Logger';
import { Logger } from '../Logger';
import type { DeviceInfoData } from '../DeviceInfo';
import { generateExportReport, formatReportAsText } from '../ExportReport';
import { saveReportToJson, saveReportToText } from '../FileExporter';

interface SettingsPanelProps {
  baseUrls?: string[] | { title: string; url: string }[];
  prodUrl?: string;
  testUrl?: string;
  envConfig?: { currentEnv: string; onEnvChange: (newEnv: 'demo' | 'prod') => void };
  onBaseUrlChange?: (newUrl: string) => void;
  C: ThemeColors;
  t: Translation;
  baseUrl: string;
  manualUrl: string;
  selectedTheme: 'light' | 'dark' | 'auto';
  logs: LogEntry[];
  deviceInfo: DeviceInfoData;
  onSetBaseUrl: (url: string) => void;
  onSetManualUrl: (url: string) => void;
  onSetSelectedTheme: (theme: 'light' | 'dark' | 'auto') => void;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
}

/**
 * DeviceInfoSection
 *
 * Displays platform, device model, screen specs, and app version info.
 */
const DeviceInfoSection: React.FC<{
  info: DeviceInfoData;
  styles: ReturnType<typeof styleSheet>;
  t: Translation;
}> = ({ info, styles, t }) => (
  <View>
    <Text style={styles.deviceSectionTitle}>{t.device}</Text>
    <View style={styles.deviceRow}>
      <Text style={styles.deviceLabel}>{t.platform}</Text>
      <Text style={styles.deviceValue}>{info.platform} {info.osVersion}</Text>
    </View>
    <View style={styles.deviceRow}>
      <Text style={styles.deviceLabel}>{t.model}</Text>
      <Text style={styles.deviceValue}>{info.deviceName}</Text>
    </View>
    <View style={styles.deviceRow}>
      <Text style={styles.deviceLabel}>{t.screen}</Text>
      <Text style={styles.deviceValue}>{info.screenWidth}x{info.screenHeight} @{info.screenScale}x</Text>
    </View>
    <Text style={[styles.deviceSectionTitle, { marginTop: 24 }]}>{t.application}</Text>
    {info.appVersion && (
      <View style={styles.deviceRow}>
        <Text style={styles.deviceLabel}>{t.appVersion}</Text>
        <Text style={styles.deviceValue}>{info.appVersion}</Text>
      </View>
    )}
    {info.buildVersion && (
      <View style={styles.deviceRow}>
        <Text style={styles.deviceLabel}>{t.buildVersion}</Text>
        <Text style={styles.deviceValue}>{info.buildVersion}</Text>
      </View>
    )}
  </View>
);

/**
 * SettingsPanel
 *
 * Environment selection, custom URL management, theme toggles,
 * device info, and advanced tools (export, wipe).
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({
  baseUrls,
  prodUrl,
  testUrl,
  envConfig,
  onBaseUrlChange,
  C,
  t,
  baseUrl,
  manualUrl,
  selectedTheme,
  logs,
  deviceInfo,
  onSetBaseUrl,
  onSetManualUrl,
  onSetSelectedTheme,
  showError,
  showSuccess,
}) => {
  const styles = styleSheet(C);

  const predefinedList = baseUrls ? (Array.isArray(baseUrls) ? baseUrls : []) : [];
  const allCustoms = Logger.getCustomUrls();

  type SourceItem =
    | { title: string; url?: string; type: 'url'; val: string }
    | { title: string; url?: undefined; type: 'env'; val: 'prod' | 'demo' };
  const allSources: SourceItem[] = [];

  if (prodUrl) {
    allSources.push({ title: t.productionApi, url: prodUrl, type: 'url', val: prodUrl });
  }
  if (testUrl) {
    allSources.push({ title: t.testApi, url: testUrl, type: 'url', val: testUrl });
  }

  if (envConfig) {
    allSources.push({ title: t.productive, type: 'env', val: 'prod' });
    allSources.push({ title: t.demonstration, type: 'env', val: 'demo' });
  }

  predefinedList.forEach((item) => {
    const title = typeof item === 'string' ? item : item.title;
    const url = typeof item === 'string' ? item : item.url;
    allSources.push({ title, url, type: 'url', val: url });
  });

  allCustoms.forEach((item) => {
    allSources.push({ title: item.title, url: item.url, type: 'url', val: item.url });
  });

  /** Validate and apply a manual base URL */
  const handleSaveSettings = (): void => {
    const newUrl = manualUrl.trim();
    if (!newUrl) {
      showError(t.pleaseEnterUrl);
      return;
    }

    try {
      const parsed = new URL(newUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        showError(t.urlMustStartWith);
        return;
      }

      const host = parsed.hostname;
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
      const isLocal = host === 'localhost';
      const hasDot = host.includes('.');

      if (!isLocal && !isIp && !hasDot) {
        showError(t.invalidDomainFormat);
        return;
      }
    } catch (e) {
      showError(t.invalidUrlFormat);
      return;
    }

    Logger.setBaseUrl(newUrl);
    onSetBaseUrl(newUrl);

    Logger.addCustomUrl({ title: `Custom ${Logger.getCustomUrls().length + 1}`, url: newUrl });

    onSetManualUrl('');
    if (onBaseUrlChange) onBaseUrlChange(newUrl);
    showSuccess(t.newSourceApplied);
  };

  /** Remove a custom URL entry */
  const handleRemoveCustomUrl = (url: string): void => {
    Logger.removeCustomUrl(url);
    onSetBaseUrl(Logger.getBaseUrl());
  };

  /** Share JSON report */
  const handleExportJson = async (): Promise<void> => {
    try {
      const report = generateExportReport(logs);
      await Share.share({
        message: JSON.stringify(report, null, 2),
        title: t.reportTitle,
      });
    } catch (e) {
      showError(t.couldNotShareReport);
    }
  };

  /** Share text report */
  const handleExportText = async (): Promise<void> => {
    try {
      const report = generateExportReport(logs);
      const text = formatReportAsText(report);
      await Share.share({
        message: text,
        title: t.reportTitle,
      });
    } catch (e) {
      showError(t.couldNotShareReport);
    }
  };

  /** Confirm log wipe */
  const handleClearLogs = () => {
    Alert.alert(
      t.wipeAllRecords,
      'Are you sure you want to delete all captured logs? This cannot be undone.',
      [
        { text: t.cancel, style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Logger.clearLogs() },
      ]
    );
  };

  return (
    <ScrollView style={styles.settingsContainer}>
      {allSources.length > 0 ? (
        <View style={styles.settingsSection}>
          <View style={styles.settingsSectionHeader}>
            <View style={styles.settingsSectionLine} />
            <Text style={styles.settingsSectionTitle}>{t.selectSource}</Text>
          </View>
          <View style={styles.settingsCard}>
            {allSources.map((item: SourceItem, index: number) => {
              const isUrlActive = baseUrl !== '' && baseUrl === item.val;
              const isEnvActive =
                baseUrl === '' && item.type === 'env' && envConfig?.currentEnv === item.val;
              const isActive = item.type === 'env' ? isEnvActive : isUrlActive;

              const isCustom = allCustoms.some((u) => u.url === item.val);

              return (
                <View key={index} style={[styles.urlOption, isActive && styles.urlOptionActive]}>
                  <TouchableOpacity
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${item.title}${item.url ? `, ${item.url}` : ''}`}
                    style={styles.urlOptionInfo}
                    onPress={() => {
                      if (item.type === 'env') {
                        onSetBaseUrl('');
                        Logger.setBaseUrl('');
                        envConfig?.onEnvChange(item.val);
                      } else {
                        onSetBaseUrl(item.val);
                        Logger.setBaseUrl(item.val);
                        if (onBaseUrlChange) onBaseUrlChange(item.val);
                      }
                    }}
                  >
                    <Text
                      style={[styles.urlOptionTitle, isActive && styles.urlOptionTitleActive]}
                    >
                      {item.title}
                    </Text>
                    {item.url ? (
                      <Text style={styles.urlOptionUrl} numberOfLines={1}>
                        {item.url}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                  <View style={styles.optionActions}>
                    {isCustom ? (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.title}`}
                        style={styles.deleteBtn}
                        onPress={() => handleRemoveCustomUrl(item.val)}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    ) : null}
                    {isActive ? <View style={styles.activeDot} /> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={[styles.settingsSection, { marginTop: allSources.length > 0 ? 32 : 0 }]}>
        <View style={styles.settingsSectionHeader}>
          <View style={styles.settingsSectionLine} />
          <Text style={styles.settingsSectionTitle}>{t.manualEntry}</Text>
        </View>
        <View style={styles.settingsCard}>
          <View style={styles.cardInner}>
            <Text style={styles.inputLabel}>{t.customUrl?.toUpperCase() || ''}</Text>
            <TextInput
              style={styles.textInput}
              value={manualUrl}
              placeholder={t.manualUrlPlaceholder}
              placeholderTextColor={C.textDim}
              autoCapitalize="none"
              keyboardType="url"
              onChangeText={onSetManualUrl}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.applyChanges}
              style={styles.saveBtn}
              onPress={handleSaveSettings}
            >
              <Text style={styles.saveBtnText}>{t.applyChanges}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.settingsSection, { marginTop: 32 }]}>
          <View style={styles.settingsSectionHeader}>
            <View style={styles.settingsSectionLine} />
            <Text style={styles.settingsSectionTitle}>Theme</Text>
        </View>
        <View style={styles.settingsCard}>
          <View style={[styles.cardInner, { flexDirection: 'row', gap: 8 }]}>
            {(['light', 'dark', 'auto'] as const).map((mode) => {
              const active = selectedTheme === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`${mode} theme`}
                  activeOpacity={0.7}
                  onPress={() => onSetSelectedTheme(mode)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: active ? C.primary : C.surfaceLight,
                      borderColor: active ? C.primary : C.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      { color: active ? '#FFFFFF' : C.text },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.settingsSection, { marginTop: 32 }]}>
          <View style={styles.settingsSectionHeader}>
            <View style={styles.settingsSectionLine} />
            <Text style={styles.settingsSectionTitle}>{t.deviceInfo}</Text>
        </View>
        <View style={styles.settingsCard}>
          <View style={styles.cardInner}>
            <DeviceInfoSection info={deviceInfo} styles={styles} t={t} />
          </View>
        </View>
      </View>

      <View style={[styles.settingsSection, { marginTop: 32 }]}>
          <View style={styles.settingsSectionHeader}>
            <View style={styles.settingsSectionLine} />
            <Text style={styles.settingsSectionTitle}>{t.advancedTools}</Text>
        </View>
        <View style={styles.settingsCard}>
          <View style={styles.cardInner}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.shareJsonReport}
              style={[styles.toolBtn, { margin: 0, marginBottom: 12 }]}
              onPress={handleExportJson}
            >
              <Text style={styles.toolBtnText}>{t.shareJsonReport}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.shareTextReport}
              style={[styles.toolBtn, { margin: 0, marginBottom: 16 }]}
              onPress={handleExportText}
            >
              <Text style={styles.toolBtnText}>{t.shareTextReport}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.saveJsonReportToFile}
              style={[styles.toolBtn, { margin: 0, marginBottom: 12, borderColor: C.accent + '40' }]}
              onPress={() => saveReportToJson(logs)}
            >
              <Text style={[styles.toolBtnText, { color: C.accent }]}>{t.saveJsonReportToFile}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.saveTextReportToFile}
              style={[styles.toolBtn, { margin: 0, marginBottom: 16, borderColor: C.accent + '40' }]}
              onPress={() => saveReportToText(logs)}
            >
              <Text style={[styles.toolBtnText, { color: C.accent }]}>{t.saveTextReportToFile}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.wipeAllRecords}
              style={[styles.toolBtn, { margin: 0, borderColor: C.error + '40' }]}
              onPress={handleClearLogs}
            >
              <Text style={[styles.toolBtnText, { color: C.error }]}>{t.wipeAllRecords}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default SettingsPanel;
