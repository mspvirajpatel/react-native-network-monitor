"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _DebugMonitorStyles = _interopRequireDefault(require("../DebugMonitorStyles"));
var _Logger = require("../Logger");
var _ExportReport = require("../ExportReport");
var _FileExporter = require("../FileExporter");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * DeviceInfoSection
 *
 * Displays platform, device model, screen specs, and app version info.
 */
const DeviceInfoSection = ({
  info,
  styles,
  t
}) => /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceSectionTitle
}, t.device), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
  style: styles.deviceRow
}, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceLabel
}, t.platform), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceValue
}, info.platform, " ", info.osVersion)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
  style: styles.deviceRow
}, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceLabel
}, t.model), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceValue
}, info.deviceName)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
  style: styles.deviceRow
}, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceLabel
}, t.screen), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceValue
}, info.screenWidth, "x", info.screenHeight, " @", info.screenScale, "x")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: [styles.deviceSectionTitle, {
    marginTop: 24
  }]
}, t.application), info.appVersion && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
  style: styles.deviceRow
}, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceLabel
}, t.appVersion), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceValue
}, info.appVersion)), info.buildVersion && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
  style: styles.deviceRow
}, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
  style: styles.deviceLabel
}, t.buildVersion), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
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
  const styles = (0, _DebugMonitorStyles.default)(C);
  const predefinedList = baseUrls ? Array.isArray(baseUrls) ? baseUrls : [] : [];
  const allCustoms = _Logger.Logger.getCustomUrls();
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
    _Logger.Logger.setBaseUrl(newUrl);
    onSetBaseUrl(newUrl);
    _Logger.Logger.addCustomUrl({
      title: `Custom ${_Logger.Logger.getCustomUrls().length + 1}`,
      url: newUrl
    });
    onSetManualUrl('');
    if (onBaseUrlChange) onBaseUrlChange(newUrl);
    showSuccess(t.newSourceApplied);
  };

  /** Remove a custom URL entry */
  const handleRemoveCustomUrl = url => {
    _Logger.Logger.removeCustomUrl(url);
    onSetBaseUrl(_Logger.Logger.getBaseUrl());
  };

  /** Share JSON report */
  const handleExportJson = async () => {
    try {
      const report = (0, _ExportReport.generateExportReport)(logs);
      await _reactNative.Share.share({
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
      const report = (0, _ExportReport.generateExportReport)(logs);
      const text = (0, _ExportReport.formatReportAsText)(report);
      await _reactNative.Share.share({
        message: text,
        title: t.reportTitle
      });
    } catch (e) {
      showError(t.couldNotShareReport);
    }
  };

  /** Confirm log wipe */
  const handleClearLogs = () => {
    _reactNative.Alert.alert(t.wipeAllRecords, 'Are you sure you want to delete all captured logs? This cannot be undone.', [{
      text: t.cancel,
      style: 'cancel'
    }, {
      text: 'Clear',
      style: 'destructive',
      onPress: () => _Logger.Logger.clearLogs()
    }]);
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    style: styles.settingsContainer
  }, allSources.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSection
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.settingsSectionTitle
  }, t.selectSource)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsCard
  }, allSources.map((item, index) => {
    const isUrlActive = baseUrl !== '' && baseUrl === item.val;
    const isEnvActive = baseUrl === '' && item.type === 'env' && envConfig?.currentEnv === item.val;
    const isActive = item.type === 'env' ? isEnvActive : isUrlActive;
    const isCustom = allCustoms.some(u => u.url === item.val);
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: index,
      style: [styles.urlOption, isActive && styles.urlOptionActive]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: styles.urlOptionInfo,
      onPress: () => {
        if (item.type === 'env') {
          onSetBaseUrl('');
          _Logger.Logger.setBaseUrl('');
          envConfig?.onEnvChange(item.val);
        } else {
          onSetBaseUrl(item.val);
          _Logger.Logger.setBaseUrl(item.val);
          if (onBaseUrlChange) onBaseUrlChange(item.val);
        }
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.urlOptionTitle, isActive && styles.urlOptionTitleActive]
    }, item.title), item.url ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.urlOptionUrl,
      numberOfLines: 1
    }, item.url) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.optionActions
    }, isCustom ? /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: styles.deleteBtn,
      onPress: () => handleRemoveCustomUrl(item.val)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deleteBtnText
    }, "\u2715")) : null, isActive ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.activeDot
    }) : null));
  }))) : null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.settingsSection, {
      marginTop: allSources.length > 0 ? 32 : 0
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.settingsSectionTitle
  }, t.manualEntry)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.cardInner
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.inputLabel
  }, t.customUrl?.toUpperCase() || ''), /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    style: styles.textInput,
    value: manualUrl,
    placeholder: t.manualUrlPlaceholder,
    placeholderTextColor: C.textDim,
    autoCapitalize: "none",
    keyboardType: "url",
    onChangeText: onSetManualUrl
  }), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: styles.saveBtn,
    onPress: handleSaveSettings
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.saveBtnText
  }, t.applyChanges))))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.settingsSection, {
      marginTop: 32
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.settingsSectionTitle
  }, "Theme")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.cardInner, {
      flexDirection: 'row',
      gap: 8
    }]
  }, ['light', 'dark', 'auto'].map(mode => {
    const active = selectedTheme === mode;
    return /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      key: mode,
      activeOpacity: 0.7,
      onPress: () => onSetSelectedTheme(mode),
      style: [styles.optionChip, {
        backgroundColor: active ? C.primary : C.surfaceLight,
        borderColor: active ? C.primary : C.border
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.optionChipText, {
        color: active ? '#FFFFFF' : C.text
      }]
    }, mode.charAt(0).toUpperCase() + mode.slice(1)));
  })))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.settingsSection, {
      marginTop: 32
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.settingsSectionTitle
  }, t.deviceInfo)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.cardInner
  }, /*#__PURE__*/_react.default.createElement(DeviceInfoSection, {
    info: deviceInfo,
    styles: styles,
    t: t
  })))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.settingsSection, {
      marginTop: 32
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsSectionLine
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.settingsSectionTitle
  }, t.advancedTools)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.settingsCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.cardInner
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      marginBottom: 12
    }],
    onPress: handleExportJson
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.toolBtnText
  }, t.shareJsonReport)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      marginBottom: 16
    }],
    onPress: handleExportText
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.toolBtnText
  }, t.shareTextReport)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      marginBottom: 12,
      borderColor: C.accent + '40'
    }],
    onPress: () => (0, _FileExporter.saveReportToJson)(logs)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.toolBtnText, {
      color: C.accent
    }]
  }, t.saveJsonReportToFile)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      marginBottom: 16,
      borderColor: C.accent + '40'
    }],
    onPress: () => (0, _FileExporter.saveReportToText)(logs)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.toolBtnText, {
      color: C.accent
    }]
  }, t.saveTextReportToFile)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: [styles.toolBtn, {
      margin: 0,
      borderColor: C.error + '40'
    }],
    onPress: handleClearLogs
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.toolBtnText, {
      color: C.error
    }]
  }, t.wipeAllRecords))))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      height: 60
    }
  }));
};
var _default = exports.default = SettingsPanel;
//# sourceMappingURL=SettingsPanel.js.map