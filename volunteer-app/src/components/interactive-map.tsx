import { SymbolView } from 'expo-symbols';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useMapScripts } from '@/hooks/use-map-scripts';
import { buildInteractiveMapHtml, MapMarker } from '@/lib/interactive-map-html';
import { setUserLocationCall } from '@/lib/map-user-location';
import { Coordinates } from '@/types/task';

export function InteractiveMap({
  markers,
  userLocation,
  style,
  onMarkerPress,
}: {
  markers: MapMarker[];
  /** Drawn as a blue dot. Updated in place, so it doesn't reload the map. */
  userLocation?: Coordinates | null;
  style?: StyleProp<ViewStyle>;
  onMarkerPress?: (id: string) => void;
}) {
  const html = buildInteractiveMapHtml(markers);
  const { webViewRef, onLoadStart, onReady } = useMapScripts({
    userLocation: setUserLocationCall(userLocation),
  });

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
      ref={webViewRef}
      source={{ html }}
      style={style}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      onLoadStart={onLoadStart}
      onMessage={(event) => {
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message?.type === 'ready') {
            onReady();
          } else if (message?.type === 'markerPress' && typeof message.id === 'string') {
            onMarkerPress?.(message.id);
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
