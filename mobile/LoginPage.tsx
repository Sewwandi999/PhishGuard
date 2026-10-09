import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { beginGoogleHandoff, loginAccount, registerAccount, waitForGoogleHandoff, type AccountRole } from "./auth/accounts";
import { showAlert } from "./showAlert";

type LoginPageProps = {
  onAuthenticated?: (session: { email: string; role: AccountRole }) => void;
};

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [googleHint, setGoogleHint] = useState("");
  const [googleWaiting, setGoogleWaiting] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<AccountRole>("user");
  const [busy, setBusy] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const burstScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstRotate = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  const { width, height } = useWindowDimensions();
  const heroHeight = height * (Platform.OS === "web" ? 0.34 : 0.38);
  const webShellMinHeight = Platform.OS === "web" ? height : undefined;
  const webColumnMaxWidth = Platform.OS === "web" ? Math.min(440, width - 32) : undefined;

  const playLoginSuccessBurst = useCallback((): Promise<void> => {
    burstScale.setValue(0);
    burstOpacity.setValue(0);
    burstRotate.setValue(0);
    sparkle1.setValue(0);
    sparkle2.setValue(0);
    sparkle3.setValue(0);

    const wobble = Animated.sequence([
      Animated.timing(burstRotate, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(burstRotate, { toValue: -1, duration: 110, useNativeDriver: true }),
      Animated.timing(burstRotate, { toValue: 0.6, duration: 90, useNativeDriver: true }),
      Animated.timing(burstRotate, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]);

    const sparkles = Animated.stagger(
      90,
      [sparkle1, sparkle2, sparkle3].map((v) =>
        Animated.sequence([
          Animated.spring(v, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
          Animated.spring(v, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }),
        ]),
      ),
    );

    return new Promise((resolve) => {
      Animated.parallel([
        Animated.spring(burstScale, { toValue: 1, friction: 6, tension: 160, useNativeDriver: true }),
        Animated.timing(burstOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        wobble,
        sparkles,
      ]).start(() => {
        Animated.sequence([
          Animated.delay(280),
          Animated.parallel([
            Animated.timing(burstOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            Animated.timing(burstScale, { toValue: 0.88, duration: 220, useNativeDriver: true }),
          ]),
        ]).start(() => resolve());
      });
    });
  }, [burstOpacity, burstRotate, burstScale, sparkle1, sparkle2, sparkle3]);

  const openAppleLogin = useCallback(() => {
    showAlert("Apple Sign-In", "Apple Sign-In is not configured yet. Use email login or Google.");
  }, []);

  const startGoogleLogin = useCallback(() => {
    if (!onAuthenticated || busy || celebrating || googleWaiting) return;
    void (async () => {
      setGoogleWaiting(true);
      setGoogleHint("Opening Google on this computer…");
      try {
        const started = await beginGoogleHandoff();
        if (!started.ok) {
          setGoogleHint("");
          showAlert("Could not log in with Google", started.message);
          return;
        }
        setGoogleHint("Finish Google sign-in in the browser on this computer. The phone continues after that.");
        const res = await waitForGoogleHandoff(started.sessionId);
        if (!res.ok) {
          setGoogleHint("");
          showAlert("Could not log in with Google", res.message);
          return;
        }
        setGoogleHint("");
        setCelebrating(true);
        await playLoginSuccessBurst();
        setCelebrating(false);
        onAuthenticated({ email: res.email, role: res.role });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setGoogleHint("");
        showAlert("Could not log in with Google", message);
      } finally {
        setGoogleWaiting(false);
      }
    })();
  }, [busy, celebrating, googleWaiting, onAuthenticated, playLoginSuccessBurst]);

  const submit = async () => {
    if (busy || celebrating) return;
    if (!onAuthenticated) {
      showAlert("Setup error", "Login handler is missing. Reload the app.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showAlert("Missing email", "Enter your email address.");
      return;
    }
    if (!password) {
      showAlert("Missing password", "Enter your password.");
      return;
    }

    setBusy(true);
    try {
      if (authMode === "login") {
        const res = await loginAccount(trimmedEmail, password);
        if (!res.ok) {
          showAlert("Could not log in", res.message);
          return;
        }
        setBusy(false);
        setCelebrating(true);
        await playLoginSuccessBurst();
        setCelebrating(false);
        onAuthenticated({ email: res.email, role: res.role });
        return;
      }

      const res = await registerAccount(trimmedEmail, password, confirmPassword, registerRole);
      if (!res.ok) {
        showAlert("Could not create account", res.message);
        return;
      }
      onAuthenticated({ email: res.email, role: res.role });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showAlert("Something went wrong", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.outer, webShellMinHeight != null && { minHeight: webShellMinHeight }]}>
      <SafeAreaView style={[styles.container, webColumnMaxWidth != null && { maxWidth: webColumnMaxWidth }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <ImageBackground
            source={require("./assets/bclog.jpg")}
            style={[
              styles.hero,
              { height: heroHeight },
              Platform.OS === "web" ? { width: "100%", alignSelf: "stretch" } : null,
            ]}
            imageStyle={styles.heroImage}
            resizeMode="cover"
          >
            <View style={styles.overlay} pointerEvents="none" />
            <View style={styles.heroContent}>
              <Text style={styles.title}>Welcome to PhishGuard</Text>
              <Text style={styles.heroSub}>
                {authMode === "login" ? "Log in with the email you registered." : "Create an account and choose User, Analyst, or Admin once."}
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.formSection}>
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeChip, authMode === "login" && styles.modeChipActive]}
                onPress={() => setAuthMode("login")}
                hitSlop={8}
                android_ripple={{ color: "rgba(0,0,0,0.12)" }}
              >
                <Text style={[styles.modeText, authMode === "login" && styles.modeTextActive]}>Log in</Text>
              </Pressable>
              <Pressable
                style={[styles.modeChip, authMode === "register" && styles.modeChipActive]}
                onPress={() => setAuthMode("register")}
                hitSlop={8}
                android_ripple={{ color: "rgba(0,0,0,0.12)" }}
              >
                <Text style={[styles.modeText, authMode === "register" && styles.modeTextActive]}>Register</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8c8c8c"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#8c8c8c"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {authMode === "register" ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#8c8c8c"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <Text style={styles.fieldLabel}>Account type (saved to this email)</Text>
                <View style={styles.roleRow}>
                  <Pressable
                    style={[styles.roleChip, registerRole === "user" && styles.roleChipOn]}
                    onPress={() => setRegisterRole("user")}
                  >
                    <Text style={[styles.roleChipText, registerRole === "user" && styles.roleChipTextOn]}>User</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.roleChip, registerRole === "analyst" && styles.roleChipOn]}
                    onPress={() => setRegisterRole("analyst")}
                  >
                    <Text style={[styles.roleChipText, registerRole === "analyst" && styles.roleChipTextOn]}>Analyst</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.roleChip, registerRole === "admin" && styles.roleChipOn]}
                    onPress={() => setRegisterRole("admin")}
                  >
                    <Text style={[styles.roleChipText, registerRole === "admin" && styles.roleChipTextOn]}>Admin</Text>
                  </Pressable>
                </View>
                <Text style={styles.hint}>
                  After registration, you always log in as this role. Users: Dashboard, Scanner, Chatbot, Learning Center, Reports. Analysts: also Dataset, Quality, Logs. Admins: also User Management.
                </Text>
              </>
            ) : null}

            <Pressable
              style={[styles.continueBtn, (busy || celebrating) && styles.continueDisabled]}
              onPress={() => void submit()}
              disabled={busy || celebrating}
              hitSlop={6}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : celebrating ? (
                <Text style={styles.continueText}>…</Text>
              ) : (
                <Text style={styles.continueText}>{authMode === "login" ? "Log in" : "Create account"}</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <Pressable style={styles.optionBtn} onPress={openAppleLogin}>
              <Image source={require("./assets/apple.png")} style={styles.optionIcon} />
              <Text style={styles.optionText}>Login with Apple</Text>
            </Pressable>
            {googleHint ? (
              <View style={styles.googleWait}>
                <ActivityIndicator color="#111827" />
                <Text style={styles.hint}>{googleHint}</Text>
              </View>
            ) : null}
            <Pressable
              style={styles.optionBtn}
              onPress={startGoogleLogin}
              disabled={busy || celebrating || googleWaiting}
            >
              <Image source={require("./assets/google.png")} style={styles.optionIcon} />
              <Text style={styles.optionText}>Login with Google</Text>
            </Pressable>

            <Text style={styles.more}>Show more options</Text>

            <Text style={styles.legal}>
              By continuing, you agree to service terms and security notifications. Accounts are stored on the PhishGuard API server (MongoDB).
            </Text>
          </View>
        </ScrollView>

        <StatusBar style="light" />
      </SafeAreaView>

      {celebrating ? (
        <View style={styles.burstLayer} pointerEvents="auto">
          <View style={styles.burstDim} />
          <Animated.View
            style={[
              styles.burstCard,
              {
                opacity: burstOpacity,
                transform: [
                  { scale: burstScale },
                  {
                    rotate: burstRotate.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ["-14deg", "0deg", "14deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.burstEmoji} accessibilityLabel="Success">
              🛡️
            </Text>
            <Text style={styles.burstTitle}>{"You're in!"}</Text>
            <Text style={styles.burstTagline}>{"Stay sharp — PhishGuard's got your back"}</Text>
            <View style={styles.sparkleRow}>
              {[
                { a: sparkle1, c: "#fbbf24" },
                { a: sparkle2, c: "#34d399" },
                { a: sparkle3, c: "#60a5fa" },
              ].map((s, i) => (
                <Animated.Text
                  key={i}
                  style={[
                    styles.sparkleDot,
                    {
                      color: s.c,
                      opacity: s.a,
                      transform: [
                        {
                          translateY: s.a.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -10],
                          }),
                        },
                        {
                          scale: s.a.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  ✦
                </Animated.Text>
              ))}
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: "#0b1020",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: "#e9eaee",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  hero: {
    justifyContent: "flex-end",
    backgroundColor: "#071325",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  heroContent: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: "#e9eaee",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  modeChipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  modeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  modeTextActive: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: "#111",
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e5e5",
  },
  roleChipOn: {
    borderColor: "#000",
    backgroundColor: "#fff",
  },
  roleChipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  roleChipTextOn: {
    color: "#000",
  },
  hint: {
    fontSize: 12,
    color: "#5c5c5c",
    lineHeight: 18,
    marginBottom: 6,
    flex: 1,
  },
  googleWait: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  continueBtn: {
    backgroundColor: "#000",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  continueDisabled: {
    opacity: 0.7,
  },
  continueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#b9bcc3",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#757b86",
    fontSize: 16,
  },
  optionBtn: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  optionIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  optionText: {
    color: "#111",
    fontSize: 17,
    fontWeight: "500",
  },
  more: {
    textAlign: "center",
    fontSize: 16,
    color: "#111",
    marginTop: 8,
    marginBottom: 12,
  },
  legal: {
    color: "#6d7179",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  burstLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  burstDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 19, 37, 0.55)",
  },
  burstCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 26,
    alignItems: "center",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  burstEmoji: {
    fontSize: 52,
    marginBottom: 6,
  },
  burstTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0b1020",
    marginBottom: 4,
  },
  burstTagline: {
    fontSize: 13,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 10,
  },
  sparkleRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  sparkleDot: {
    fontSize: 18,
    fontWeight: "700",
  },
});
