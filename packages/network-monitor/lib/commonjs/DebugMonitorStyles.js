"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getColors = exports.default = exports.LIGHT_COLORS = exports.DARK_COLORS = exports.COLORS = void 0;
var _reactNative = require("react-native");
/* eslint-disable react-native/sort-styles */

const DARK_COLORS = exports.DARK_COLORS = {
  background: '#020617',
  surface: '#0F172A',
  surfaceLight: '#1E293B',
  surfaceElevated: '#334155',
  primary: '#38BDF8',
  secondary: '#94A3B8',
  text: '#F8FAFC',
  textDim: '#94A3B8',
  textSubtle: '#475569',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F43F5E',
  border: '#1E293B',
  accent: '#A855F7',
  glass: 'rgba(15, 23, 42, 0.6)',
  highlight: 'rgba(255,255,255,0.04)',
  transparent: 'transparent',
  shadow: '#000000',
  overlay: 'rgba(2, 6, 23, 0.92)',
  jsonText: '#34D399'
};
const LIGHT_COLORS = exports.LIGHT_COLORS = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceLight: '#F8FAFC',
  surfaceElevated: '#E2E8F0',
  primary: '#0EA5E9',
  secondary: '#64748B',
  text: '#0F172A',
  textDim: '#64748B',
  textSubtle: '#94A3B8',
  success: '#059669',
  warning: '#D97706',
  error: '#E11D48',
  border: '#E2E8F0',
  accent: '#9333EA',
  glass: 'rgba(241, 245, 249, 0.8)',
  highlight: 'rgba(0,0,0,0.04)',
  transparent: 'transparent',
  shadow: '#64748B',
  overlay: 'rgba(15, 23, 42, 0.7)',
  jsonText: '#047857'
};

/**
 * getColors
 *
 * Resolve the color palette for a given theme.
 * @param theme - 'dark' | 'light'
 * @returns ThemeColors palette
 */
const getColors = theme => theme === 'light' ? LIGHT_COLORS : DARK_COLORS;

// Backwards-compat export (dark palette)
exports.getColors = getColors;
const COLORS = exports.COLORS = DARK_COLORS;

/**
 * styleSheet
 *
 * Centralized styles for the Debug Monitor component.
 * Accepts the resolved ThemeColors so styles update with the theme.
 */
