import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import styleSheet from '../DebugMonitorStyles';
import { Logger } from '../Logger';
import { generateExportReport, formatReportAsText } from '../ExportReport';
import { saveReportToJson, saveReportToText } from '../FileExporter';
/**
 * DeviceInfoSection
 *
 * Displays platform, device model, screen specs, and app version info.
 */
const DeviceInfoSection = ({
  info,
  styles,
  t
}) => /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceSectionTitle
}, t.device), /*#__PURE__*/React.createElement(View, {
  style: styles.deviceRow
}, /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceLabel
}, t.platform), /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceValue
}, info.platform, " ", info.osVersion)), /*#__PURE__*/React.createElement(View, {
  style: styles.deviceRow
}, /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceLabel
}, t.model), /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceValue
}, info.deviceName)), /*#__PURE__*/React.createElement(View, {
  style: styles.deviceRow
}, /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceLabel
}, t.screen), /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceValue
}, info.screenWidth, "x", info.screenHeight, " @", info.screenScale, "x")), /*#__PURE__*/React.createElement(Text, {
  style: [styles.deviceSectionTitle, {
    marginTop: 24
  }]
}, t.application), info.appVersion && /*#__PURE__*/React.createElement(View, {
  style: styles.deviceRow
}, /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceLabel
}, t.appVersion), /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceValue
}, info.appVersion)), info.buildVersion && /*#__PURE__*/React.createElement(View, {
  style: styles.deviceRow
}, /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceLabel
}, t.buildVersion), /*#__PURE__*/React.createElement(Text, {
  style: styles.deviceValue
}, info.buildVersion)));

/**
 * SettingsPanel
 *
 * Environment selection, custom URL management, theme toggles,
 * device info, and advanced tools (export, wipe).
 */
