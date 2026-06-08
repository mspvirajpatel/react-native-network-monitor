import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styleSheet, { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import {
  type NavigationEvent,
  type NavigationFlowNode,
  type NavigationFlowEdge,
  subscribeToNavigation,
  getNavigationFlow,
  clearNavigationEvents,
  logNavigationEvent,
  getScreenStats,
} from '../NavigationTracker';

interface NavigationFlowPanelProps {
  C: ThemeColors;
  t: Translation;
}

const METHOD_COLORS: Record<string, string> = {
  push: '#38BDF8',
  pop: '#F97316',
  replace: '#A855F7',
  reset: '#EF4444',
  navigate: '#22C55E',
  dismiss: '#EAB308',
  modal: '#EC4899',
  link: '#06B6D4',
  unknown: '#6B7280',
};

const NavigationFlowPanel: React.FC<NavigationFlowPanelProps> = ({ C, t }) => {
  const styles = styleSheet(C);
  const [events, setEvents] = useState<NavigationEvent[]>([]);
  const [flow, setFlow] = useState<{ nodes: NavigationFlowNode[]; edges: NavigationFlowEdge[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState({ totalScreens: 0, totalTransitions: 0, totalEvents: 0, totalTimeMs: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToNavigation((newEvents) => {
      setEvents(newEvents);
      setFlow(getNavigationFlow());
      setStats(getScreenStats());
    });
    return unsub;
  }, []);

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getNodeColor = (visits: number) => {
    if (visits > 10) return C.error;
    if (visits > 5) return C.warning;
    return C.primary;
  };

  return (
    <ScrollView style={styles.perfContainer}>
      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            const screens = ['Home', 'Profile', 'Settings', 'Detail', 'List'];
            const methods: Array<'push' | 'pop' | 'replace' | 'navigate'> = ['push', 'pop', 'replace', 'navigate'];
            const randomScreen = screens[Math.floor(Math.random() * screens.length)]!;
            const randomMethod = methods[Math.floor(Math.random() * methods.length)]!;
            logNavigationEvent({
              screen: randomScreen,
              method: randomMethod,
              params: { id: Math.floor(Math.random() * 100) },
            });
          }}
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: C.primary + '20',
            borderWidth: 1,
            borderColor: C.primary + '40',
          }}
        >
          <Text style={{ color: C.primary, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
            Simulate Nav
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={clearNavigationEvents}
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: C.error + '20',
            borderWidth: 1,
            borderColor: C.error + '40',
          }}
        >
          <Text style={{ color: C.error, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.perfCard}>
        <View style={styles.perfRow}>
          <Text style={styles.perfLabel}>Screens</Text>
          <Text style={styles.perfValue}>{stats.totalScreens}</Text>
        </View>
        <View style={styles.perfRow}>
          <Text style={styles.perfLabel}>Transitions</Text>
          <Text style={styles.perfValue}>{stats.totalTransitions}</Text>
        </View>
        <View style={styles.perfRow}>
          <Text style={styles.perfLabel}>Events</Text>
          <Text style={styles.perfValue}>{stats.totalEvents}</Text>
        </View>
        {stats.totalTimeMs > 0 ? (
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>Duration</Text>
            <Text style={styles.perfValue}>{formatDuration(stats.totalTimeMs)}</Text>
          </View>
        ) : null}
      </View>

      {/* Flow Diagram */}
      {flow.nodes.length > 0 ? (
        <View style={styles.perfCard}>
          <Text style={[styles.perfLabel, { marginBottom: 12 }]}>FLOW DIAGRAM</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 8 }}>
              {flow.nodes.map((node, idx) => (
                <React.Fragment key={node.screen}>
                  {/* Node */}
                  <TouchableOpacity
                    onPress={() => setSelectedNode(selectedNode === node.screen ? null : node.screen)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: selectedNode === node.screen
                        ? getNodeColor(node.visits)
                        : getNodeColor(node.visits) + '20',
                      borderWidth: 2,
                      borderColor: getNodeColor(node.visits),
                      minWidth: 80,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: selectedNode === node.screen ? '#FFF' : getNodeColor(node.visits),
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                      numberOfLines={1}
                    >
                      {node.screen}
                    </Text>
                    <Text
                      style={{
                        color: selectedNode === node.screen ? '#FFF' : C.textDim,
                        fontSize: 9,
                        marginTop: 2,
                      }}
                    >
                      {node.visits}×
                    </Text>
                  </TouchableOpacity>

                  {/* Arrow */}
                  {idx < flow.nodes.length - 1 ? (
                    <View style={{ alignItems: 'center', paddingHorizontal: 2 }}>
                      <Text style={{ color: C.textDim, fontSize: 16 }}>→</Text>
                    </View>
                  ) : null}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {/* Edges list */}
      {flow.edges.length > 0 ? (
        <View style={styles.perfCard}>
          <Text style={[styles.perfLabel, { marginBottom: 8 }]}>TRANSITIONS</Text>
          {flow.edges.map((edge) => (
            <View
              key={`${edge.from}→${edge.to}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Text style={{ color: C.text, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                {edge.from}
              </Text>
              <Text style={{ color: C.textDim, fontSize: 11, marginHorizontal: 4 }}>→</Text>
              <Text style={{ color: C.text, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                {edge.to}
              </Text>
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {edge.methods.map((method) => (
                  <View
                    key={method}
                    style={{
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                      borderRadius: 3,
                      backgroundColor: (METHOD_COLORS[method] || C.textDim) + '20',
                    }}
                  >
                    <Text style={{ color: METHOD_COLORS[method] || C.textDim, fontSize: 8, fontWeight: '700' }}>
                      {method.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={{ color: C.textDim, fontSize: 10, marginLeft: 6 }}>
                {edge.count}×
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Event timeline */}
      {events.length > 0 ? (
        <View style={styles.perfCard}>
          <Text style={[styles.perfLabel, { marginBottom: 8 }]}>TIMELINE</Text>
          {events.slice(0, 50).map((event) => (
            <View
              key={event.id}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: METHOD_COLORS[event.method] || C.textDim,
                  marginTop: 4,
                  marginRight: 8,
                }}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: C.text, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                    {event.screen}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                      borderRadius: 3,
                      backgroundColor: (METHOD_COLORS[event.method] || C.textDim) + '20',
                    }}
                  >
                    <Text style={{ color: METHOD_COLORS[event.method] || C.textDim, fontSize: 8, fontWeight: '700' }}>
                      {event.method.toUpperCase()}
                    </Text>
                  </View>
                  {event.durationMs !== undefined ? (
                    <Text style={{ color: C.textDim, fontSize: 9 }}>
                      {formatDuration(event.durationMs)}
                    </Text>
                  ) : null}
                </View>
                {event.deepLink ? (
                  <Text style={{ color: C.accent, fontSize: 9, marginTop: 2 }} numberOfLines={1}>
                    🔗 {event.deepLink}
                  </Text>
                ) : null}
              </View>
              <Text style={{ color: C.textDim, fontSize: 9, marginLeft: 8 }}>
                {formatTime(event.timestamp)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.perfCard}>
          <Text style={[styles.perfLabel, { textAlign: 'center', marginVertical: 20 }]}>
            {t.empty || 'No navigation events yet'}
          </Text>
          <Text style={{ color: C.textDim, fontSize: 10, textAlign: 'center' }}>
            Navigation events will appear here.
            {'\n'}Use logNavigationEvent() to track manually.
          </Text>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default NavigationFlowPanel;
