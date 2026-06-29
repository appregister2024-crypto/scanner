import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";

type ScanEntry = {
  type: string;
  data: string;
  timestamp: string;
};

const barcodeTypes = [
  "qr",
  "aztec",
  "ean13",
  "ean8",
  "upc_e",
  "upc_a",
  "code39",
  "code93",
  "code128",
  "itf14",
  "codabar",
  "pdf417",
  "datamatrix",
] as const;

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(true);
  const [latest, setLatest] = useState<ScanEntry | null>(null);
  const [history, setHistory] = useState<ScanEntry[]>([]);

  const canRenderCamera = permission?.granted && active;

  const subtitle = useMemo(() => {
    if (!permission) return "Kamera izni kontrol ediliyor...";
    if (!permission.granted) return "Tarama için kamera izni gerekli.";
    return active
      ? "Kamerayı barkoda doğrultun. QR, EAN, UPC, Code 128 ve daha fazlası desteklenir."
      : "Tarama duraklatıldı.";
  }, [active, permission]);

  const handleBarcodeScanned = ({ data, type }: { data: string; type?: string }) => {
    if (!data) return;

    const entry: ScanEntry = {
      data,
      type: type ?? "unknown",
      timestamp: new Date().toLocaleString("tr-TR"),
    };

    setLatest(entry);
    setHistory((current) => [entry, ...current].slice(0, 10));
    setActive(false);
  };

  const resumeScanning = () => setActive(true);

  const copyLatest = async () => {
    if (!latest) return;
    await Clipboard.setStringAsync(latest.data);
    Alert.alert("Kopyalandı", "Son okutulan değer panoya alındı.");
  };

  const openLatest = async () => {
    if (!latest) return;
    const url = latest.data.startsWith("http://") || latest.data.startsWith("https://")
      ? latest.data
      : `https://www.google.com/search?q=${encodeURIComponent(latest.data)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Açılamadı", latest.data);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="light" />
        <Text style={styles.title}>Barcode Scanner</Text>
        <Text style={styles.body}>Kamera hazırlığı yapılıyor.</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="light" />
        <Text style={styles.title}>Barcode Scanner</Text>
        <Text style={styles.body}>{subtitle}</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Kamera izni ver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.title}>Barcode Scanner</Text>
        <Text style={styles.body}>{subtitle}</Text>
      </View>

      <View style={styles.cameraFrame}>
        {canRenderCamera ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: [...barcodeTypes] as unknown as string[] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.pausedOverlay]}>
            <Text style={styles.pausedText}>Tarama duraklatıldı</Text>
          </View>
        )}
        <View style={styles.scanWindow} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={resumeScanning}>
          <Text style={styles.buttonText}>Tekrar tara</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={copyLatest} disabled={!latest}>
          <Text style={styles.secondaryButtonText}>Kopyala</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={openLatest} disabled={!latest}>
          <Text style={styles.secondaryButtonText}>Aç</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <Text style={styles.sectionTitle}>Son Sonuç</Text>
        <Text style={styles.resultText}>{latest ? latest.data : "Henüz okutma yok."}</Text>
        {latest ? (
          <Text style={styles.metaText}>
            Tür: {latest.type} {"\n"}
            Zaman: {latest.timestamp}
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>Geçmiş</Text>
        {history.length === 0 ? (
          <Text style={styles.metaText}>Kayıt bulunmuyor.</Text>
        ) : (
          history.map((item, index) => (
            <View key={`${item.timestamp}-${index}`} style={styles.historyItem}>
              <Text style={styles.historyType}>{item.type}</Text>
              <Text style={styles.historyValue} numberOfLines={2}>
                {item.data}
              </Text>
              <Text style={styles.historyTime}>{item.timestamp}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#081018",
  },
  center: {
    flex: 1,
    backgroundColor: "#081018",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  body: {
    color: "#A7B3C0",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
  cameraFrame: {
    marginHorizontal: 16,
    height: 340,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  scanWindow: {
    position: "absolute",
    top: "25%",
    left: "15%",
    right: "15%",
    bottom: "25%",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#7DD3FC",
    backgroundColor: "rgba(125, 211, 252, 0.05)",
  },
  pausedOverlay: {
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  pausedText: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  button: {
    backgroundColor: "#38BDF8",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#07111A",
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "#172033",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  secondaryButtonText: {
    color: "#E2E8F0",
    fontWeight: "700",
  },
  panel: {
    flex: 1,
    marginTop: 14,
  },
  panelContent: {
    padding: 16,
    paddingBottom: 28,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  resultText: {
    color: "#DBEAFE",
    fontSize: 16,
    lineHeight: 22,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#111B2B",
  },
  metaText: {
    color: "#94A3B8",
    marginTop: 10,
    lineHeight: 20,
  },
  historyItem: {
    backgroundColor: "#111B2B",
    padding: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  historyType: {
    color: "#7DD3FC",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  historyValue: {
    color: "#F8FAFC",
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
  },
  historyTime: {
    color: "#94A3B8",
    marginTop: 8,
    fontSize: 12,
  },
});
