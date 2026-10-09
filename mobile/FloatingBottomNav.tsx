import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AccountRole } from "./auth/accounts";

export type TabKey = "dashboard" | "scanner" | "chatbot" | "learn" | "reports" | "dataset" | "quality" | "logs" | "users";

type TabDef = {
  key: TabKey;
  label: string;
  glyph: string;
  roles: AccountRole[];
};

const TABS: TabDef[] = [
  { key: "dashboard", label: "Dashboard", glyph: "📊", roles: ["user", "analyst", "admin"] },
  { key: "scanner", label: "Scanner", glyph: "🔍", roles: ["user", "analyst", "admin"] },
  { key: "chatbot", label: "Chatbot", glyph: "🤖", roles: ["user", "analyst", "admin"] },
  { key: "learn", label: "Learn", glyph: "📚", roles: ["user", "analyst", "admin"] },
  { key: "reports", label: "Reports", glyph: "📄", roles: ["user", "analyst", "admin"] },
  { key: "dataset", label: "Dataset", glyph: "🗃", roles: ["analyst", "admin"] },
  { key: "quality", label: "Quality", glyph: "📈", roles: ["analyst", "admin"] },
  { key: "logs", label: "Logs", glyph: "📋", roles: ["analyst", "admin"] },
  { key: "users", label: "Users", glyph: "👥", roles: ["admin"] },
];

const ACTIVE = "#3b82f6";
const INACTIVE = "#d4d4d8";

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
  role: AccountRole;
};

export function FloatingBottomNav({ active, onChange, role }: Props) {
  const insets = useSafeAreaInsets();
  const visible = TABS.filter((t) => t.roles.includes(role));

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.pill}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {visible.map((tab) => {
            const isActive = active === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={styles.tabPress}
                onPress={() => onChange(tab.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
              >
                <View style={[styles.tabInner, isActive && styles.tabInnerActive]}>
                  <Text style={[styles.glyph, isActive && styles.glyphActive]}>{tab.glyph}</Text>
                  <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 14,
  },
  pill: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 32,
    backgroundColor: "rgba(38, 38, 42, 0.94)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    gap: 4,
    minHeight: 52,
  },
  tabPress: {
    flexShrink: 0,
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 56,
  },
  tabInnerActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  glyph: {
    fontSize: 20,
    opacity: 0.85,
  },
  glyphActive: {
    opacity: 1,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "600",
    color: INACTIVE,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: ACTIVE,
  },
});
