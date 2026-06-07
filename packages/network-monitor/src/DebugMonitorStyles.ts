import { I18nManager, Platform, StyleSheet } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceElevated: string;
  primary: string;
  primaryDim: string;
  secondary: string;
  text: string;
  textDim: string;
  textSubtle: string;
  success: string;
  successDim: string;
  warning: string;
  error: string;
  errorDim: string;
  border: string;
  accent: string;
  glass: string;
  highlight: string;
  transparent: string;
  shadow: string;
  overlay: string;
  jsonText: string;
  jsonKey: string;
  jsonString: string;
  jsonNumber: string;
  cardShadow: string;
  tabActive: string;
  tabInactive: string;
}

export const DARK_COLORS: ThemeColors = {
  background: '#0B0B14',
  surface: '#14141F',
  surfaceLight: '#1C1C2E',
  surfaceElevated: '#252540',
  primary: '#7C5CFC',
  primaryDim: '#7C5CFC18',
  secondary: '#22D3EE',
  text: '#EEEEFF',
  textDim: '#8888AA',
  textSubtle: '#555577',
  success: '#34D399',
  successDim: '#34D39918',
  warning: '#FBBF24',
  error: '#FB7185',
  errorDim: '#FB718518',
  border: '#1E1E32',
  accent: '#A78BFA',
  glass: 'rgba(20, 20, 40, 0.85)',
  highlight: 'rgba(255,255,255,0.04)',
  transparent: 'transparent',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.75)',
  jsonText: '#34D399',
  jsonKey: '#7C5CFC',
  jsonString: '#22D3EE',
  jsonNumber: '#FBBF24',
  cardShadow: 'rgba(124, 92, 252, 0.06)',
  tabActive: '#7C5CFC',
  tabInactive: '#555577',
};

export const LIGHT_COLORS: ThemeColors = {
  background: '#F4F4F9',
  surface: '#FFFFFF',
  surfaceLight: '#F8F8FF',
  surfaceElevated: '#E8E8F0',
  primary: '#6C5CE7',
  primaryDim: '#6C5CE712',
  secondary: '#0891B2',
  text: '#1A1A2E',
  textDim: '#6B6B8A',
  textSubtle: '#9A9AB0',
  success: '#059669',
  successDim: '#05966912',
  warning: '#D97706',
  error: '#DC2626',
  errorDim: '#DC262612',
  border: '#E2E2F0',
  accent: '#7C3AED',
  glass: 'rgba(255, 255, 255, 0.85)',
  highlight: 'rgba(0,0,0,0.03)',
  transparent: 'transparent',
  shadow: '#8888AA',
  overlay: 'rgba(26, 26, 46, 0.6)',
  jsonText: '#059669',
  jsonKey: '#6C5CE7',
  jsonString: '#0891B2',
  jsonNumber: '#D97706',
  cardShadow: 'rgba(108, 92, 231, 0.08)',
  tabActive: '#6C5CE7',
  tabInactive: '#9A9AB0',
};

export const getColors = (theme: 'dark' | 'light', overrides?: Partial<ThemeColors>): ThemeColors => {
  const base = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
  return overrides ? { ...base, ...overrides } : base;
};

