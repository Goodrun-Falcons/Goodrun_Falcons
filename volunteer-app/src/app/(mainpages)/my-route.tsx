import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import ReorderableList, {
  ReorderableListReorderEvent,
  useReorderableDrag,
} from 'react-native-reorderable-list';
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
import { useLocation } from '@/context/location-context';
import { useTasks } from '@/context/tasks-context';
import { useTrip } from '@/context/trip-context';
import { api, ApiError, describeApiError } from '@/lib/api';
import { useDrivingRoute } from '@/hooks/use-driving-route';
import { useTheme } from '@/hooks/use-theme';
import { openDirections } from '@/lib/directions';
import { formatDistance, formatDuration } from '@/lib/route-format';
import { RouteMarker, RouteMarkerStatus } from '@/lib/route-map-html';
import { distanceKm } from '@/lib/stop-order';
import { routeStopsPayload } from '@/lib/trip-sync';
import { stopTitle } from '@/types/trip';

const SHEET_COLLAPSED_RATIO = 0.16;
const SHEET_DEFAULT_RATIO = 0.52;
const SHEET_EXPANDED_RATIO = 0.88;
const FLING_VELOCITY_THRESHOLD = 500;
// Close enough to count as "at the stop" — roughly a building plus its car park,
// and comfortably more than a GPS fix's error.
const ARRIVAL_RADIUS_KM = 0.075;

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

// Must be rendered inside a list item, since useReorderableDrag reads the item's context.
function DragHandle() {
  const drag = useReorderableDrag();

  return (
    <Pressable onPressIn={drag} hitSlop={8} style={styles.dragHandle}>
      <SymbolView
        name={{ ios: 'line.3.horizontal', android: 'drag_handle', web: 'drag_handle' }}
        tintColor={BrandColors.navy}
        size={18}
      />
    </Pressable>
  );
}

