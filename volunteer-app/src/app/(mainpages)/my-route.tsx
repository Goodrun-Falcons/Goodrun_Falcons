import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteMap } from '@/components/route-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BrandColors,
  Elevation,
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTrip } from '@/context/trip-context';
import { useTheme } from '@/hooks/use-theme';
import { RouteMarker, RouteMarkerStatus } from '@/lib/route-map-html';

const SHEET_COLLAPSED_RATIO = 0.16;
const SHEET_DEFAULT_RATIO = 0.52;
const SHEET_EXPANDED_RATIO = 0.88;
const FLING_VELOCITY_THRESHOLD = 500;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function nearestSnapPoint(value: number, points: number[]) {
  'worklet';
  return points.reduce((closest, point) =>
    Math.abs(point - value) < Math.abs(closest - value) ? point : closest
  );
}

export default function MyRouteScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { stops, removeStop, tripStatus, startTrip, endTrip } = useTrip();
  // The sheet's snap points are a % of the map area, not the full window —
  // the docked header above the map shortens that area, so measure it directly
  // instead of assuming it's the whole screen.
  const [mapAreaHeight, setMapAreaHeight] = useState(windowHeight);

  const currentStopIndex = stops.findIndex((stop) => !stop.done);
  const tripActive = tripStatus === 'active';
  // You can end the trip once nothing is left to do — once a stop is picked up it can't
  // be cancelled either, so "nothing left" always means every remaining stop is done.
  const allStopsDone = stops.every((stop) => stop.done);

  const routeMarkers: RouteMarker[] = stops.map((stop, i) => {
    const status: RouteMarkerStatus = stop.done
      ? 'done'
      : i === currentStopIndex && tripActive
        ? 'active'
        : 'pending';
    return { coords: stop.coords, label: stop.done ? '✓' : String(i + 1), status };
  });

  const pickupCount = stops.filter((s) => s.type === 'pickup').length;
  const dropoffCount = stops.filter((s) => s.type === 'dropoff').length;

  const collapsedHeight = Math.round(mapAreaHeight * SHEET_COLLAPSED_RATIO);
  const defaultHeight = Math.round(mapAreaHeight * SHEET_DEFAULT_RATIO);
  const expandedHeight = Math.round(mapAreaHeight * SHEET_EXPANDED_RATIO);
  const snapPoints = [collapsedHeight, defaultHeight, expandedHeight];

  const sheetHeight = useSharedValue(defaultHeight);
  const dragStartHeight = useSharedValue(defaultHeight);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStartHeight.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      sheetHeight.value = clamp(
        dragStartHeight.value - event.translationY,
        collapsedHeight,
        expandedHeight
      );
    })
    .onEnd((event) => {
      let target = nearestSnapPoint(sheetHeight.value, snapPoints);
      if (event.velocityY < -FLING_VELOCITY_THRESHOLD) {
        target = snapPoints[Math.min(snapPoints.indexOf(target) + 1, snapPoints.length - 1)];
      } else if (event.velocityY > FLING_VELOCITY_THRESHOLD) {
        target = snapPoints[Math.max(snapPoints.indexOf(target) - 1, 0)];
      }
      sheetHeight.value = withSpring(target, { damping: 22, stiffness: 220 });
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({ height: sheetHeight.value }));

  return (
    <GestureHandlerRootView style={styles.screen}>
      <ThemedView type="canvasSoft" style={styles.screen}>
        <StatusBar style="light" />

        {/*
        Docked above the map rather than floating over it — a native WebView
        composites as its own always-on-top surface and ignores normal sibling
        paint order (even zIndex/elevation), so a translucent header over the
        map isn't reliably renderable. Same fix as the Nearby screen.
      */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.topBarContent}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: tripActive ? theme.primary : 'rgba(255,255,255,0.35)' },
              ]}
            />
            <View style={styles.statusTextGroup}>
              <ThemedText style={styles.statusTitle} themeColor="primaryText">
                {tripActive ? 'Trip in progress' : 'My Route'}
              </ThemedText>
              <ThemedText style={styles.statusSubtitle} themeColor="primaryText">
                {pickupCount} pickup{pickupCount === 1 ? '' : 's'} · {dropoffCount} drop-off · ~22
                min · 5.5 km
              </ThemedText>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: tripActive ? 'rgba(208,35,39,0.2)' : 'rgba(255,255,255,0.1)' },
              ]}
            >
              <ThemedText
                style={styles.statusBadgeLabel}
                themeColor={tripActive ? 'primary' : 'primaryText'}
              >
                {tripActive ? 'ACTIVE' : 'READY'}
              </ThemedText>
            </View>
          </View>
        </View>

        <View
          style={styles.mapArea}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            setMapAreaHeight(height);
            // Reanimated shared value: `.value` assignment is the correct way to
            // update it and doesn't participate in React's render/effect purity model.
            // eslint-disable-next-line react-hooks/immutability
            sheetHeight.value = Math.round(height * SHEET_DEFAULT_RATIO);
          }}
        >
          <RouteMap markers={routeMarkers} dashed={!tripActive} style={styles.mapImage} />

          <Animated.View style={[styles.sheet, Elevation.level2, animatedSheetStyle]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.sheetHandleArea}>
                <View style={styles.sheetHandle} />
              </View>
            </GestureDetector>

            <View style={styles.sheetHeaderRow}>
              <ThemedText style={styles.sheetTitle} themeColor="ink">
                Stops
              </ThemedText>
              <ThemedText style={styles.sheetSubtitle} themeColor="mute">
                Stop {Math.min(currentStopIndex + 1, stops.length)} of {stops.length}
              </ThemedText>
            </View>

            <FlatList
              style={styles.list}
              data={stops}
              keyExtractor={(stop) => stop.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <ThemedText style={styles.emptyState} themeColor="mute">
                  No stops yet — accept a run from Nearby Runs to build your route.
                </ThemedText>
              }
              renderItem={({ item: stop, index }) => {
                const isCurrent = index === currentStopIndex;
                return (
                  <View
                    style={[
                      styles.stopCard,
                      isCurrent && tripActive && styles.stopCardActive,
                      stop.done && styles.stopCardDone,
                    ]}
                  >
                    <View
                      style={[
                        styles.stopIndex,
                        stop.done
                          ? styles.stopIndexDone
                          : isCurrent && tripActive
                            ? { backgroundColor: theme.primary }
                            : { backgroundColor: theme.canvasSoft },
                      ]}
                    >
                      <ThemedText
                        style={styles.stopIndexLabel}
                        themeColor={
                          stop.done ? 'link' : isCurrent && tripActive ? 'primaryText' : 'mute'
                        }
                      >
                        {stop.done ? '✓' : index + 1}
                      </ThemedText>
                    </View>
                    <View style={styles.stopTextGroup}>
                      <View style={styles.stopHeaderRow}>
                        <View style={styles.stopTypeRow}>
                          <ThemedText
                            style={[
                              styles.stopType,
                              { color: stop.type === 'pickup' ? '#e07b00' : '#1a8a5a' },
                            ]}
                          >
                            {stop.type.toUpperCase()}
                          </ThemedText>
                        </View>
                        {!stop.done && stop.id.startsWith('task-') && (
                          <Pressable
                            onPress={() => removeStop(stop.id)}
                            hitSlop={8}
                            style={styles.cancelButton}
                          >
                            <SymbolView
                              name={{ ios: 'xmark', android: 'close', web: 'close' }}
                              tintColor={theme.mute}
                              size={12}
                            />
                          </Pressable>
                        )}
                      </View>
                      <ThemedText style={styles.stopOrg} themeColor="ink" numberOfLines={1}>
                        {stop.org}
                      </ThemedText>
                      <ThemedText style={styles.stopItem} themeColor="mute" numberOfLines={1}>
                        {stop.item}
                      </ThemedText>
                      <ThemedText style={styles.stopAddress} themeColor="mute" numberOfLines={1}>
                        {stop.address}
                      </ThemedText>
                    </View>
                    {isCurrent && tripActive && (
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/handover', params: { stopId: stop.id } })
                        }
                        style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                      >
                        <ThemedText style={styles.confirmButtonLabel} themeColor="primaryText">
                          Confirm
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                );
              }}
            />

            <View style={styles.actionRow}>
              {tripStatus === 'ready' ? (
                <Pressable
                  onPress={startTrip}
                  disabled={stops.length === 0}
                  style={[
                    styles.startButton,
                    { backgroundColor: theme.primary, opacity: stops.length === 0 ? 0.5 : 1 },
                  ]}
                >
                  <SymbolView
                    name={{ ios: 'location.fill', android: 'navigation', web: 'navigation' }}
                    tintColor={theme.primaryText}
                    size={16}
                  />
                  <ThemedText style={styles.startButtonLabel} themeColor="primaryText">
                    Start trip
                  </ThemedText>
                </Pressable>
              ) : (
                <View style={styles.activeActionRow}>
                  <Pressable
                    onPress={endTrip}
                    disabled={!allStopsDone}
                    style={[
                      styles.secondaryButton,
                      { borderColor: 'rgba(208,35,39,0.3)', opacity: allStopsDone ? 1 : 0.5 },
                    ]}
                  >
                    <ThemedText style={styles.secondaryButtonLabel} themeColor="primary">
                      End trip
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: BrandColors.navy,
  },
  topBarContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  statusTextGroup: {
    flex: 1,
  },
  statusTitle: {
    ...Typography.bodyMdStrong,
  },
  statusSubtitle: {
    ...Typography.caption,
    marginTop: 1,
    opacity: 0.7,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.half + 1,
  },
  statusBadgeLabel: {
    ...Typography.caption,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  mapArea: {
    flex: 1,
  },
  mapImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  sheetHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxs,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: '#e0e1e6',
  },
  sheetHeaderRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sheetTitle: {
    ...Typography.bodyMdStrong,
  },
  sheetSubtitle: {
    ...Typography.caption,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
  },
  separator: {
    height: Spacing.xs,
  },
  emptyState: {
    ...Typography.bodyMd,
    textAlign: 'center',
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: '#e4e6ef',
    padding: Spacing.sm,
  },
  stopCardActive: {
    borderColor: '#d02327',
    backgroundColor: 'rgba(208,35,39,0.04)',
  },
  stopCardDone: {
    opacity: 0.5,
  },
  stopIndex: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIndexDone: {
    backgroundColor: 'rgba(138,141,153,0.15)',
  },
  stopIndexLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  stopTextGroup: {
    flex: 1,
  },
  stopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  cancelButton: {
    padding: Spacing.xxs,
    marginRight: -Spacing.xxs,
  },
  stopType: {
    ...Typography.caption,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  stopOrg: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  stopItem: {
    ...Typography.caption,
  },
  stopAddress: {
    ...Typography.caption,
    marginTop: 1,
  },
  confirmButton: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  confirmButtonLabel: {
    ...Typography.caption,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  actionRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.sm + 2,
  },
  startButtonLabel: {
    ...Typography.buttonMd,
  },
  activeActionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 2,
    paddingVertical: Spacing.sm,
  },
  secondaryButtonLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
});
