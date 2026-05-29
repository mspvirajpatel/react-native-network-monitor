import { View, Text, Button, StyleSheet } from "react-native";
import { DebugTrigger } from "@mspvirajpatel/react-native-network-monitor";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const fetchPost = async () => {
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
      const json = await res.json();
      console.log("Fetched post", json);
      alert("Fetched post: " + json.title);
    } catch (e) {
      console.error(e);
      alert("Request failed");
    }
  };

  return (
    <SafeAreaProvider>
      <DebugTrigger password={"2026"} theme="auto" language="en">
        <SafeAreaView style={styles.container}>
          <View style={styles.box}>
            <Text style={styles.title}>
              react-native-network-monitor — Expo Go
            </Text>
            <Button title="Fetch Post" onPress={fetchPost} />
          </View>
        </SafeAreaView>
      </DebugTrigger>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  box: {
    width: "90%",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
  },
});
