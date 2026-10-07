import { SymbolView } from 'expo-symbols';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { buildInteractiveMapHtml, MapMarker } from '@/lib/interactive-map-html';

export function InteractiveMap({
  markers,
  style,
  onMarkerPress,
}: {
  markers: MapMarker[];
  style?: StyleProp<ViewStyle>;
  onMarkerPress?: (id: string) => void;
}) {
  const html = buildInteractiveMapHtml(markers);

  if (!html) {
    return (
      <View style={[styles.fallback, style]}>
        <SymbolView
          name={{ ios: 'map', android: 'map', web: 'map' }}
          tintColor="rgba(255,255,255,0.4)"
          size={28}
        />
        <ThemedText style={styles.fallbackLabel} themeColor="primaryText">
          Map preview needs a Mapbox access token
        </ThemedText>
      </View>
    );
  }

  return (
    <WebView
      source={{ html }}
      style={style}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      onMessage={(event) => {
        if (!onMarkerPress) return;
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message?.type === 'markerPress' && typeof message.id === 'string') {
            onMarkerPress(message.id);
          }
        } catch {
          // Ignore malformed messages from the WebView.
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
  },
  fallbackLabel: {
    ...Typography.caption,
    opacity: 0.6,
  },
});
