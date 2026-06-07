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
export declare const DARK_COLORS: ThemeColors;
export declare const LIGHT_COLORS: ThemeColors;
export declare const getColors: (theme: "dark" | "light", overrides?: Partial<ThemeColors>) => ThemeColors;
export declare const COLORS: ThemeColors;
declare const styleSheet: (C?: ThemeColors) => {
    container: {
        backgroundColor: string;
        flex: number;
    };
    header: {
        backgroundColor: string;
        borderBottomColor: string;
        borderBottomWidth: number;
        paddingHorizontal: number;
        paddingTop: number;
    };
    headerTop: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        paddingVertical: number;
    };
    headerLeft: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
    };
    headerLogo: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    headerLogoText: {
        color: string;
        fontSize: number;
        fontWeight: "900";
    };
    headerTitle: {
        color: string;
        fontSize: number;
        fontWeight: "800";
        letterSpacing: number;
    };
    headerCount: {
        color: string;
        fontSize: number;
        fontWeight: "600";
        backgroundColor: string;
        borderRadius: number;
        paddingHorizontal: number;
        paddingVertical: number;
        overflow: "hidden";
    };
    headerActions: {
        flexDirection: "row";
        gap: number;
    };
    headerBtn: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    headerBtnText: {
        fontSize: number;
        color: string;
    };
    tabBar: {
        backgroundColor: string;
        paddingBottom: number;
    };
    tabScroll: {
        paddingHorizontal: number;
    };
    tabItem: {
        paddingHorizontal: number;
        paddingVertical: number;
        position: "relative";
        alignItems: "center";
    };
    tabText: {
        fontSize: number;
        fontWeight: "700";
        letterSpacing: number;
    };
    tabTextActive: {
        color: string;
    };
    tabTextInactive: {
        color: string;
    };
    tabBadge: {
        fontSize: number;
        fontWeight: "700";
        marginLeft: number;
    };
    tabActiveLine: {
        height: number;
        backgroundColor: string;
        borderRadius: number;
        position: "absolute";
        bottom: number;
    };
    searchRow: {
        paddingHorizontal: number;
        paddingTop: number;
        paddingBottom: number;
    };
    searchBox: {
        flexDirection: "row";
        alignItems: "center";
        backgroundColor: string;
        borderRadius: number;
        paddingHorizontal: number;
        height: number;
        borderWidth: number;
        borderColor: string;
    };
    searchInput: {
        color: string;
        flex: number;
        fontSize: number;
        fontWeight: "500";
        marginLeft: number;
    };
    clearSearch: {
        color: string;
        fontSize: number;
        paddingHorizontal: number;
    };
    filterRow: {
        flexDirection: "row";
        gap: number;
        paddingHorizontal: number;
        paddingBottom: number;
    };
    filterPill: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderRadius: number;
        borderWidth: number;
        borderColor: string;
        backgroundColor: string;
    };
    filterPillActive: {
        backgroundColor: string;
        borderColor: string;
    };
    filterPillText: {
        fontSize: number;
        fontWeight: "700";
        letterSpacing: number;
    };
    filterPillTextActive: {
        color: string;
    };
    filterPillTextInactive: {
        color: string;
    };
    listContent: {
        padding: number;
        paddingBottom: number;
    };
    logItem: {
        backgroundColor: string;
        borderRadius: number;
        marginBottom: number;
        overflow: "hidden";
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    logIndicator: {
        width: number;
    };
    logBody: {
        padding: number;
    };
    logRow: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
        marginBottom: number;
    };
    logChip: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderRadius: number;
    };
    logChipText: {
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
    };
    logStatusChip: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderRadius: number;
    };
    logStatusText: {
        fontSize: number;
        fontWeight: "900";
    };
    logTime: {
        color: string;
        fontSize: number;
        fontWeight: "600";
        marginLeft: "auto";
    };
    logUrl: {
        color: string;
        fontSize: number;
        fontWeight: "600";
        lineHeight: number;
    };
    logMetaBox: {
        flexDirection: "row";
        gap: number;
        marginTop: number;
    };
    metaBadge: {
        backgroundColor: string;
        borderRadius: number;
        paddingHorizontal: number;
        paddingVertical: number;
    };
    logMeta: {
        color: string;
        fontSize: number;
        fontWeight: "700";
    };
    emptyContainer: {
        flex: number;
        alignItems: "center";
        justifyContent: "center";
        padding: number;
    };
    emptyIcon: {
        fontSize: number;
        marginBottom: number;
    };
    emptyText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
        marginBottom: number;
    };
    emptySubText: {
        color: string;
        fontSize: number;
        textAlign: "center";
    };
    settingsContainer: {
        flex: number;
        padding: number;
    };
    settingsSection: {
        marginBottom: number;
    };
    settingsSectionHeader: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
        marginBottom: number;
    };
    settingsSectionLine: {
        width: number;
        height: number;
        backgroundColor: string;
        borderRadius: number;
    };
    settingsSectionTitle: {
        color: string;
        fontSize: number;
        fontWeight: "800";
        letterSpacing: number;
    };
    settingsCard: {
        backgroundColor: string;
        borderRadius: number;
        overflow: "hidden";
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    cardInner: {
        padding: number;
    };
    urlOption: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        padding: number;
        borderBottomColor: string;
        borderBottomWidth: number;
    };
    urlOptionLast: {
        borderBottomWidth: number;
    };
    urlOptionActive: {
        backgroundColor: string;
    };
    urlOptionInfo: {
        flex: number;
    };
    urlOptionTitle: {
        color: string;
        fontSize: number;
        fontWeight: "700";
        marginBottom: number;
    };
    urlOptionTitleActive: {
        color: string;
    };
    urlOptionUrl: {
        color: string;
        fontSize: number;
    };
    optionActions: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
    };
    deleteBtn: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    deleteBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "900";
    };
    activeDot: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
    };
    inputLabel: {
        color: string;
        fontSize: number;
        fontWeight: "800";
        letterSpacing: number;
        marginBottom: number;
    };
    textInput: {
        color: string;
        fontSize: number;
        fontWeight: "600";
        paddingVertical: number;
        paddingHorizontal: number;
        backgroundColor: string;
        borderRadius: number;
        borderWidth: number;
        borderColor: string;
        marginBottom: number;
    };
    saveBtn: {
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        alignItems: "center";
    };
    saveBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
    };
    optionChip: {
        flex: number;
        paddingVertical: number;
        borderRadius: number;
        borderWidth: number;
        alignItems: "center";
    };
    optionChipText: {
        fontSize: number;
        fontWeight: "700";
    };
    toolBtn: {
        borderWidth: number;
        borderColor: string;
        borderRadius: number;
        padding: number;
        alignItems: "center";
    };
    toolBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
        letterSpacing: number;
    };
    detailOverlay: {
        flex: number;
        backgroundColor: string;
        justifyContent: "flex-end";
    };
    detailSheet: {
        backgroundColor: string;
        borderTopLeftRadius: number;
        borderTopRightRadius: number;
        maxHeight: "88%";
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    detailHandle: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignSelf: "center";
        marginTop: number;
        marginBottom: number;
    };
    detailHeader: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomColor: string;
        borderBottomWidth: number;
    };
    detailBack: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    detailBackText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
    };
    detailTitle: {
        color: string;
        fontSize: number;
        fontWeight: "800";
    };
    detailMenu: {
        padding: number;
    };
    detailMenuText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
    };
    detailDropdown: {
        backgroundColor: string;
        borderRadius: number;
        position: "absolute";
        right: number;
        top: number;
        width: number;
        zIndex: number;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    detailDropdownItem: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomColor: string;
        borderBottomWidth: number;
    };
    detailDropdownText: {
        color: string;
        fontSize: number;
        fontWeight: "600";
    };
    detailTabs: {
        flexDirection: "row";
        paddingHorizontal: number;
        paddingTop: number;
        borderBottomColor: string;
        borderBottomWidth: number;
    };
    detailTab: {
        flex: number;
        alignItems: "center";
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    detailTabActive: {
        borderBottomColor: string;
    };
    detailTabText: {
        fontSize: number;
        fontWeight: "700";
    };
    detailTabTextActive: {
        color: string;
    };
    detailTabTextInactive: {
        color: string;
    };
    detailContent: {
        padding: number;
        paddingBottom: number;
    };
    sectionBox: {
        marginBottom: number;
    };
    sectionLabel: {
        color: string;
        fontSize: number;
        fontWeight: "800";
        letterSpacing: number;
        marginBottom: number;
    };
    sectionLabelRow: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        marginBottom: number;
    };
    copyIconText: {
        fontSize: number;
        opacity: number;
    };
    sectionValue: {
        color: string;
        fontSize: number;
        fontWeight: "500";
        lineHeight: number;
    };
    jsonBox: {
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        borderWidth: number;
        borderColor: string;
    };
    jsonText: {
        color: string;
        fontFamily: string;
        fontSize: number;
        lineHeight: number;
    };
    perfContainer: {
        flex: number;
        padding: number;
    };
    perfCard: {
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        marginBottom: number;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    perfRow: {
        flexDirection: "row";
        justifyContent: "space-between";
        alignItems: "center";
        marginBottom: number;
    };
    perfLabel: {
        color: string;
        fontSize: number;
        fontWeight: "700";
        letterSpacing: number;
    };
    perfValue: {
        color: string;
        fontSize: number;
        fontWeight: "900";
    };
    perfValueGood: {
        color: string;
    };
    perfValueWarning: {
        color: string;
    };
    perfValueError: {
        color: string;
    };
    fpsBar: {
        height: number;
        borderRadius: number;
        backgroundColor: string;
        marginTop: number;
        overflow: "hidden";
    };
    fpsBarFill: {
        height: "100%";
        borderRadius: number;
    };
    perfToggle: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        marginBottom: number;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    perfToggleText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
    };
    toggleTrack: {
        width: number;
        height: number;
        borderRadius: number;
        justifyContent: "center";
        paddingHorizontal: number;
    };
    toggleTrackActive: {
        backgroundColor: string;
    };
    toggleTrackInactive: {
        backgroundColor: string;
    };
    toggleThumb: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
    };
    wsContainer: {
        flex: number;
        padding: number;
    };
    wsItem: {
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        marginBottom: number;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    wsHeader: {
        flexDirection: "row";
        alignItems: "center";
        marginBottom: number;
    };
    wsBadge: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderRadius: number;
        marginRight: number;
    };
    wsBadgeText: {
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
    };
    wsUrl: {
        color: string;
        fontSize: number;
        fontWeight: "600";
        flex: number;
    };
    wsTime: {
        color: string;
        fontSize: number;
        fontWeight: "600";
    };
    wsMessage: {
        color: string;
        fontSize: number;
        marginTop: number;
        lineHeight: number;
    };
    deviceRow: {
        flexDirection: "row";
        justifyContent: "space-between";
        alignItems: "center";
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        marginBottom: number;
    };
    deviceLabel: {
        color: string;
        fontSize: number;
        fontWeight: "600";
        flex: number;
    };
    deviceValue: {
        color: string;
        fontSize: number;
        fontWeight: "700";
        textAlign: "right";
        flex: number;
    };
    deviceSectionTitle: {
        color: string;
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
        marginBottom: number;
        marginTop: number;
    };
    scrollTopBtn: {
        position: "absolute";
        bottom: number;
        right: number;
        width: number;
        height: number;
        borderRadius: number;
        alignItems: "center";
        justifyContent: "center";
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    scrollTopBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "800";
    };
};
export default styleSheet;
//# sourceMappingURL=DebugMonitorStyles.d.ts.map