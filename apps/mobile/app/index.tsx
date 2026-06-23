import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import Constants from "expo-constants";

// O singură sursă: site-ul TradeGx, afișat nativ. Tot ce e pe web e pe mobil.
const SITE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://www.tradegx.com";

// Domeniile considerate "interne" (rămân în WebView). Restul → browser sistem.
const INTERNAL = ["tradegx.com", "www.tradegx.com"];

function isInternal(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return INTERNAL.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return true;
  }
}

export default function Index() {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // Butonul fizic „înapoi" (Android) navighează în istoricul site-ului.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const onNav = (s: WebViewNavigation) => setCanGoBack(s.canGoBack);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <WebView
        ref={webRef}
        source={{ uri: SITE_URL }}
        style={styles.web}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={onNav}
        // Sesiunea (cookie NextAuth) persistă între deschideri
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        // iOS pull-to-refresh
        pullToRefreshEnabled
        allowsBackForwardNavigationGestures
        // Linkurile externe (broker, plăți) → browser; mailto/tel → app dedicată
        onShouldStartLoadWithRequest={(req) => {
          const { url } = req;
          if (/^(mailto:|tel:|sms:)/.test(url)) {
            Linking.openURL(url);
            return false;
          }
          if (url.startsWith("http") && !isInternal(url)) {
            Linking.openURL(url);
            return false;
          }
          return true;
        }}
      />
      {loading && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  web: { flex: 1, backgroundColor: "#09090b" },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090b",
  },
});