export const COLORS = DARK_COLORS;

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styleSheet = (C: ThemeColors = DARK_COLORS) =>
  StyleSheet.create({
    container: { backgroundColor: C.background, flex: 1 },

    // ── Header ────────────────────────────────────────────────────────────
    header: {
      backgroundColor: C.surface,
      borderBottomColor: C.border,
      borderBottomWidth: 1,
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 44 : 0,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerLogo: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerLogoText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
    headerTitle: { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    headerCount: {
      color: C.textDim,
      fontSize: 11,
      fontWeight: '600',
      backgroundColor: C.surfaceLight,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      overflow: 'hidden',
    },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: C.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBtnText: { fontSize: 15, color: C.textDim },

    // ── Tab Bar ───────────────────────────────────────────────────────────
    tabBar: {
      backgroundColor: C.surface,
      paddingBottom: 0,
    },
    tabScroll: { paddingHorizontal: 12 },
    tabItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      position: 'relative',
      alignItems: 'center',
    },
    tabText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    tabTextActive: { color: C.tabActive },
    tabTextInactive: { color: C.tabInactive },
    tabBadge: {
      fontSize: 9,
      fontWeight: '700',
      marginStart: 3,
    },
    tabActiveLine: {
      height: 2.5,
      backgroundColor: C.tabActive,
      borderRadius: 1.5,
      position: 'absolute',
      bottom: 0,
    },

    // ── Search ────────────────────────────────────────────────────────────
    searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surfaceLight,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 42,
      borderWidth: 1,
      borderColor: C.border,
    },
    searchInput: {
      color: C.text,
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      marginStart: 10,
    },
    clearSearch: { color: C.textDim, fontSize: 16, paddingHorizontal: 4 },

    // ── Filter Pills ──────────────────────────────────────────────────────
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    filterPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surfaceLight,
    },
    filterPillActive: {
      backgroundColor: C.primaryDim,
      borderColor: C.primary,
    },
    filterPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
    filterPillTextActive: { color: C.primary },
    filterPillTextInactive: { color: C.textDim },

    // ── Log List ──────────────────────────────────────────────────────────
    listContent: { padding: 16, paddingBottom: 40 },
    logItem: {
      backgroundColor: C.surface,
      borderRadius: 14,
      marginBottom: 10,
      overflow: 'hidden',
      shadowColor: C.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    logIndicator: { width: 4 },
    logBody: { padding: 14 },
    logRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    logChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    logChipText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
    logStatusChip: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 5,
    },
    logStatusText: { fontSize: 9, fontWeight: '900' },
    logTime: {
      color: C.textSubtle,
      fontSize: 9,
      fontWeight: '600',
      marginStart: 'auto',
    },
    logUrl: {
      color: C.text,
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 18,
    },
    logMetaBox: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 10,
    },
    metaBadge: {
      backgroundColor: C.surfaceLight,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    logMeta: { color: C.textDim, fontSize: 10, fontWeight: '700' },

    // ── Live Activity Dot ───────────────────────────────────────────────────
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginStart: 4,
    },

    // ── Loading Overlay ────────────────────────────────────────────────────
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    loadingBox: {
      backgroundColor: C.surfaceElevated,
      borderRadius: 16,
      padding: 28,
      alignItems: 'center',
      minWidth: 140,
      shadowColor: C.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    loadingSpinner: { marginBottom: 12 },
    loadingText: {
      color: C.text,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },

    // ── Empty State ───────────────────────────────────────────────────────
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
    },
    emptyIcon: { fontSize: 40, marginBottom: 16 },
    emptyText: { color: C.textDim, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    emptySubText: { color: C.textSubtle, fontSize: 11, textAlign: 'center' },

    // ── Settings Panel ────────────────────────────────────────────────────
    settingsContainer: { flex: 1, padding: 20 },
    settingsSection: { marginBottom: 28 },
    settingsSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    settingsSectionLine: {
      width: 3,
      height: 16,
      backgroundColor: C.primary,
      borderRadius: 2,
    },
    settingsSectionTitle: {
      color: C.textDim,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    settingsCard: {
      backgroundColor: C.surface,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: C.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    cardInner: { padding: 20 },

    // ── URL Options ───────────────────────────────────────────────────────
    urlOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomColor: C.border,
      borderBottomWidth: 1,
    },
    urlOptionLast: { borderBottomWidth: 0 },
    urlOptionActive: { backgroundColor: C.primaryDim },
    urlOptionInfo: { flex: 1 },
    urlOptionTitle: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
    urlOptionTitleActive: { color: C.primary },
    urlOptionUrl: { color: C.textDim, fontSize: 11 },
    optionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deleteBtn: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: C.errorDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBtnText: { color: C.error, fontSize: 12, fontWeight: '900' },
    activeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.success,
    },

    // ── Input ─────────────────────────────────────────────────────────────
    inputLabel: {
      color: C.textDim,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 10,
    },
    textInput: {
      color: C.text,
      fontSize: 14,
      fontWeight: '600',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: C.surfaceLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: 16,
    },
    saveBtn: {
      backgroundColor: C.primary,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1,
    },
    optionChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
    },
    optionChipText: {
      fontSize: 12,
      fontWeight: '700',
    },
    toolBtn: {
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
    },
    toolBtnText: {
      color: C.text,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },

    // ── Detail Modal (Bottom Sheet) ──────────────────────────────────────
    detailOverlay: {
      flex: 1,
      backgroundColor: C.overlay,
      justifyContent: 'flex-end',
    },
    detailSheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '88%',
      shadowColor: C.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 20,
    },
    detailHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.textSubtle,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 4,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomColor: C.border,
      borderBottomWidth: 1,
    },
    detailBack: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: C.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailBackText: { color: C.primary, fontSize: 18, fontWeight: '700' },
    detailTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
    detailMenu: { padding: 6 },
    detailMenuText: { color: C.textDim, fontSize: 20, fontWeight: '700' },
    detailDropdown: {
      backgroundColor: C.surfaceElevated,
      borderRadius: 12,
      position: 'absolute',
      right: 16,
      top: 52,
      width: 160,
      zIndex: 1000,
      shadowColor: C.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 10,
    },
    detailDropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomColor: C.border,
      borderBottomWidth: 1,
    },
    detailDropdownText: { color: C.text, fontSize: 13, fontWeight: '600' },

    // ── Detail Tabs ───────────────────────────────────────────────────────
    detailTabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 4,
      borderBottomColor: C.border,
      borderBottomWidth: 1,
    },
    detailTab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 2.5,
      borderBottomColor: C.transparent,
    },
    detailTabActive: { borderBottomColor: C.primary },
    detailTabText: { fontSize: 12, fontWeight: '700' },
    detailTabTextActive: { color: C.primary },
    detailTabTextInactive: { color: C.textDim },
    detailContent: { padding: 20, paddingBottom: 40 },

    // ── Section Blocks (detail view) ──────────────────────────────────────
    sectionBox: { marginBottom: 24 },
    sectionLabel: {
      color: C.textDim,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    copyIconText: {
      fontSize: 14,
      opacity: 0.7,
    },
    sectionValue: {
      color: C.text,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 22,
    },
    jsonBox: {
      backgroundColor: C.surfaceLight,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: C.border,
    },
    jsonText: {
      color: C.jsonText,
      fontFamily: FONT,
      fontSize: 11,
      lineHeight: 18,
    },

    // ── Performance Panel ─────────────────────────────────────────────────
    perfContainer: { flex: 1, padding: 20 },
    perfCard: {
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 14,
      shadowColor: C.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    perfRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    perfLabel: { color: C.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    perfValue: { color: C.text, fontSize: 20, fontWeight: '900' },
    perfValueGood: { color: C.success },
    perfValueWarning: { color: C.warning },
    perfValueError: { color: C.error },
    fpsBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: C.surfaceLight,
      marginTop: 4,
      overflow: 'hidden',
    },
    fpsBarFill: { height: '100%', borderRadius: 3 },
    perfToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      shadowColor: C.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    perfToggleText: { color: C.text, fontSize: 13, fontWeight: '700' },
    toggleTrack: {
      width: 46,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    toggleTrackActive: { backgroundColor: C.primary },
    toggleTrackInactive: { backgroundColor: C.surfaceElevated },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },

    // ── WebSocket Panel ───────────────────────────────────────────────────
    wsContainer: { flex: 1, padding: 20 },
    wsItem: {
      backgroundColor: C.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      shadowColor: C.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 1,
    },
    wsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    wsBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      marginEnd: 8,
    },
    wsBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
    wsUrl: { color: C.text, fontSize: 11, fontWeight: '600', flex: 1 },
    wsTime: { color: C.textDim, fontSize: 9, fontWeight: '600' },
    wsMessage: { color: C.textDim, fontSize: 11, marginTop: 4, lineHeight: 16 },

    // ── Device Info ───────────────────────────────────────────────────────
    deviceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: C.surfaceLight,
      borderRadius: 10,
      padding: 14,
      marginBottom: 6,
    },
    deviceLabel: { color: C.textDim, fontSize: 12, fontWeight: '600', flex: 1 },
    deviceValue: { color: C.text, fontSize: 12, fontWeight: '700', textAlign: 'right', flex: 1 },
    deviceSectionTitle: {
      color: C.primary,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.5,
      marginBottom: 10,
      marginTop: 4,
    },

    // ── Scroll-to-top Button ──────────────────────────────────────────
    // Positioned on the right in LTR, stays on the right in RTL (convention, not text direction)
    scrollTopBtn: {
      position: 'absolute',
      bottom: 30,
      ...(I18nManager.isRTL ? { left: 20 } : { right: 20 }),
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    scrollTopBtnText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '800',
    },
  });

export default styleSheet;
