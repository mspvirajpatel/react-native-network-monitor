import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import {
  DebugTrigger,
  Logger,
  useDebugger,
  getDeviceInfo,
  subscribeToState,
  startPerformanceMonitor,
  stopPerformanceMonitor,
  generateExportReport,
  logNavigationEvent,
  type LanguageCode,
} from "@mspvirajpatel/react-native-network-monitor";

const API_BASE = "https://jsonplaceholder.typicode.com";
const WS_ECHO_URL = "wss://ws.postman-echo.com/raw";

type DemoEnv = "prod" | "demo";
type DemoTheme = "light" | "dark" | "auto";

/* ── Simple pub/sub store for subscribeToState demo ── */
function createSimpleStore<T>(initial: T) {
  let state = { ...initial };
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (partial: Partial<T>) => {
      state = { ...state, ...partial };
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reset: () => {
      state = { ...initial };
      listeners.forEach((fn) => fn());
    },
  };
}

const appStore = createSimpleStore({
  counter: 0,
  features: { beta: false },
  user: { name: "Demo User", role: "viewer" },
});

/* ── Shared UI components ── */
const ActionCard = ({
  label,
  color,
  onPress,
  subtitle,
}: {
  label: string;
  color: string;
  onPress: () => void;
  subtitle?: string;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={[
      styles.actionCard,
      { borderColor: color + "40", backgroundColor: color + "12" },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.actionCardLabel, { color }]}>{label}</Text>
    {subtitle ? <Text style={styles.actionCardSub}>{subtitle}</Text> : null}
  </TouchableOpacity>
);

const SectionHeader = ({
  title,
  color = "#38BDF8",
}: {
  title: string;
  color?: string;
}) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionLine, { backgroundColor: color }]} />
    <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
  </View>
);

/* ── Props that AppContent needs to influence ── */
interface DemoProps {
  clicksNeeded: number;
  passOptional: boolean;
  passFreq: "all-time" | "per-install" | "app-active";
  enableTapGesture: boolean;
  accessEnabled: boolean;
  btnMargin: number;
  lang: LanguageCode;
  theme: DemoTheme;
  env: DemoEnv;
  useCustomColors: boolean;
  showCustomFloatingBtn: boolean;
  demoHeaderTitle: string;
  demoMaxLogs: number;
  demoSearchPlaceholder: string;
  featNetwork: boolean;
  featConsole: boolean;
  featWebsocket: boolean;
  featPerformance: boolean;
  featErrorBoundary: boolean;
  featPersistence: boolean;
  featNotifications: boolean;
  featNavigationFlow: boolean;
  setClicksNeeded: (n: number) => void;
  setPassOptional: (v: boolean) => void;
  setPassFreq: (v: "all-time" | "per-install" | "app-active") => void;
  setEnableTapGesture: (v: boolean) => void;
  setAccessEnabled: (v: boolean) => void;
  setBtnMargin: (v: number) => void;
  setLang: (v: LanguageCode) => void;
  setTheme: (v: DemoTheme) => void;
  setEnv: (v: DemoEnv) => void;
  setUseCustomColors: (v: boolean) => void;
  setShowCustomFloatingBtn: (v: boolean) => void;
  setDemoHeaderTitle: (v: string) => void;
  setDemoMaxLogs: (v: number) => void;
  setDemoSearchPlaceholder: (v: string) => void;
  setFeatNetwork: (v: boolean) => void;
  setFeatConsole: (v: boolean) => void;
  setFeatWebsocket: (v: boolean) => void;
  setFeatPerformance: (v: boolean) => void;
  setFeatErrorBoundary: (v: boolean) => void;
  setFeatPersistence: (v: boolean) => void;
  setFeatNotifications: (v: boolean) => void;
  setFeatNavigationFlow: (v: boolean) => void;
}