export default function MyRouteScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const {
    stops,
    cancelTask,
    tripStatus,
    startTrip,
    endTrip,
    routeId,
    setRouteId,
    orderCustomised,
    reorder,
    resetToSuggestedOrder,
  } = useTrip();
  // The sheet's snap points are a % of the map area, not the full window —
  // the docked header above the map shortens that area, so measure it directly
  // instead of assuming it's the whole screen.
  const [mapAreaHeight, setMapAreaHeight] = useState(windowHeight);

  const { coords } = useLocation();

  const currentStopIndex = stops.findIndex((stop) => !stop.done);
  const currentStop = currentStopIndex === -1 ? null : stops[currentStopIndex];
  const tripActive = tripStatus === 'active';

  // Road route from the volunteer through every stop still to do. legs[0] is the hop to
  // the next stop, but only when the route actually starts from the volunteer.
  const route = useDrivingRoute(
    coords,
    stops.filter((stop) => !stop.done).map((stop) => stop.coords)
  );
  const nextLeg = coords ? route?.legs[0] : undefined;
  const arrived =
    tripActive &&
    coords !== null &&
    currentStop !== null &&
    distanceKm(coords, currentStop.coords) <= ARRIVAL_RADIUS_KM;
  let nextStopMessage: string | null = null;
  if (tripActive && currentStop) {
    if (arrived) {
      nextStopMessage = `You're at ${stopTitle(currentStop)} — confirm the ${currentStop.type} when it's done`;
    } else if (nextLeg) {
      nextStopMessage = `Next: ${stopTitle(currentStop)} · ${formatDistance(nextLeg.distanceM)} · ${formatDuration(nextLeg.durationS)}`;
    }
  }
  // You can end the trip once nothing is left to do — once a stop is picked up it can't
  // be cancelled either, so "nothing left" always means every remaining stop is done.
  const allStopsDone = stops.every((stop) => stop.done);
  // The order can only be changed before the trip starts.
  const canReorder = tripStatus === 'ready' && stops.length > 1;
  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { reload: reloadTasks, refreshing } = useTasks();
  // Which trip button's request is in flight, so it can't be tapped twice.
  const [tripBusy, setTripBusy] = useState<'starting' | 'ending' | null>(null);

  // Marks every run on the trip as under way (pickup en_route, request in_transit). After
  // the route is active, so a failure here can't leave a half-started trip behind: the
  // trip goes ahead and the volunteer is told; picked / end still work on these pickups.
  async function startPickups() {
    const pickupIds = [...new Set(stops.flatMap((stop) => (stop.pickupId ? [stop.pickupId] : [])))];
    const results = await Promise.allSettled(pickupIds.map((id) => api.startPickup(id)));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed) {
      Alert.alert(
        'Trip started',
        `Some runs couldn't be marked as under way. ${describeApiError(failed.reason)}`
      );
    }
  }

  // Create the backend route (or reuse one a failed attempt already made), save the stop
  // order to it, start it, start the trip here, then mark its runs under way.
  async function handleStartTrip() {
    if (tripBusy) return;
    const payload = routeStopsPayload(stops);
    if (!payload) {
      // Ids arrive with the next sync; a run without a drop-off can't be routed at all.
      reloadTasks('background');
      Alert.alert(
        "Couldn't start the trip",
        stops.some((stop) => !stop.pickupId)
          ? 'Your runs are still syncing. Please try again in a moment.'
          : 'One of your runs has no drop-off point. Cancel it and try again.'
      );
      return;
    }
    setTripBusy('starting');
    let id = routeId;
    try {
      if (!id) {
        id = (await api.createRoute()).id;
        setRouteId(id);
      }
      // Sent before starting, so the route never goes active without its stops. Safe to
      // repeat on a retry — the backend replaces the stop list with what it's given.
      await api.setRouteStops(id, payload);
      await api.startRoute(id);
      startTrip();
      await startPickups();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      // 409: the route isn't `planned` any more — if it's already active (an earlier
      // start went through but its reply was lost) carry on; otherwise make a fresh one
      // next time.
      if (id && e instanceof ApiError && e.status === 409) {
        const route = await api.getRoute(id).catch(() => null);
        if (route?.status === 'active') {
          startTrip();
          await startPickups();
          return;
        }
        setRouteId(null);
      }
      Alert.alert("Couldn't start the trip", describeApiError(e));
    } finally {
      setTripBusy(null);
    }
  }

  async function handleEndTrip() {
    if (tripBusy) return;
    setTripBusy('ending');
    try {
      if (routeId) await api.endRoute(routeId);
      endTrip();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      // 404 (route gone) or "Route is not active" (already ended): nothing left to end
      // on the backend, so just finish locally.
      if (e instanceof ApiError && (e.status === 404 || e.code === 'Route is not active')) {
        endTrip();
        return;
      }
      Alert.alert("Couldn't end the trip", describeApiError(e));
    } finally {
      setTripBusy(null);
    }
  }

  // Re-sync with the backend each time this tab is opened (the accepted runs come along
  // with every list load), so changes made elsewhere show up without a restart. The
  // callback has to stay stable or every re-render would refire it, hence the ref.
  const reloadRef = useRef(reloadTasks);
  useEffect(() => {
    reloadRef.current = reloadTasks;
  });
  useFocusEffect(
    useCallback(() => {
      reloadRef.current('background');
    }, [])
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Releases the run on the backend (back to `approved`, so it shows on Nearby again)
  // before dropping it from the trip.
  async function releaseRun(taskId: string) {
    setCancellingId(taskId);
    try {
      // Only before the trip starts — once it's under way runs can't be cancelled (the
      // button is hidden), so this is always an accepted request being released.
      await api.cancelRequest(taskId);
      cancelTask(taskId);
      // Puts the run back on Nearby; nothing to show here if it fails.
      reloadTasks('background');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert("Couldn't cancel this run", "It's already in transit or no longer yours.");
      } else if (!(e instanceof ApiError && e.status === 401)) {
        // 401 already sends the volunteer back to login (see apiFetch).
        Alert.alert("Couldn't cancel this run", describeApiError(e));
      }
    } finally {
      setCancellingId(null);
    }
  }

  function confirmCancel(taskId: string, org: string | null) {
    if (cancellingId) return;
    const subject = org ?? 'It';
    Alert.alert('Cancel this run?', `${subject} will go back on the list for other volunteers.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel run', style: 'destructive', onPress: () => releaseRun(taskId) },
    ]);
  }

  function handleReorder({ from, to }: ReorderableListReorderEvent) {
    if (reorder(from, to)) {
      setOrderNotice(null);
      return;
    }
    // The list snaps back on its own; say why, since the rule isn't obvious.
    setOrderNotice("A drop-off can't go before its pickup");
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setOrderNotice(null), 3000);
  }

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
                {pickupCount} pickup{pickupCount === 1 ? '' : 's'} · {dropoffCount} drop-off
                {route
                  ? ` · ${formatDuration(route.durationS)} · ${formatDistance(route.distanceM)}`
                  : ''}
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
          <RouteMap
            markers={routeMarkers}
            dashed={!tripActive}
            routeGeometry={route?.geometry}
            userLocation={coords}
            style={styles.mapImage}
          />

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

            {nextStopMessage && (
              <View
                style={[
                  styles.nextStopBanner,
                  arrived && { backgroundColor: 'rgba(26,138,90,0.1)' },
                ]}
              >
                <SymbolView
                  name={
                    arrived
                      ? {
                          ios: 'checkmark.circle.fill',
                          android: 'check_circle',
                          web: 'check_circle',
                        }
                      : { ios: 'car.fill', android: 'directions_car', web: 'directions_car' }
                  }
                  tintColor={arrived ? '#1a8a5a' : BrandColors.navy}
                  size={16}
                />
                <ThemedText style={styles.nextStopText} themeColor="ink" numberOfLines={2}>
                  {nextStopMessage}
                </ThemedText>
              </View>
            )}

            {canReorder && (
              <View style={styles.orderHintRow}>
                <ThemedText style={styles.orderHint} themeColor={orderNotice ? 'primary' : 'mute'}>
                  {orderNotice ??
                    (orderCustomised
                      ? 'Custom order'
                      : 'Suggested order · hold the handle and drag to change it')}
                </ThemedText>
                {orderCustomised && (
                  <Pressable onPress={resetToSuggestedOrder} hitSlop={8}>
                    <ThemedText style={styles.orderHintAction} themeColor="primary">
                      Reset to suggested
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            )}

            <ReorderableList
              style={styles.list}
              data={stops}
              dragEnabled={canReorder}
              onReorder={handleReorder}
              keyExtractor={(stop) => stop.id}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={() => reloadTasks()}
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
                        {/* Runs can only be cancelled before the trip starts. */}
                        {!tripActive && !stop.done && stop.type === 'pickup' && (
                          <Pressable
                            onPress={() => confirmCancel(stop.taskId, stop.org)}
                            disabled={cancellingId !== null}
                            hitSlop={8}
                            style={[
                              styles.cancelButton,
                              cancellingId === stop.taskId && { opacity: 0.4 },
                            ]}
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
                        {stopTitle(stop)}
                      </ThemedText>
                      <ThemedText style={styles.stopItem} themeColor="mute" numberOfLines={1}>
                        {stop.item}
                      </ThemedText>
                      <ThemedText style={styles.stopAddress} themeColor="mute" numberOfLines={1}>
                        {stop.address}
                      </ThemedText>
                    </View>
                    {canReorder && !stop.done && <DragHandle />}
                    {isCurrent && tripActive && (
                      <View style={styles.currentStopActions}>
                        <Pressable
                          onPress={() => openDirections(stop.coords)}
                          style={[styles.navigateButton, { borderColor: theme.primary }]}
                        >
                          <SymbolView
                            name={{
                              ios: 'arrow.triangle.turn.up.right.diamond.fill',
                              android: 'directions',
                              web: 'directions',
                            }}
                            tintColor={theme.primary}
                            size={14}
                          />
                          <ThemedText style={styles.confirmButtonLabel} themeColor="primary">
                            Navigate
                          </ThemedText>
                        </Pressable>
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
                      </View>
                    )}
                  </View>
                );
              }}
            />

            <View style={styles.actionRow}>
              {tripStatus === 'ready' ? (
                <Pressable
                  onPress={handleStartTrip}
                  disabled={stops.length === 0 || tripBusy !== null}
                  style={[
                    styles.startButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: stops.length === 0 || tripBusy !== null ? 0.5 : 1,
                    },
                  ]}
                >
                  <SymbolView
                    name={{ ios: 'location.fill', android: 'navigation', web: 'navigation' }}
                    tintColor={theme.primaryText}
                    size={16}
                  />
                  <ThemedText style={styles.startButtonLabel} themeColor="primaryText">
                    {tripBusy === 'starting' ? 'Starting…' : 'Start trip'}
                  </ThemedText>
                </Pressable>
              ) : (
                <View style={styles.activeActionRow}>
                  <Pressable
                    onPress={handleEndTrip}
                    disabled={!allStopsDone || tripBusy !== null}
                    style={[
                      styles.secondaryButton,
                      {
                        borderColor: 'rgba(208,35,39,0.3)',
                        opacity: allStopsDone && tripBusy === null ? 1 : 0.5,
                      },
                    ]}
                  >
                    <ThemedText style={styles.secondaryButtonLabel} themeColor="primary">
                      {tripBusy === 'ending' ? 'Ending…' : 'End trip'}
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
  nextStopBanner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(20,26,67,0.06)',
  },
  nextStopText: {
    ...Typography.bodySm,
    flex: 1,
  },
  orderHintRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  orderHint: {
    ...Typography.caption,
  },
  orderHintAction: {
    ...Typography.caption,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  dragHandle: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  currentStopActions: {
    gap: Spacing.xxs,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs - 1.5,
  },
  confirmButton: {
    alignItems: 'center',
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
