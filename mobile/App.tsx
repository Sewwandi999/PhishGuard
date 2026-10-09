import { StatusBar } from "expo-status-bar";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart, ProgressChart } from "react-native-chart-kit";
import LoginPage from "./LoginPage";
import type { AccountRole } from "./auth/accounts";
import { FloatingBottomNav, type TabKey } from "./FloatingBottomNav";
import { showAlert } from "./showAlert";
import ChatbotPage from "./ChatbotPage";
import LearningCenterPage from "./LearningCenterPage";
import { notifyPhishing } from "./notifyPhishing";

type Result = "Phishing" | "Legitimate";

type ScanItem = {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  result: Result;
  probability: number;
  reasons: string[];
};

function allowedTabs(role: AccountRole): TabKey[] {
  if (role === "admin") {
    return ["dashboard", "scanner", "chatbot", "learn", "reports", "dataset", "quality", "logs", "users"];
  }
  if (role === "analyst") {
    return ["dashboard", "scanner", "chatbot", "learn", "reports", "dataset", "quality", "logs"];
  }
  return ["dashboard", "scanner", "chatbot", "learn", "reports"];
}

function roleLabel(role: AccountRole): string {
  if (role === "admin") return "Admin";
  if (role === "analyst") return "Analyst";
  return "User";
}

const chartConfig = {
  backgroundGradientFrom: "#262626",
  backgroundGradientTo: "#262626",
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: () => "#a3a3a3",
};

