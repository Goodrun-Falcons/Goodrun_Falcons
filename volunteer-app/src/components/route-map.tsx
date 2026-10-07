import { SymbolView } from 'expo-symbols';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { buildRouteMapHtml, RouteMarker } from '@/lib/route-map-html';

export function RouteMap({
  markers,
  dashed,
  style,
}: {
  markers: RouteMarker[];
  dashed: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const html = buildRouteMapHtml(markers, dashed);

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
