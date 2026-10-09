import { Alert, Platform } from "react-native";

/** react-native-web's Alert.alert is a no-op; use this for user-visible messages on all platforms. */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof globalThis.alert === "function") {
      globalThis.alert(text);
    }
    return;
  }
  Alert.alert(title, message);
}
