import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  DebugTrigger,
  Logger,
  getDeviceInfo,
  useDebugger,
} from "@mspvirajpatel/react-native-network-monitor";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

const WS_ECHO_URL = "wss://ws.postman-echo.com/raw";
const API_BASE = "https://jsonplaceholder.typicode.com";

const LogButton = ({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.actionBtn,
      { backgroundColor: color + "18", borderColor: color + "40" },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

function AppContent() {
  const { openDebugger } = useDebugger();
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const info = getDeviceInfo();
    Logger.logInfo("App mounted", {
      platform: info.platform,
      osVersion: info.osVersion,
      screen: `${info.screenWidth}x${info.screenHeight}`,
    });
  }, []);

  const fetchGet = async () => {
    try {
      const res = await fetch(`${API_BASE}/posts/1`);
      const json = await res.json();
      console.log("GET /posts/1 response:", json);
      Alert.alert("GET Success", json.title);
    } catch (e) {
      console.error("GET failed:", e);
      Alert.alert("Error", "GET request failed");
    }
  };

  const fetchPost = async () => {
    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "foo", body: "bar", userId: 1 }),
      });
      const json = await res.json();
      console.log("POST /posts response:", json);
      Alert.alert("POST Success", `Created post #${json.id}`);
    } catch (e) {
      console.error("POST failed:", e);
    }
  };

  const xhrRequest = () => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${API_BASE}/users/1`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      console.log("XHR /users/1 response:", data);
      Alert.alert("XHR Success", data.name);
    };
    xhr.onerror = () => {
      console.error("XHR failed");
      Alert.alert("Error", "XHR request failed");
    };
    xhr.send();
  };

  const logConsole = () => {
    console.log("Standard log message", { key: "value", nested: { a: 1 } });
    console.info("Info message with array", [1, 2, 3, { x: 10 }]);
    console.warn("Warning: this is a warning message");
    console.error("Error: something went wrong (demo)");
    Alert.alert("Console", "Check the LOGS tab to see all console messages");
  };

  const connectWs = () => {
    if (wsRef.current) {
      Alert.alert("Info", "Already connected to WebSocket");
      return;
    }
    Logger.logInfo("Connecting to WebSocket...", { url: WS_ECHO_URL });
    const ws = new WebSocket(WS_ECHO_URL);
    ws.onopen = () => {
      setWsConnected(true);
      Alert.alert("WebSocket", "Connected! Sending a test message...");
      ws.send(
        JSON.stringify({
          message: "Hello from network-monitor!",
          timestamp: Date.now(),
        }),
      );
    };
    ws.onmessage = (event) => {
      Logger.logInfo("WebSocket echo received", { data: event.data });
      Alert.alert("WebSocket Echo", `Received: ${event.data}`);
    };
    ws.onerror = () => {
      Logger.logInfo("WebSocket error occurred");
      Alert.alert("WebSocket", "Connection error (check WS tab)");
    };
    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
    };
    wsRef.current = ws;
  };

  const disconnectWs = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWsConnected(false);
      Alert.alert("WebSocket", "Disconnected");
    }
  };

  const logNavigation = () => {
    Logger.logNavigation("/profile/42", { userId: 42, from: "home" });
    Alert.alert(
      "Navigation",
      "Logged navigation to /profile/42 — check LOGS tab",
    );
  };

  const logDatabase = () => {
    Logger.logDatabase("SELECT * FROM users WHERE id = ?", {
      params: [42],
      results: [{ id: 42, name: "John Doe" }],
    });
    Alert.alert("Database", "Logged a database query — check LOGS tab");
  };

  const logCustomInfo = () => {
    Logger.logInfo("Custom analytics event", {
      event: "purchase_completed",
      amount: 29.99,
      currency: "USD",
    });
    Alert.alert("Info", "Logged custom info event — check LOGS tab");
  };

  const triggerRenderError = () => {
    Logger.logInfo("Triggering a render error (handled by ErrorBoundary)");
    const obj: any = null;
    Alert.alert("Render Error", `Check LOGS tab: ${obj.nonExistent.property}`);
  };

  const triggerUnhandledRejection = () => {
    Logger.logInfo("Triggering an unhandled promise rejection");
    new Promise((_, reject) => reject(new Error("Demo unhandled rejection")));
    Alert.alert(
      "Rejection",
      "Unhandled promise rejection fired — check LOGS tab",
    );
  };

  const showLogCount = () => {
    const count = Logger.getLogs().length;
    Alert.alert(
      "Log Stats",
      `Total logs captured: ${count}\nOpen the debug monitor to inspect them.`,
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>📡 Network Monitor Demo</Text>
        <Text style={styles.subtitle}>
          Tap the screen 5 times → enter password "2026" to open the debug
          monitor. Or use the button below to open it programmatically.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 NETWORK</Text>
          <View style={styles.row}>
            <Button title="GET /posts/1" onPress={fetchGet} />
            <Button title="POST /posts" onPress={fetchPost} />
          </View>
          <View style={{ marginTop: 8 }}>
            <Button title="XHR GET /users/1" onPress={xhrRequest} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 CONSOLE</Text>
          <LogButton
            label="Log / Info / Warn / Error"
            color="#38BDF8"
            onPress={logConsole}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔌 WEBSOCKET</Text>
          <View style={styles.row}>
            <Button
              title={wsConnected ? "Connected" : "Connect WS"}
              onPress={connectWs}
            />
            <Button title="Disconnect" onPress={disconnectWs} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 LOGGER API</Text>
          <LogButton
            label="Log Navigation Event"
            color="#10B981"
            onPress={logNavigation}
          />
          <LogButton
            label="Log Database Query"
            color="#8B5CF6"
            onPress={logDatabase}
          />
          <LogButton
            label="Log Custom Info Event"
            color="#F59E0B"
            onPress={logCustomInfo}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ ERROR TESTING</Text>
          <LogButton
            label="Trigger Render Error (Caught)"
            color="#F43F5E"
            onPress={triggerRenderError}
          />
          <LogButton
            label="Trigger Unhandled Rejection"
            color="#F43F5E"
            onPress={triggerUnhandledRejection}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ UTILITIES</Text>
          <LogButton
            label="Show Log Count"
            color="#64748B"
            onPress={showLogCount}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 PROGRAMMATIC OPEN</Text>
          <LogButton
            label="Open Debugger (Programmatic)"
            color="#7C5CFC"
            onPress={openDebugger}
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DebugTrigger
        password="2026"
        theme="dark"
        language="en"
        passwordOptional={true}
        prodUrl="https://api.production.com"
        testUrl="https://api.staging.com"
        baseUrls={[
          {
            title: "JSONPlaceholder",
            url: "https://jsonplaceholder.typicode.com",
          },
          { title: "Localhost", url: "http://localhost:3000" },
        ]}
        onEnvChange={(env) => console.log("Environment changed to", env)}
        onBaseUrlChange={(url) => console.log("Base URL changed to", url)}
      >
        <AppContent />
      </DebugTrigger>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  scroll: { padding: 20, paddingTop: 40 },
  heading: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 28,
  },
  section: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sectionTitle: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