const styleSheet = (C = DARK_COLORS) => _reactNative.StyleSheet.create({
  container: {
    backgroundColor: C.background,
    flex: 1
  },
  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: _reactNative.Platform.OS === 'android' ? 36 : 16
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  headerInfo: {
    flex: 1
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 3
  },
  titleDot: {
    backgroundColor: C.primary,
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    shadowColor: C.primary,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    width: 8
  },
  headerTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  headerSubtitle: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: C.surfaceElevated,
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  closeBtnText: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  // ── Tabs ────────────────────────────────────────────────────────────────
  tabContainer: {
    backgroundColor: C.surface,
    borderBottomColor: C.border,
    borderBottomWidth: 1
  },
  tabScroll: {
    paddingHorizontal: 12
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: 'relative'
  },
  tabActive: {},
  activeTabDot: {
    backgroundColor: C.primary,
    borderRadius: 1.5,
    bottom: 6,
    height: 3,
    position: 'absolute',
    width: 20
  },
  tabText: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  tabTextActive: {
    color: C.primary
  },
  // ── Search ──────────────────────────────────────────────────────────────
  searchRow: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 6
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 46,
    paddingHorizontal: 14
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8
  },
  searchInput: {
    color: C.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '500'
  },
  clearSearch: {
    color: C.textDim,
    fontSize: 18,
    paddingHorizontal: 4
  },
  // ── Filter pills (method / status) ──────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 15,
    paddingBottom: 10
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  filterPillActive: {
    backgroundColor: C.primary + '18',
    borderColor: C.primary
  },
  filterPillText: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  filterPillTextActive: {
    color: C.primary
  },
  // ── Log list ────────────────────────────────────────────────────────────
  listContent: {
    padding: 12,
    paddingBottom: 40
  },
  logItem: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1
  },
  logIndicator: {
    width: 4
  },
  logBody: {
    flex: 1,
    padding: 14
  },
  logHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8
  },
  badge: {
    borderRadius: 8,
    marginRight: 8,
    paddingHorizontal: 9,
    paddingVertical: 3
  },
  logMethod: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  statusChip: {
    borderRadius: 8,
    marginRight: 8,
    paddingHorizontal: 9,
    paddingVertical: 3
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  logStatus: {
    fontSize: 12,
    fontWeight: '900',
    marginHorizontal: 6
  },
  logTime: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 'auto'
  },
  logUrl: {
    color: C.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20
  },
  logMetaBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 10
  },
  metaBadge: {
    backgroundColor: C.surfaceLight,
    borderColor: C.border,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  logMeta: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: '700'
  },
  // ── Empty state ─────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 60
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 16
  },
  emptyText: {
    color: C.textDim,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center'
  },
  emptySubText: {
    color: C.textSubtle,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center'
  },
  // ── Settings panel ──────────────────────────────────────────────────────
  settingsContainer: {
    flex: 1,
    padding: 20
  },
  section: {
    marginBottom: 24
  },
  sectionHeaderBox: {
    borderLeftColor: C.primary,
    borderLeftWidth: 3,
    marginBottom: 12,
    paddingLeft: 10
  },
  sectionTitle: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8
  },
  card: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  inputLabel: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10
  },
  textInput: {
    borderBottomColor: C.primary + '40',
    borderBottomWidth: 1.5,
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 20,
    paddingVertical: 10
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 14,
    elevation: 4,
    padding: 16,
    shadowColor: C.primary,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  toolBtn: {
    alignItems: 'center',
    borderColor: C.border,
    borderRadius: 14,
    borderWidth: 1.5,
    margin: 16,
    padding: 16
  },
  toolBtnText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  cardInner: {
    padding: 20
  },
  // ── URL options ─────────────────────────────────────────────────────────
  urlOption: {
    alignItems: 'center',
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16
  },
  urlOptionLast: {
    borderBottomWidth: 0
  },
  urlOptionActive: {
    backgroundColor: C.primary + '10'
  },
  urlOptionInfo: {
    flex: 1
  },
  urlOptionTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3
  },
  urlOptionTitleActive: {
    color: C.primary
  },
  urlOptionUrl: {
    color: C.textDim,
    fontSize: 11.5
  },
  optionActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  deleteBtn: {
    alignItems: 'center',
    backgroundColor: C.error + '18',
    borderRadius: 12,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  deleteBtnText: {
    color: C.error,
    fontSize: 14,
    fontWeight: '900'
  },
  activeDot: {
    backgroundColor: C.success,
    borderRadius: 5,
    height: 10,
    shadowColor: C.success,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    width: 10
  },
  // ── Detail modal ────────────────────────────────────────────────────────
  detailsModal: {
    backgroundColor: C.background,
    flex: 1
  },
  detailsHeader: {
    backgroundColor: C.surface,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    paddingBottom: 0
  },
  detailsTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  detailsPerfText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700'
  },
  backBtnText: {
    color: C.primary,
    fontSize: 26,
    fontWeight: '300'
  },
  backBtn: {
    paddingRight: 12,
    paddingVertical: 4
  },
  menuBtn: {
    paddingLeft: 12,
    paddingVertical: 4
  },
  menuBtnText: {
    color: C.primary,
    fontSize: 26,
    fontWeight: '600'
  },
  dropdownMenu: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 10,
    position: 'absolute',
    right: 16,
    shadowColor: C.shadow,
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    top: 60,
    width: 180,
    zIndex: 1000
  },
  menuItem: {
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  menuItemText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700'
  },
  detailsTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 4
  },
  detailTab: {
    alignItems: 'center',
    borderBottomColor: C.transparent,
    borderBottomWidth: 2.5,
    flex: 1,
    paddingVertical: 14
  },
  detailTabActive: {
    borderBottomColor: C.primary
  },
  detailTabText: {
    color: C.textDim,
    fontSize: 13,
    fontWeight: '700'
  },
  detailTabTextActive: {
    color: C.primary
  },
  detailsContent: {
    flex: 1,
    padding: 20
  },
  // ── Section blocks (detail view) ────────────────────────────────────────
  sectionBox: {
    marginBottom: 28
  },
  sectionLabel: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  sectionValue: {
    color: C.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 24
  },
  jsonBox: {
    backgroundColor: C.surfaceLight,
    borderColor: C.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  jsonText: {
    color: C.jsonText,
    fontFamily: _reactNative.Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 20
  }
});
var _default = exports.default = styleSheet;
//# sourceMappingURL=DebugMonitorStyles.js.map