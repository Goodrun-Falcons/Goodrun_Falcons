import { SymbolView } from 'expo-symbols';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useMapScripts } from '@/hooks/use-map-scripts';
import { setUserLocationCall } from '@/lib/map-user-location';
import { buildRouteMapHtml, RouteMarker } from '@/lib/route-map-html';
import { Coordinates } from '@/types/task';

export function RouteMap({
  markers,
  dashed,
  routeGeometry,
  userLocation,
  style,
}: {
  markers: RouteMarker[];
  dashed: boolean;
  /** Road route as [lng, lat] pairs. Until it's known, stops are joined by straight lines. */
  routeGeometry?: [number, number][] | null;
  /** Drawn as a blue dot. Updated in place, so it doesn't reload the map. */
  userLocation?: Coordinates | null;
  style?: StyleProp<ViewStyle>;
}) {
  const html = buildRouteMapHtml(markers, dashed);
  const { webViewRef, onLoadStart, onReady } = useMapScripts({
    route: routeGeometry ? `window.setRoute(${JSON.stringify(routeGeometry)})` : null,
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
          if (JSON.parse(event.nativeEvent.data)?.type === 'ready') onReady();
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
