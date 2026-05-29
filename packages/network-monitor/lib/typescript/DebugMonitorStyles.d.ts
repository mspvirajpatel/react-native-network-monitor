export interface ThemeColors {
    background: string;
    surface: string;
    surfaceLight: string;
    surfaceElevated: string;
    primary: string;
    secondary: string;
    text: string;
    textDim: string;
    textSubtle: string;
    success: string;
    warning: string;
    error: string;
    border: string;
    accent: string;
    glass: string;
    highlight: string;
    transparent: string;
    shadow: string;
    overlay: string;
    jsonText: string;
}
export declare const DARK_COLORS: ThemeColors;
export declare const LIGHT_COLORS: ThemeColors;
/**
 * getColors
 *
 * Resolve the color palette for a given theme.
 * @param theme - 'dark' | 'light'
 * @returns ThemeColors palette
 */
export declare const getColors: (theme: "dark" | "light") => ThemeColors;
export declare const COLORS: ThemeColors;
/**
 * styleSheet
 *
 * Centralized styles for the Debug Monitor component.
 * Accepts the resolved ThemeColors so styles update with the theme.
 */
declare const styleSheet: (C?: ThemeColors) => {
    container: {
        backgroundColor: string;
        flex: number;
    };
    header: {
        alignItems: "center";
        backgroundColor: string;
        borderBottomColor: string;
        borderBottomWidth: number;
        flexDirection: "row";
        justifyContent: "space-between";
        paddingHorizontal: number;
        paddingVertical: number;
        paddingTop: number;
    };
    headerActions: {
        alignItems: "center";
        flexDirection: "row";
        gap: number;
    };
    headerInfo: {
        flex: number;
    };
    titleRow: {
        alignItems: "center";
        flexDirection: "row";
        marginBottom: number;
    };
    titleDot: {
        backgroundColor: string;
        borderRadius: number;
        height: number;
        marginRight: number;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        width: number;
    };
    headerTitle: {
        color: string;
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
    };
    headerSubtitle: {
        color: string;
        fontSize: number;
        fontWeight: "600";
        letterSpacing: number;
    };
    closeBtn: {
        alignItems: "center";
        backgroundColor: string;
        borderRadius: number;
        justifyContent: "center";
        paddingHorizontal: number;
        paddingVertical: number;
    };
    closeBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "800";
        letterSpacing: number;
    };
    tabContainer: {
        backgroundColor: string;
        borderBottomColor: string;
        borderBottomWidth: number;
    };
    tabScroll: {
        paddingHorizontal: number;
    };
    tab: {
        alignItems: "center";
        paddingHorizontal: number;
        paddingVertical: number;
        position: "relative";
    };
    tabActive: {};
    activeTabDot: {
        backgroundColor: string;
        borderRadius: number;
        bottom: number;
        height: number;
        position: "absolute";
        width: number;
    };
    tabText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
        letterSpacing: number;
    };
    tabTextActive: {
        color: string;
    };
    searchRow: {
        paddingHorizontal: number;
        paddingTop: number;
        paddingBottom: number;
    };
    searchBox: {
        alignItems: "center";
        backgroundColor: string;
        borderColor: string;
        borderRadius: number;
        borderWidth: number;
        flexDirection: "row";
        height: number;
        paddingHorizontal: number;
    };
    searchIcon: {
        fontSize: number;
        marginRight: number;
    };
    searchInput: {
        color: string;
        flex: number;
        fontSize: number;
        fontWeight: "500";
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
        alignItems: "center";
        backgroundColor: string;
        borderColor: string;
        borderRadius: number;
        borderWidth: number;
        paddingHorizontal: number;
        paddingVertical: number;
    };
    filterPillActive: {
        backgroundColor: string;
        borderColor: string;
    };
    filterPillText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
        letterSpacing: number;
    };
    filterPillTextActive: {
        color: string;
    };
    listContent: {
        padding: number;
        paddingBottom: number;
    };
    logItem: {
        backgroundColor: string;
        borderColor: string;
        borderRadius: number;
        borderWidth: number;
        flexDirection: "row";
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
        flex: number;
        padding: number;
    };
    logHeader: {
        alignItems: "center";
        flexDirection: "row";
        marginBottom: number;
    };
    badge: {
        borderRadius: number;
        marginRight: number;
        paddingHorizontal: number;
        paddingVertical: number;
    };
    logMethod: {
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
    };
    statusChip: {
        borderRadius: number;
        marginRight: number;
        paddingHorizontal: number;
        paddingVertical: number;
    };
    statusChipText: {
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
    };
    logStatus: {
        fontSize: number;
        fontWeight: "900";
        marginHorizontal: number;
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
        alignItems: "center";
        flexDirection: "row";
        gap: number;
        marginTop: number;
    };
    metaBadge: {
        backgroundColor: string;
        borderColor: string;
        borderRadius: number;
        borderWidth: number;
        paddingHorizontal: number;
        paddingVertical: number;
    };
    logMeta: {
        color: string;
        fontSize: number;
        fontWeight: "700";
    };
    emptyContainer: {
        alignItems: "center";
        flex: number;
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
        fontWeight: "600";
        marginBottom: number;
        textAlign: "center";
    };
    emptySubText: {
        color: string;
        fontSize: number;
        fontWeight: "400";
        textAlign: "center";
    };
    settingsContainer: {
        flex: number;
        padding: number;
    };
    section: {
        marginBottom: number;
    };
    sectionHeaderBox: {
        borderLeftColor: string;
        borderLeftWidth: number;
        marginBottom: number;
        paddingLeft: number;
    };
    sectionTitle: {
        color: string;
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
    };
    card: {
        backgroundColor: string;
        borderColor: string;
        borderRadius: number;
        borderWidth: number;
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
    inputLabel: {
        color: string;
        fontSize: number;
        fontWeight: "800";
        letterSpacing: number;
        marginBottom: number;
    };
    textInput: {
        borderBottomColor: string;
        borderBottomWidth: number;
        color: string;
        fontSize: number;
        fontWeight: "600";
        marginBottom: number;
        paddingVertical: number;
    };
    saveBtn: {
        alignItems: "center";
        backgroundColor: string;
        borderRadius: number;
        elevation: number;
        padding: number;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
    };
    saveBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
    };
    toolBtn: {
        alignItems: "center";
        borderColor: string;
        borderRadius: number;
        borderWidth: number;
        margin: number;
        padding: number;
    };
    toolBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
        letterSpacing: number;
    };
    cardInner: {
        padding: number;
    };
    urlOption: {
        alignItems: "center";
        borderBottomColor: string;
        borderBottomWidth: number;
        flexDirection: "row";
        justifyContent: "space-between";
        padding: number;
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
        alignItems: "center";
        flexDirection: "row";
        gap: number;
    };
    deleteBtn: {
        alignItems: "center";
        backgroundColor: string;
        borderRadius: number;
        height: number;
        justifyContent: "center";
        width: number;
    };
    deleteBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "900";
    };
    activeDot: {
        backgroundColor: string;
        borderRadius: number;
        height: number;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        width: number;
    };
    detailsModal: {
        backgroundColor: string;
        flex: number;
    };
    detailsHeader: {
        backgroundColor: string;
        borderBottomColor: string;
        borderBottomWidth: number;
        paddingBottom: number;
    };
    detailsTopRow: {
        alignItems: "center";
        flexDirection: "row";
        justifyContent: "space-between";
        paddingHorizontal: number;
        paddingVertical: number;
    };
    detailsPerfText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
    };
    backBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "300";
    };
    backBtn: {
        paddingRight: number;
        paddingVertical: number;
    };
    menuBtn: {
        paddingLeft: number;
        paddingVertical: number;
    };
    menuBtnText: {
        color: string;
        fontSize: number;
        fontWeight: "600";
    };
    dropdownMenu: {
        backgroundColor: string;
        borderColor: string;
        borderRadius: number;
        borderWidth: number;
        elevation: number;
        position: "absolute";
        right: number;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        top: number;
        width: number;
        zIndex: number;
    };
    menuItem: {
        borderBottomColor: string;
        borderBottomWidth: number;
        paddingHorizontal: number;
        paddingVertical: number;
    };
    menuItemText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
    };
    detailsTabs: {
        flexDirection: "row";
        paddingHorizontal: number;
        paddingTop: number;
    };
    detailTab: {
        alignItems: "center";
        borderBottomColor: string;
        borderBottomWidth: number;
        flex: number;
        paddingVertical: number;
    };
    detailTabActive: {
        borderBottomColor: string;
    };
    detailTabText: {
        color: string;
        fontSize: number;
        fontWeight: "700";
    };
    detailTabTextActive: {
        color: string;
    };
    detailsContent: {
        flex: number;
        padding: number;
    };
    sectionBox: {
        marginBottom: number;
    };
    sectionLabel: {
        color: string;
        fontSize: number;
        fontWeight: "900";
        letterSpacing: number;
        marginBottom: number;
        textTransform: "uppercase";
    };
    sectionValue: {
        color: string;
        fontSize: number;
        fontWeight: "500";
        lineHeight: number;
    };
    jsonBox: {
        backgroundColor: string;
        borderColor: string;
        borderRadius: number;
        borderWidth: number;
        padding: number;
    };
    jsonText: {
        color: string;
        fontFamily: string;
        fontSize: number;
        lineHeight: number;
    };
};
export default styleSheet;
//# sourceMappingURL=DebugMonitorStyles.d.ts.map