/* ── AppContent — scrollable demo UI with feature buttons ── */
function AppContent({
  clicksNeeded,
  passOptional,
  passFreq,
  enableTapGesture,
  accessEnabled,
  btnMargin,
  lang,
  theme,
  env,
  useCustomColors,
  showCustomFloatingBtn,
  demoHeaderTitle,
  demoMaxLogs,
  demoSearchPlaceholder,
  setClicksNeeded,
  setPassOptional,
  setPassFreq,
  setEnableTapGesture,
  setAccessEnabled,
  setBtnMargin,
  setLang,
  setTheme,
  setEnv,
  setUseCustomColors,
  setShowCustomFloatingBtn,
  setDemoHeaderTitle,
  setDemoMaxLogs,
  setDemoSearchPlaceholder,
  featNetwork,
  featConsole,
  featWebsocket,
  featPerformance,
  featErrorBoundary,
  featPersistence,
  featNotifications,
  featNavigationFlow,
  setFeatNetwork,
  setFeatConsole,
  setFeatWebsocket,
  setFeatPerformance,
  setFeatErrorBoundary,
  setFeatPersistence,
  setFeatNotifications,
  setFeatNavigationFlow,
}: DemoProps) {
  const { openDebugger, closeDebugger, isDebuggerOpen } = useDebugger();
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [perfRunning, setPerfRunning] = useState(false);
  const [, forceUpdate] = useState(0);
  const [customUrl, setCustomUrl] = useState("");
  const [calls, setCalls] = useState<{ label: string; ts: Date }[]>([]);
  const [currentScreen, setCurrentScreen] = useState("Home");
  const [screenStack, setScreenStack] = useState<string[]>(["Home"]);

  const force = () => forceUpdate((n) => n + 1);

  /* ── Initialise monitors once ── */
  useEffect(() => {
    const info = getDeviceInfo();
    Logger.logInfo("Demo app mounted", {
      platform: info.platform,
      version: info.appVersion,
      screen: `${info.screenWidth}x${info.screenHeight}`,
    });
  }, []);

  useEffect(() => {
    const unsub = subscribeToState({
      name: "AppStore",
      getState: () => appStore.getState(),
      subscribe: (fn) => appStore.subscribe(fn),
      mode: "diff",
      throttleMs: 300,
    });
    return unsub;
  }, []);

  const log = (label: string) =>
    setCalls((p) => [{ label, ts: new Date() }, ...p].slice(0, 20));

  /* ── Action Handlers ── */
  const fetchGet = async () => {
    log("GET /posts/1");
    try {
      const r = await fetch(`${API_BASE}/posts/1`);
      const j = await r.json();
      Alert.alert("GET", `Title: ${j.title}`);
    } catch {
      Alert.alert("Error", "GET failed");
    }
  };

  const fetchPost = async () => {
    log("POST /posts");
    try {
      const r = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Demo", body: "Hello!", userId: 1 }),
      });
      const j = await r.json();
      Alert.alert("POST", `Created #${j.id}`);
    } catch {
      Alert.alert("Error", "POST failed");
    }
  };

  const xhrGet = () => {
    log("XHR /users/1");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${API_BASE}/users/1`);
    xhr.onload = () => Alert.alert("XHR", JSON.parse(xhr.responseText).name);
    xhr.onerror = () => Alert.alert("Error", "XHR failed");
    xhr.send();
  };

  const fetchError = () => {
    log("GET 404");
    fetch("https://jsonplaceholder.typicode.com/nonexistent/999999")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      })
      .catch((e) => Alert.alert("Error", e.message));
  };

  const logConsole = () => {
    log("Console");
    console.log("Demo log", { key: "value" });
    console.info("Demo info", [1, 2]);
    console.warn("Demo warning");
    console.error("Demo error");
    Alert.alert("Console", "Check LOGS tab");
  };

  const connectWs = () => {
    if (wsRef.current) {
      Alert.alert("Info", "Already connected");
      return;
    }
    log("WS connect");
    const ws = new WebSocket(WS_ECHO_URL);
    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({ text: "Hello from demo!", ts: Date.now() }));
    };
    ws.onmessage = (e) => Alert.alert("WS Echo", `Received: ${e.data}`);
    ws.onerror = () => Alert.alert("Error", "WS error");
    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
    };
    wsRef.current = ws;
  };

  const disconnectWs = () => {
    wsRef.current?.close?.();
    wsRef.current = null;
    setWsConnected(false);
  };

  const logNav = () => {
    log("Navigation");
    Logger.logNavigation("/settings", { userId: 42 });
    Alert.alert("Navigation", "Check LOGS");
  };
  const logDb = () => {
    log("Database");
    Logger.logDatabase("SELECT * FROM users", { results: [{ id: 1 }] });
    Alert.alert("Database", "Check LOGS");
  };
  const logInfo = () => {
    log("Custom info");
    Logger.logInfo("Purchase", { item: "Pro", amount: 29.99 });
    Alert.alert("Info", "Check LOGS");
  };

  const storeIncrement = () => {
    log("Store: inc");
    appStore.setState({ counter: appStore.getState().counter + 1 });
    force();
  };
  const storeToggleBeta = () => {
    log("Store: beta");
    const f = appStore.getState().features;
    appStore.setState({ features: { ...f, beta: !f.beta } });
    force();
  };
  const storeSetUser = () => {
    log("Store: user");
    appStore.setState({
      user: {
        name: `User_${Math.random().toString(36).slice(2, 6)}`,
        role: "admin",
      },
    });
    force();
  };
  const storeReset = () => {
    log("Store: reset");
    appStore.reset();
    force();
  };

  const togglePerf = () => {
    if (perfRunning) {
      stopPerformanceMonitor();
      setPerfRunning(false);
    } else {
      startPerformanceMonitor();
      setPerfRunning(true);
    }
    log(perfRunning ? "Perf stop" : "Perf start");
  };

  const saveCustomUrl = () => {
    if (!customUrl.trim()) {
      Alert.alert("Error", "Enter a URL");
      return;
    }
    Logger.addCustomUrl({
      title: `Custom ${Logger.getCustomUrls().length + 1}`,
      url: customUrl.trim(),
    });
    setCustomUrl("");
    Alert.alert("Success", "Added — check SETTINGS");
  };
  const clearLogs = () => {
    Logger.clearLogs();
    setCalls([]);
    Alert.alert("Cleared", "All logs removed");
  };
  const showLogCount = () =>
    Alert.alert("Stats", `Total: ${Logger.getLogs().length}`);
  const exportJson = async () => {
    try {
      const r = generateExportReport(Logger.getLogs());
      Alert.alert("Export", `JSON: ${JSON.stringify(r).length} chars`);
    } catch {
      Alert.alert("Error", "Export failed");
    }
  };
  const triggerRenderError = () => {
    log("Render error");
    const n: any = null;
    Alert.alert("Error", `${n.nonExistent.prop}`);
  };
  const triggerRejection = () => {
    log("Rejection");
    new Promise((_, r) => r(new Error("Demo")));
    Alert.alert("Rejection", "Check LOGS");
  };

  const screens = ["Home", "Profile", "Settings", "Details", "List", "Notifications"];

  const navigateTo = (screen: string) => {
    log(`Nav: ${screen}`);
    setScreenStack((prev) => [...prev, screen]);
    setCurrentScreen(screen);
    logNavigationEvent({
      screen,
      method: "push",
      params: { from: screenStack[screenStack.length - 1] || screen },
    });
  };

  const goBack = () => {
    if (screenStack.length <= 1) {
      Alert.alert("Info", "Already at root screen");
      return;
    }
    const prev = screenStack[screenStack.length - 2]!;
    log("Nav: back");
    setScreenStack((prev) => prev.slice(0, -1));
    setCurrentScreen(prev);
    logNavigationEvent({
      screen: prev,
      method: "pop",
    });
  };

  const replaceWith = (screen: string) => {
    log(`Nav: replace ${screen}`);
    setScreenStack((prev) => [...prev.slice(0, -1), screen]);
    setCurrentScreen(screen);
    logNavigationEvent({
      screen,
      method: "replace",
    });
  };

  const navigateViaDeepLink = () => {
    const target = screens[Math.floor(Math.random() * screens.length)]!;
    log(`Nav: deep link → ${target}`);
    setScreenStack((prev) => [...prev, target]);
    setCurrentScreen(target);
    logNavigationEvent({
      screen: target,
      method: "link",
      deepLink: `demo://app/${target.toLowerCase()}`,
      params: { utm_source: "demo" },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>📡 Network Monitor Demo</Text>
        <Text style={styles.subtitle}>
          Props controls sync live to the &lt;DebugTrigger&gt; wrapping this
          app. Toggle anything below, then open the debug monitor to see the
          effect.
        </Text>

        {/* ═══ PROPS CONTROLS ═══ */}
        <SectionHeader title="⚙️ PROPS CONTROLS" />
        <View style={styles.section}>
          <PropToggle
            label="passwordOptional"
            value={passOptional}
            onValue={setPassOptional}
          />
          <PropPills
            label="passwordFrequency"
            value={passFreq}
            options={["all-time", "per-install", "app-active"] as const}
            onValue={setPassFreq}
          />
          <PropToggle
            label="enableTapGesture"
            value={enableTapGesture}
            onValue={setEnableTapGesture}
          />
          <PropPills
            label="clicksNeeded"
            value={clicksNeeded}
            options={[3, 5, 7]}
            onValue={setClicksNeeded}
          />
          <PropToggle
            label="checkAccess"
            value={accessEnabled}
            onValue={setAccessEnabled}
          />
          <PropPills
            label="floatingButtonMargin"
            value={btnMargin}
            options={[8, 16, 32]}
            fmt={(n) => `${n}px`}
            onValue={setBtnMargin}
          />
          <PropPills
            label="theme"
            value={theme}
            options={["light", "dark", "auto"] as const}
            onValue={setTheme}
          />
          <PropScrollPills
            label="language"
            value={lang}
            options={
              [
                "en",
                "az",
                "ru",
                "tr",
                "hi",
                "gu",
                "es",
                "fr",
                "de",
                "ar",
                "zh",
                "pt",
                "ja",
                "auto",
              ] as LanguageCode[]
            }
            onValue={setLang}
          />
          <PropPills
            label="env / isDemo"
            value={env}
            options={["prod", "demo"] as const}
            onValue={setEnv}
          />
          <PropToggle
            label="customColors (pink/green)"
            value={useCustomColors}
            onValue={setUseCustomColors}
          />
          <PropToggle
            label="custom floating button"
            value={showCustomFloatingBtn}
            onValue={setShowCustomFloatingBtn}
          />
          <PropPills
            label="maxLogs"
            value={demoMaxLogs}
            options={[0, 10, 50, 200]}
            fmt={(n) => n === 0 ? "All" : `${n}`}
            onValue={setDemoMaxLogs}
          />
          <PropToggle
            label="headerTitle"
            value={demoHeaderTitle !== ""}
            onValue={(v) => setDemoHeaderTitle(v ? "🛠 CUSTOM" : "")}
          />
          <PropToggle
            label="searchPlaceholder"
            value={demoSearchPlaceholder !== ""}
            onValue={(v) => setDemoSearchPlaceholder(v ? "Filter..." : "")}
          />
        </View>

        {/* ═══ FEATURES (disabling hides monitor + tab) ═══ */}
        <SectionHeader title="🔌 FEATURES (disable = hide tab)" />
        <View style={styles.section}>
          <PropToggle
            label="network"
            value={featNetwork}
            onValue={setFeatNetwork}
          />
          <PropToggle
            label="console"
            value={featConsole}
            onValue={setFeatConsole}
          />
          <PropToggle
            label="websocket"
            value={featWebsocket}
            onValue={setFeatWebsocket}
          />
          <PropToggle
            label="performance (FPS)"
            value={featPerformance}
            onValue={setFeatPerformance}
          />
          <PropToggle
            label="errorBoundary"
            value={featErrorBoundary}
            onValue={setFeatErrorBoundary}
          />
          <PropToggle
            label="persistence"
            value={featPersistence}
            onValue={setFeatPersistence}
          />
          <PropToggle
            label="notifications"
            value={featNotifications}
            onValue={setFeatNotifications}
          />
          <PropToggle
            label="navigationFlow"
            value={featNavigationFlow}
            onValue={setFeatNavigationFlow}
          />
        </View>

        {/* ═══ NETWORK ═══ */}
        <SectionHeader title="🌐 NETWORK INTERCEPTION" />
        <View style={styles.section}>
          <ActionCard
            label="GET /posts/1"
            color="#38BDF8"
            onPress={fetchGet}
            subtitle="fetch GET"
          />
          <ActionCard
            label="POST /posts"
            color="#38BDF8"
            onPress={fetchPost}
            subtitle="fetch POST with JSON body"
          />
          <ActionCard
            label="XHR GET /users/1"
            color="#38BDF8"
            onPress={xhrGet}
            subtitle="XMLHttpRequest interception"
          />
          <ActionCard
            label="GET 404 (Error)"
            color="#F43F5E"
            onPress={fetchError}
            subtitle="Triggers error log"
          />
          <Text style={styles.inputLabel}>Add Custom URL</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="https://api.example.com"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity style={styles.smallBtn} onPress={saveCustomUrl}>
              <Text style={styles.smallBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ CONSOLE ═══ */}
        <SectionHeader title="📝 CONSOLE INTERCEPTION" />
        <View style={styles.section}>
          <ActionCard
            label="Log / Info / Warn / Error"
            color="#F59E0B"
            onPress={logConsole}
            subtitle="All four console levels"
          />
        </View>

        {/* ═══ WEBSOCKET ═══ */}
        <SectionHeader title="🔌 WEBSOCKET" />
        <View style={styles.section}>
          <ActionCard
            label={wsConnected ? "✅ Connected" : "Connect Echo WS"}
            color={wsConnected ? "#10B981" : "#8B5CF6"}
            onPress={connectWs}
            subtitle="wss://ws.postman-echo.com/raw"
          />
          {wsConnected ? (
            <ActionCard
              label="Disconnect"
              color="#F43F5E"
              onPress={disconnectWs}
              subtitle="Close"
            />
          ) : null}
        </View>

        {/* ═══ NAVIGATION FLOW ═══ */}
        <SectionHeader title="🧭 NAVIGATION FLOW" />
        <View style={styles.section}>
          <Text style={styles.infoText}>
            Current screen:{" "}
            <Text style={{ color: "#38BDF8", fontWeight: "900" }}>
              {currentScreen}
            </Text>
          </Text>
          <Text style={styles.infoText}>
            Stack:{" "}
            <Text style={{ color: "#94A3B8", fontSize: 10 }}>
              {screenStack.join(" → ")}
            </Text>
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {screens.filter((s) => s !== currentScreen).slice(0, 4).map((screen) => (
              <TouchableOpacity
                key={screen}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: "#10B98120",
                  borderWidth: 1,
                  borderColor: "#10B98140",
                }}
                onPress={() => navigateTo(screen)}
              >
                <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700" }}>
                  {screen == "Home" && currentScreen !== "Home" && screenStack.includes("Home") ? `→ ${screen}` : screen}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: "#F59E0B20",
                borderWidth: 1,
                borderColor: "#F59E0B40",
                alignItems: "center",
              }}
              onPress={goBack}
            >
              <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "700" }}>
                ← Go Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: "#8B5CF620",
                borderWidth: 1,
                borderColor: "#8B5CF640",
                alignItems: "center",
              }}
              onPress={() => replaceWith("Settings")}
            >
              <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "700" }}>
                Replace → Settings
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={{
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: "#38BDF820",
              borderWidth: 1,
              borderColor: "#38BDF840",
              alignItems: "center",
              marginTop: 8,
            }}
            onPress={navigateViaDeepLink}
          >
            <Text style={{ color: "#38BDF8", fontSize: 11, fontWeight: "700" }}>
              🔗 Deep Link (random screen)
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═══ LOGGER API ═══ */}
        <SectionHeader title="📋 LOGGER API" />
        <View style={styles.section}>
          <ActionCard
            label="Log Navigation"
            color="#10B981"
            onPress={logNav}
            subtitle="Logger.logNavigation(route)"
          />
          <ActionCard
            label="Log Database"
            color="#8B5CF6"
            onPress={logDb}
            subtitle="Logger.logDatabase(query, data)"
          />
          <ActionCard
            label="Log Custom Info"
            color="#F59E0B"
            onPress={logInfo}
            subtitle="Logger.logInfo(message, data)"
          />
        </View>

        {/* ═══ STORE / STATE ═══ */}
        <SectionHeader title="🗄️ STORE / STATE (subscribeToState)" />
        <View style={styles.section}>
          <Text style={styles.infoText}>
            Counter:{" "}
            <Text style={{ color: "#38BDF8", fontWeight: "900" }}>
              {appStore.getState().counter}
            </Text>{" "}
            | Beta:{" "}
            <Text style={{ color: "#F59E0B", fontWeight: "900" }}>
              {appStore.getState().features.beta ? "ON" : "OFF"}
            </Text>{" "}
            | User:{" "}
            <Text style={{ color: "#10B981", fontWeight: "900" }}>
              {appStore.getState().user.name}
            </Text>
          </Text>
          <ActionCard
            label="Increment Counter"
            color="#8B5CF6"
            onPress={storeIncrement}
            subtitle="Triggers state diff log"
          />
          <ActionCard
            label="Toggle Beta"
            color="#8B5CF6"
            onPress={storeToggleBeta}
            subtitle="Nested feature flag change"
          />
          <ActionCard
            label="Change User"
            color="#8B5CF6"
            onPress={storeSetUser}
            subtitle="Replaces user object"
          />
          <ActionCard
            label="Reset Store"
            color="#F43F5E"
            onPress={storeReset}
            subtitle="Restores initial state"
          />
        </View>

        {/* ═══ PERFORMANCE ═══ */}
        <SectionHeader title="⚡ PERFORMANCE MONITOR" />
        <View style={styles.section}>
          <ActionCard
            label={perfRunning ? "⏹ Stop FPS Monitor" : "▶️ Start FPS Monitor"}
            color={perfRunning ? "#F43F5E" : "#10B981"}
            onPress={togglePerf}
            subtitle="Check PERFORMANCE tab"
          />
        </View>

        {/* ═══ ERROR TESTING ═══ */}
        <SectionHeader title="🛡️ ERROR BOUNDARY" />
        <View style={styles.section}>
          <ActionCard
            label="Trigger Render Error"
            color="#F43F5E"
            onPress={triggerRenderError}
            subtitle="Caught by ErrorBoundary"
          />
          <ActionCard
            label="Unhandled Rejection"
            color="#F43F5E"
            onPress={triggerRejection}
            subtitle="Captured by global handler"
          />
        </View>

        {/* ═══ UTILITIES ═══ */}
        <SectionHeader title="⚙️ UTILITIES" />
        <View style={styles.section}>
          <ActionCard
            label="Show Log Count"
            color="#64748B"
            onPress={showLogCount}
            subtitle={`${Logger.getLogs().length} logs`}
          />
          <ActionCard
            label="Export JSON Report"
            color="#64748B"
            onPress={exportJson}
            subtitle="generateExportReport()"
          />
          <ActionCard
            label="Clear All Logs"
            color="#F43F5E"
            onPress={clearLogs}
            subtitle="Logger.clearLogs()"
          />
        </View>

        {/* ═══ PROGRAMMATIC API ═══ */}
        <SectionHeader title="🚀 PROGRAMMATIC API (useDebugger)" />
        <View style={styles.section}>
          <ActionCard
            label="Open Debug Monitor"
            color="#7C5CFC"
            onPress={openDebugger}
            subtitle="openDebugger() — skips password modal"
          />
          <ActionCard
            label="Close Debug Monitor"
            color="#7C5CFC"
            onPress={closeDebugger}
            subtitle="closeDebugger()"
          />
          <Text style={styles.infoText}>
            isDebuggerOpen:{" "}
            <Text style={{ color: "#38BDF8" }}>
              {isDebuggerOpen ? "true" : "false"}
            </Text>
          </Text>
        </View>

        {/* ═══ RECENT CALLS ═══ */}
        <SectionHeader title="🕒 RECENT ACTION LOG" color="#64748B" />
        <View
          style={[styles.section, { paddingHorizontal: 0, paddingVertical: 0 }]}
        >
          {calls.length === 0 ? (
            <Text style={[styles.infoText, { padding: 16 }]}>
              No actions yet — tap buttons above
            </Text>
          ) : (
            calls.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.callRow,
                  i === 0 && { backgroundColor: "#1E293B" },
                ]}
              >
                <Text
                  style={[styles.callLabel, i === 0 && { color: "#38BDF8" }]}
                >
                  {c.label}
                </Text>
                <Text style={styles.callTime}>{c.ts.toLocaleTimeString()}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Inline prop control helpers ── */
