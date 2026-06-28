import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import Constants from "expo-constants";

// App = shell nativ care afișează site-ul TradeGx. Toate funcțiile + sync automat.
const SITE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://www.tradegx.com";
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
  const [firstLoad, setFirstLoad] = useState(true);
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
    <View style={st.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <WebView
          ref={webRef}
          source={{ uri: SITE_URL }}
          style={st.web}
          onLoadEnd={() => setFirstLoad(false)}
          onNavigationStateChange={onNav}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          pullToRefreshEnabled
          allowsBackForwardNavigationGestures
          decelerationRate="normal"
          overScrollMode="never"
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
      </SafeAreaView>

      {/* Splash branded — vizibil doar la prima încărcare */}
      {firstLoad && (
        <View style={st.splash} pointerEvents="none">
          <LinearGradient
            colors={["#13131a", "#09090b"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Image source={require("../assets/icon.png")} style={st.logo} />
          <Text style={st.brand}>TradeGx</Text>
          <ActivityIndicator size="small" color="#6366f1" style={{ marginTop: 20 }} />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#09090b" },
  web: { flex: 1, backgroundColor: "#09090b" },
  splash: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 96, height: 96, borderRadius: 22 },
  brand: { color: "#fafafa", fontSize: 26, fontWeight: "800", marginTop: 16, letterSpacing: -0.5 },
});