const SettingsPanel = ({
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
  showSuccess
}) => {
  const styles = styleSheet(C);
  const predefinedList = baseUrls ? Array.isArray(baseUrls) ? baseUrls : [] : [];
  const allCustoms = Logger.getCustomUrls();
  const allSources = [];
  if (prodUrl) {
    allSources.push({
      title: t.productionApi,
      url: prodUrl,
      type: 'url',
      val: prodUrl
    });
  }
  if (testUrl) {
    allSources.push({
      title: t.testApi,
      url: testUrl,
      type: 'url',
      val: testUrl
    });
  }
  if (envConfig) {
    allSources.push({
      title: t.productive,
      type: 'env',
      val: 'prod'
    });
    allSources.push({
      title: t.demonstration,
      type: 'env',
      val: 'demo'
    });
  }
  predefinedList.forEach(item => {
    const title = typeof item === 'string' ? item : item.title;
    const url = typeof item === 'string' ? item : item.url;
    allSources.push({
      title,
      url,
      type: 'url',
      val: url
    });
  });
  allCustoms.forEach(item => {
    allSources.push({
      title: item.title,
      url: item.url,
      type: 'url',
      val: item.url
    });
  });

  /** Validate and apply a manual base URL */
  const handleSaveSettings = () => {
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
    Logger.addCustomUrl({
      title: `Custom ${Logger.getCustomUrls().length + 1}`,
      url: newUrl
    });
    onSetManualUrl('');
    if (onBaseUrlChange) onBaseUrlChange(newUrl);
    showSuccess(t.newSourceApplied);
  };

  /** Remove a custom URL entry */
  const handleRemoveCustomUrl = url => {
    Logger.removeCustomUrl(url);
    onSetBaseUrl(Logger.getBaseUrl());
  };

  /** Share JSON report */
  const handleExportJson = async () => {
    try {
      const report = generateExportReport(logs);
      await Share.share({
        message: JSON.stringify(report, null, 2),
        title: t.reportTitle
      });
    } catch (e) {
      showError(t.couldNotShareReport);
    }
  };

  /** Share text report */
  const handleExportText = async () => {
    try {
      const report = generateExportReport(logs);
      const text = formatReportAsText(report);
      await Share.share({
        message: text,
        title: t.reportTitle
      });
    } catch (e) {
      showError(t.couldNotShareReport);
    }
  };

  /** Confirm log wipe */
  const handleClearLogs = () => {
    Alert.alert(t.wipeAllRecords, 'Are you sure you want to delete all captured logs? This cannot be undone.', [{
      text: t.cancel,
      style: 'cancel'
    }, {
      text: 'Clear',
      style: 'destructive',
      onPress: () => Logger.clearLogs()
    }]);
  };
  return /*#__PURE__*/React.createElement(ScrollView, {
    style: styles.settingsContainer
  }, allSources.length > 0 ? /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSection
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/React.createElement(Text, {
    style: styles.settingsSectionTitle
  }, t.selectSource)), /*#__PURE__*/React.createElement(View, {
    style: styles.settingsCard
  }, allSources.map((item, index) => {
    const isUrlActive = baseUrl !== '' && baseUrl === item.val;
    const isEnvActive = baseUrl === '' && item.type === 'env' && envConfig?.currentEnv === item.val;
    const isActive = item.type === 'env' ? isEnvActive : isUrlActive;
    const isCustom = allCustoms.some(u => u.url === item.val);
    return /*#__PURE__*/React.createElement(View, {
      key: index,
      style: [styles.urlOption, isActive && styles.urlOptionActive]
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.urlOptionInfo,
      onPress: () => {
        if (item.type === 'env') {
          onSetBaseUrl('');
          Logger.setBaseUrl('');
          envConfig?.onEnvChange(item.val);
        } else {
          onSetBaseUrl(item.val);
          Logger.setBaseUrl(item.val);
          if (onBaseUrlChange) onBaseUrlChange(item.val);
        }
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.urlOptionTitle, isActive && styles.urlOptionTitleActive]
    }, item.title), item.url ? /*#__PURE__*/React.createElement(Text, {
      style: styles.urlOptionUrl,
      numberOfLines: 1
    }, item.url) : null), /*#__PURE__*/React.createElement(View, {
      style: styles.optionActions
    }, isCustom ? /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.deleteBtn,
      onPress: () => handleRemoveCustomUrl(item.val)
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deleteBtnText
    }, "\u2715")) : null, isActive ? /*#__PURE__*/React.createElement(View, {
      style: styles.activeDot
    }) : null));
  }))) : null, /*#__PURE__*/React.createElement(View, {
    style: [styles.settingsSection, {
      marginTop: allSources.length > 0 ? 32 : 0
    }]
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/React.createElement(Text, {
    style: styles.settingsSectionTitle
  }, t.manualEntry)), /*#__PURE__*/React.createElement(View, {
    style: styles.settingsCard
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.cardInner
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.inputLabel
  }, t.customUrl?.toUpperCase() || ''), /*#__PURE__*/React.createElement(TextInput, {
    style: styles.textInput,
    value: manualUrl,
    placeholder: t.manualUrlPlaceholder,
    placeholderTextColor: C.textDim,
    autoCapitalize: "none",
    keyboardType: "url",
    onChangeText: onSetManualUrl
  }), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: styles.saveBtn,
    onPress: handleSaveSettings
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.saveBtnText
  }, t.applyChanges))))), /*#__PURE__*/React.createElement(View, {
    style: [styles.settingsSection, {
      marginTop: 32
    }]
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/React.createElement(Text, {
    style: styles.settingsSectionTitle
  }, "Theme")), /*#__PURE__*/React.createElement(View, {
    style: styles.settingsCard
  }, /*#__PURE__*/React.createElement(View, {
    style: [styles.cardInner, {
      flexDirection: 'row',
      gap: 8
    }]
  }, ['light', 'dark', 'auto'].map(mode => {
    const active = selectedTheme === mode;
    return /*#__PURE__*/React.createElement(TouchableOpacity, {
      key: mode,
      activeOpacity: 0.7,
      onPress: () => onSetSelectedTheme(mode),
      style: [styles.optionChip, {
        backgroundColor: active ? C.primary : C.surfaceLight,
        borderColor: active ? C.primary : C.border
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.optionChipText, {
        color: active ? '#FFFFFF' : C.text
      }]
    }, mode.charAt(0).toUpperCase() + mode.slice(1)));
  })))), /*#__PURE__*/React.createElement(View, {
    style: [styles.settingsSection, {
      marginTop: 32
    }]
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/React.createElement(Text, {
    style: styles.settingsSectionTitle
  }, t.deviceInfo)), /*#__PURE__*/React.createElement(View, {
    style: styles.settingsCard
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.cardInner
  }, /*#__PURE__*/React.createElement(DeviceInfoSection, {
    info: deviceInfo,
    styles: styles,
    t: t
  })))), /*#__PURE__*/React.createElement(View, {
    style: [styles.settingsSection, {
      marginTop: 32
    }]
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/React.createElement(Text, {
    style: styles.settingsSectionTitle
  }, t.advancedTools)), /*#__PURE__*/React.createElement(View, {
    style: styles.settingsCard
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.cardInner
  }, /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      marginBottom: 12
    }],
    onPress: handleExportJson
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.toolBtnText
  }, t.shareJsonReport)), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      marginBottom: 16
    }],
    onPress: handleExportText
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.toolBtnText
  }, t.shareTextReport)), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      marginBottom: 12,
      borderColor: C.accent + '40'
    }],
    onPress: () => saveReportToJson(logs)
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.toolBtnText, {
      color: C.accent
    }]
  }, t.saveJsonReportToFile)), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      marginBottom: 16,
      borderColor: C.accent + '40'
    }],
    onPress: () => saveReportToText(logs)
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.toolBtnText, {
      color: C.accent
    }]
  }, t.saveTextReportToFile)), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      borderColor: C.error + '40'
    }],
    onPress: handleClearLogs
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.toolBtnText, {
      color: C.error
    }]
  }, t.wipeAllRecords))))), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 60
    }
  }));
};
export default SettingsPanel;
//# sourceMappingURL=SettingsPanel.js.map