function PropToggle({
  label,
  value,
  onValue,
}: {
  label: string;
  value: boolean;
  onValue: (v: boolean) => void;
}) {
  return (
    <View style={styles.propRow}>
      <Text style={styles.propLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.toggle, value && styles.toggleOn]}
        onPress={() => onValue(!value)}
      >
        <Text style={styles.toggleText}>{value ? "ON" : "OFF"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function PropPills<T extends string | number>({
  label,
  value,
  options,
  fmt,
  onValue,
}: {
  label: string;
  value: T;
  options: readonly T[];
  fmt?: (v: T) => string;
  onValue: (v: T) => void;
}) {
  return (
    <View style={styles.propRow}>
      <Text style={styles.propLabel}>{label}</Text>
      <View style={styles.propActions}>
        {options.map((o) => (
          <TouchableOpacity
            key={String(o)}
            style={[styles.pill, value === o && styles.pillOn]}
            onPress={() => onValue(o)}
          >
            <Text style={[styles.pillText, value === o && styles.pillTextOn]}>
              {fmt ? fmt(o) : String(o)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PropScrollPills({
  label,
  value,
  options,
  onValue,
}: {
  label: string;
  value: LanguageCode;
  options: readonly LanguageCode[];
  onValue: (v: LanguageCode) => void;
}) {
  return (
    <View style={styles.propRow}>
      <Text style={styles.propLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.propActions}>
          {options.map((o) => (
            <TouchableOpacity
              key={o}
              style={[styles.pill, value === o && styles.pillOn]}
              onPress={() => onValue(o)}
            >
              <Text style={[styles.pillText, value === o && styles.pillTextOn]}>
                {o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   TOP-LEVEL APP — owns all prop state, passes to both components
   ════════════════════════════════════════════════════════════════ */
export default function App() {
  const [clicksNeeded, setClicksNeeded] = useState(5);
  const [passOptional, setPassOptional] = useState(true);
  const [passFreq, setPassFreq] = useState<
    "all-time" | "per-install" | "app-active"
  >("all-time");
  const [enableTapGesture, setEnableTapGesture] = useState(true);
  const [accessEnabled, setAccessEnabled] = useState(true);
  const [btnMargin, setBtnMargin] = useState(16);
  const [lang, setLang] = useState<LanguageCode>("en");
  const [theme, setTheme] = useState<DemoTheme>("dark");
  const [env, setEnv] = useState<DemoEnv>("prod");
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [showCustomFloatingBtn, setShowCustomFloatingBtn] = useState(false);
  const [demoHeaderTitle, setDemoHeaderTitle] = useState("");
  const [demoMaxLogs, setDemoMaxLogs] = useState(0);
  const [demoSearchPlaceholder, setDemoSearchPlaceholder] = useState("");
  const [featNetwork, setFeatNetwork] = useState(true);
  const [featConsole, setFeatConsole] = useState(true);
  const [featWebsocket, setFeatWebsocket] = useState(true);
  const [featPerformance, setFeatPerformance] = useState(true);
  const [featErrorBoundary, setFeatErrorBoundary] = useState(true);
  const [featPersistence, setFeatPersistence] = useState(true);
  const [featNotifications, setFeatNotifications] = useState(true);
  const [featNavigationFlow, setFeatNavigationFlow] = useState(true);

  return (
    <SafeAreaProvider>
      <DebugTrigger
        password="2026"
        passwordOptional={passOptional}
        passwordFrequency={passFreq}
        clicksNeeded={clicksNeeded}
        enabled={true}
        enableTapGesture={enableTapGesture}
        enableShake={false}
        isDemo={env === "demo"}
        prodUrl="https://api.production.com"
        testUrl="https://api.staging.com"
        baseUrls={[
          {
            title: "JSONPlaceholder",
            url: "https://jsonplaceholder.typicode.com",
          },
          { title: "Local Dev", url: "http://localhost:3000" },
          { title: "Staging API", url: "https://staging.example.com" },
        ]}
        onEnvChange={(newEnv) => {
          Logger.logInfo(`Environment changed to: ${newEnv}`);
        }}
        onBaseUrlChange={(newUrl) => {
          Logger.logInfo(`Base URL changed to: ${newUrl}`);
        }}
        floatingButtonMargin={btnMargin}
        language={lang}
        theme={theme}
        checkAccess={() => accessEnabled}
        colors={useCustomColors ? { primary: '#F43F5E', secondary: '#34D399', success: '#38BDF8', accent: '#8B5CF6' } : undefined}
        floatingButtonContent={showCustomFloatingBtn ? <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>⚡DEMO</Text> : undefined}
        onOpen={() => Logger.logInfo('DebugTrigger onOpen fired')}
        onClose={() => Logger.logInfo('DebugTrigger onClose fired')}
        features={{
          network: featNetwork,
          console: featConsole,
          websocket: featWebsocket,
          performance: featPerformance,
          errorBoundary: featErrorBoundary,
          persistence: featPersistence,
          notifications: featNotifications,
          navigationFlow: featNavigationFlow,
        }}
      >
        <AppContent
          clicksNeeded={clicksNeeded}
          passOptional={passOptional}
          passFreq={passFreq}
          enableTapGesture={enableTapGesture}
          accessEnabled={accessEnabled}
          btnMargin={btnMargin}
          lang={lang}
          theme={theme}
          env={env}
          useCustomColors={useCustomColors}
          showCustomFloatingBtn={showCustomFloatingBtn}
          demoHeaderTitle={demoHeaderTitle}
          demoMaxLogs={demoMaxLogs}
          demoSearchPlaceholder={demoSearchPlaceholder}
          setClicksNeeded={setClicksNeeded}
          setPassOptional={setPassOptional}
          setPassFreq={setPassFreq}
          setEnableTapGesture={setEnableTapGesture}
          setAccessEnabled={setAccessEnabled}
          setBtnMargin={setBtnMargin}
          setLang={setLang}
          setTheme={setTheme}
          setEnv={setEnv}
          setUseCustomColors={setUseCustomColors}
          setShowCustomFloatingBtn={setShowCustomFloatingBtn}
          setDemoHeaderTitle={setDemoHeaderTitle}
          setDemoMaxLogs={setDemoMaxLogs}
          setDemoSearchPlaceholder={setDemoSearchPlaceholder}
          featNetwork={featNetwork}
          featConsole={featConsole}
          featWebsocket={featWebsocket}
          featPerformance={featPerformance}
          featErrorBoundary={featErrorBoundary}
          featPersistence={featPersistence}
          featNotifications={featNotifications}
          featNavigationFlow={featNavigationFlow}
          setFeatNetwork={setFeatNetwork}
          setFeatConsole={setFeatConsole}
          setFeatWebsocket={setFeatWebsocket}
          setFeatPerformance={setFeatPerformance}
          setFeatErrorBoundary={setFeatErrorBoundary}
          setFeatPersistence={setFeatPersistence}
          setFeatNotifications={setFeatNotifications}
          setFeatNavigationFlow={setFeatNavigationFlow}
        />
      </DebugTrigger>
    </SafeAreaProvider>
  );
}

/* ════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  scroll: { padding: 16, paddingTop: 24 },
  heading: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLine: { width: 3, height: 16, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  section: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  actionCardLabel: { fontSize: 14, fontWeight: "800" },
  actionCardSub: { color: "#64748B", fontSize: 10, marginTop: 2 },
  propRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 6,
  },
  propLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 115,
  },
  propActions: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0F172A",
  },
  pillOn: { borderColor: "#38BDF8", backgroundColor: "#38BDF8" + "20" },
  pillText: { color: "#64748B", fontSize: 10, fontWeight: "700" },
  pillTextOn: { color: "#38BDF8" },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0F172A",
  },
  toggleOn: { borderColor: "#10B981", backgroundColor: "#10B981" + "20" },
  toggleText: { color: "#64748B", fontSize: 11, fontWeight: "800" },
  infoText: { color: "#94A3B8", fontSize: 11, lineHeight: 18, marginBottom: 8 },
  inputLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 6,
  },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#F8FAFC",
    fontSize: 12,
    padding: 10,
  },
  smallBtn: {
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  smallBtnText: { color: "#0F172A", fontWeight: "900", fontSize: 12 },
  callRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  callLabel: { color: "#94A3B8", fontSize: 11, fontWeight: "600" },
  callTime: { color: "#475569", fontSize: 10 },
});