const seedScans: ScanItem[] = [
  {
    id: "MSG-001",
    timestamp: "2026-04-16 14:32",
    sender: "+94771234567",
    message: "Your account has been suspended. Click here to verify now.",
    result: "Phishing",
    probability: 0.95,
    reasons: ["Suspicious keyword", "Urgency pattern", "External link"],
  },
  {
    id: "MSG-002",
    timestamp: "2026-04-16 14:28",
    sender: "alerts@commercialbank.lk",
    message: "Your transaction of Rs. 5,000 was successful. Ref: TXN45678",
    result: "Legitimate",
    probability: 0.04,
    reasons: ["Normal banking pattern"],
  },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");
  const [role, setRole] = useState<AccountRole>("user");
  const [page, setPage] = useState<TabKey>("dashboard");
  const [scanInput, setScanInput] = useState("");
  const [scanMode, setScanMode] = useState<"message" | "url" | "file">("message");
  const [latestScan, setLatestScan] = useState<ScanItem | null>(null);
  const [scanResult, setScanResult] = useState<ScanItem | null>(null);
  const [datasetRows, setDatasetRows] = useState(2759);
  const [datasetVersion, setDatasetVersion] = useState(2.1);
  const [missingValues, setMissingValues] = useState(18);
  const [duplicateRows, setDuplicateRows] = useState(7);
  const [reportStart, setReportStart] = useState("2026-04-01");
  const [reportEnd, setReportEnd] = useState("2026-04-18");
  const [logs] = useState([
    "INFO Model loaded: v1.3",
    "INFO Scanner service active",
    "WARN Unknown domain flagged",
    "INFO Dataset sync completed",
  ]);
  const [users, setUsers] = useState([
    { name: "Admin User", email: "admin@bank.lk", role: "admin" as AccountRole, active: true },
    { name: "Security Analyst", email: "analyst@bank.lk", role: "analyst" as AccountRole, active: true },
    { name: "John Doe", email: "john@example.com", role: "user" as AccountRole, active: true },
  ]);

  const ROLE_CYCLE: AccountRole[] = ["user", "analyst", "admin"];
  const nextRole = (r: AccountRole): AccountRole => ROLE_CYCLE[(ROLE_CYCLE.indexOf(r) + 1) % ROLE_CYCLE.length];

  const scans = useMemo(() => (latestScan ? [latestScan, ...seedScans] : seedScans), [latestScan]);
  const phishingCount = scans.filter((s) => s.result === "Phishing").length;
  const legitimateCount = scans.length - phishingCount;
  const accuracy = scans.length > 0 ? Math.round((legitimateCount / scans.length) * 100) : 0;

  useEffect(() => {
    if (!allowedTabs(role).includes(page)) {
      setPage("dashboard");
    }
  }, [role, page]);

  const handleAuthenticated = (session: { email: string; role: AccountRole }) => {
    setSessionEmail(session.email);
    setRole(session.role);
    setIsAuthenticated(true);
    setPage("dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSessionEmail("");
    setPage("dashboard");
  };

  const runScan = () => {
    const text = scanInput.trim();
    if (!text) {
      showAlert("Missing input", "Please enter a message or URL to scan.");
      return;
    }

    const risky = /(verify|urgent|click|suspended|password|bank|claim|http)/i.test(text);
    const item: ScanItem = {
      id: `MSG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString(),
      sender: scanMode === "url" ? "URL Input" : "Manual Input",
      message: text,
      result: risky ? "Phishing" : "Legitimate",
      probability: risky ? 0.89 : 0.08,
      reasons: risky ? ["Contains phishing indicators", "Urgency language detected"] : ["No high-risk patterns detected"],
    };

    setLatestScan(item);
    setScanResult(item);
    setScanInput("");

    if (item.result === "Phishing") {
      notifyPhishing(
        "Phishing email/SMS detected",
        "Do not click links or share OTP, passwords, or bank details.",
      );
    }
  };

  const generatePdf = async () => {
    const html = `<html><body style="font-family:Arial;padding:20px"><h2>PhishGuard Report</h2><p>Period: ${reportStart} to ${reportEnd}</p><p>Total Scans: ${scans.length}</p><p>Phishing: ${phishingCount}</p><p>Legitimate: ${legitimateCount}</p><p>Accuracy: ${accuracy}%</p></body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
    } else {
      showAlert("Report ready", `Saved to: ${uri}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onAuthenticated={handleAuthenticated} />
        <StatusBar style="light" />
      </>
    );
  }

  const chartWidth = Math.max(320, Dimensions.get("window").width - 40);

  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <View style={styles.topBarText}>
              <Text style={styles.header}>PhishGuard</Text>
              <Text style={styles.subheader} numberOfLines={1}>
                {sessionEmail} · {roleLabel(role)}
              </Text>
            </View>
            <Pressable onPress={handleLogout} style={styles.logoutBtn} accessibilityRole="button" accessibilityLabel="Log out">
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </View>

          {page === "dashboard" ? (
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.welcomeLine}>Overview and recent activity</Text>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Recent scans</Text>
                {scans.slice(0, 4).map((item) => (
                  <View key={item.id} style={styles.recentRow}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {item.id} · {item.result}
                    </Text>
                    <Text style={styles.small} numberOfLines={2}>
                      {item.message}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.grid}>
                <Metric label="Total Scans" value={`${scans.length}`} />
                <Metric label="Phishing" value={`${phishingCount}`} />
                <Metric label="Legitimate" value={`${legitimateCount}`} />
                <Metric label="Accuracy" value={`${accuracy}%`} />
              </View>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Weekly Detection Trend</Text>
                <ProgressChart
                  data={{ labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], data: [0.42, 0.51, 0.77, 0.65, 0.72] }}
                  width={chartWidth}
                  height={210}
                  strokeWidth={14}
                  radius={30}
                  chartConfig={chartConfig}
                />
              </View>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Message Distribution</Text>
                <PieChart
                  data={[
                    { name: "Phishing", population: phishingCount, color: "#ef4444", legendFontColor: "#a3a3a3", legendFontSize: 12 },
                    { name: "Legitimate", population: legitimateCount, color: "#22c55e", legendFontColor: "#a3a3a3", legendFontSize: 12 },
                  ]}
                  width={chartWidth}
                  height={200}
                  accessor="population"
                  chartConfig={chartConfig}
                  backgroundColor="transparent"
                  paddingLeft="8"
                />
              </View>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>All scans</Text>
              {scans.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.sectionTitle}>
                    {item.id} — {item.result}
                  </Text>
                  <Text style={styles.text}>{item.message}</Text>
                  <Text style={styles.small}>
                    {item.timestamp} · {(item.probability * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {page === "scanner" ? (
            <View style={styles.card}>
              <Text style={styles.title}>Message Scanner</Text>
              <View style={styles.row}>
                <RoleButton label="Message" active={scanMode === "message"} onPress={() => setScanMode("message")} />
                <RoleButton label="URL" active={scanMode === "url"} onPress={() => setScanMode("url")} />
                <RoleButton label="File" active={scanMode === "file"} onPress={() => setScanMode("file")} />
              </View>
              <TextInput
                style={styles.input}
                value={scanInput}
                onChangeText={setScanInput}
                multiline
                placeholder={scanMode === "url" ? "Enter URL" : "Paste message text"}
                placeholderTextColor="#737373"
              />
              <Pressable style={styles.primaryBtn} onPress={runScan}>
                <Text style={styles.primaryText}>Scan Now</Text>
              </Pressable>
              {scanResult ? (
                <View style={[styles.card, styles.resultCard, scanResult.result === "Phishing" ? styles.resultPhish : styles.resultSafe]}>
                  <Text style={styles.sectionTitle}>
                    {scanResult.result} · {(scanResult.probability * 100).toFixed(1)}%
                  </Text>
                  <Text style={styles.text}>{scanResult.message}</Text>
                  {scanResult.reasons.map((r) => (
                    <Text key={r} style={styles.small}>
                      • {r}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {page === "dataset" ? (
            <View style={styles.card}>
              <Text style={styles.title}>Dataset Manager</Text>
              <Text style={styles.text}>
                Rows: {datasetRows} | Version: v{datasetVersion.toFixed(1)}
              </Text>
              <View style={styles.row}>
                <Pressable style={styles.smallBtn} onPress={() => setDatasetRows((v) => v + 120)}>
                  <Text style={styles.primaryText}>Upload</Text>
                </Pressable>
                <Pressable style={styles.smallBtn} onPress={() => showAlert("Preview", "Dataset sample opened.")}>
                  <Text style={styles.primaryText}>Preview</Text>
                </Pressable>
                <Pressable style={styles.dangerBtn} onPress={() => setDatasetRows((v) => Math.max(0, v - 80))}>
                  <Text style={styles.primaryText}>Delete Rows</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {page === "quality" ? (
            <View style={styles.card}>
              <Text style={styles.title}>Data Quality</Text>
              <Text style={styles.text}>Missing values: {missingValues}</Text>
              <Text style={styles.text}>Duplicate rows: {duplicateRows}</Text>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  setMissingValues((m) => Math.max(0, m - 5));
                  setDuplicateRows((d) => Math.max(0, d - 2));
                }}
              >
                <Text style={styles.primaryText}>Clean Dataset</Text>
              </Pressable>
            </View>
          ) : null}

          {page === "logs" ? (
            <View>
              <Text style={styles.title}>Logs Viewer</Text>
              {logs.map((log) => (
                <View key={log} style={styles.card}>
                  <Text style={styles.text}>{log}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {page === "reports" ? (
            <View style={styles.card}>
              <Text style={styles.title}>Report Generator</Text>
              <TextInput value={reportStart} onChangeText={setReportStart} style={styles.simpleInput} placeholderTextColor="#737373" />
              <TextInput value={reportEnd} onChangeText={setReportEnd} style={styles.simpleInput} placeholderTextColor="#737373" />
              <Pressable style={styles.primaryBtn} onPress={generatePdf}>
                <Text style={styles.primaryText}>Generate PDF</Text>
              </Pressable>
            </View>
          ) : null}

          {page === "chatbot" ? <ChatbotPage /> : null}

          {page === "learn" ? <LearningCenterPage /> : null}

          {page === "users" ? (
            <View>
              <Text style={styles.title}>User Management</Text>
              {users.map((u) => (
                <View style={styles.card} key={u.email}>
                  <Text style={styles.sectionTitle}>{u.name}</Text>
                  <Text style={styles.text}>
                    {u.email} | {u.role} | {u.active ? "active" : "inactive"}
                  </Text>
                  <View style={styles.row}>
                    <Pressable
                      style={styles.smallBtn}
                      onPress={() =>
                        setUsers((prev) =>
                          prev.map((x) => (x.email === u.email ? { ...x, role: nextRole(x.role) } : x)),
                        )
                      }
                    >
                      <Text style={styles.primaryText}>Change Role</Text>
                    </Pressable>
                    <Pressable style={styles.dangerBtn} onPress={() => setUsers((prev) => prev.filter((x) => x.email !== u.email))}>
                      <Text style={styles.primaryText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <FloatingBottomNav active={page} onChange={setPage} role={role} />
      <StatusBar style="light" />
    </View>
  );
}

function RoleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.roleChip, active && styles.roleChipActive]} onPress={onPress}>
      <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#000000" },
  safeTop: { flex: 1 },
  content: { padding: 16, paddingBottom: 112 },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  topBarText: { flex: 1, minWidth: 0 },
  header: { fontSize: 28, fontWeight: "800", color: "#fafafa" },
  subheader: { marginTop: 4, color: "#a3a3a3", fontSize: 13 },
  welcomeLine: { color: "#a3a3a3", marginBottom: 12, fontSize: 14 },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#262626",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#404040",
  },
  logoutText: { color: "#e5e5e5", fontWeight: "600", fontSize: 13 },
  card: {
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#333333",
  },
  resultCard: { marginTop: 12 },
  resultPhish: { borderColor: "#7f1d1d" },
  resultSafe: { borderColor: "#14532d" },
  title: { fontSize: 20, fontWeight: "700", color: "#fafafa", marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fafafa", marginBottom: 6 },
  text: { color: "#d4d4d8", marginBottom: 4 },
  small: { color: "#a3a3a3", fontSize: 12 },
  recentRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#333333" },
  recentTitle: { color: "#e5e5e5", fontWeight: "600", marginBottom: 4 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  roleChip: { backgroundColor: "#333333", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  roleChipActive: { backgroundColor: "#2563eb" },
  roleChipText: { color: "#e5e5e5", fontWeight: "600" },
  roleChipTextActive: { color: "#ffffff" },
  input: {
    minHeight: 110,
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    color: "#fafafa",
    marginTop: 6,
  },
  simpleInput: {
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    color: "#fafafa",
  },
  primaryBtn: { backgroundColor: "#2563eb", borderRadius: 12, alignItems: "center", paddingVertical: 12, marginTop: 10 },
  smallBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  dangerBtn: { backgroundColor: "#dc2626", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  primaryText: { color: "#ffffff", fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  metric: {
    width: "48%",
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 12,
    padding: 10,
  },
  metricValue: { fontSize: 22, fontWeight: "800", color: "#fafafa" },
});
