import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InteractiveMap } from '@/components/interactive-map';
import { TaskCard } from '@/components/task-card';
import { TeamFilter } from '@/components/team-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
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
import { useAreaName } from '@/hooks/use-area-name';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, describeApiError } from '@/lib/api';
import { MAX_RUNS_PER_TRIP } from '@/lib/stop-order';
import { Task, TaskTeam } from '@/types/task';

const SHEET_COLLAPSED_RATIO = 0.16;
const SHEET_DEFAULT_RATIO = 0.46;
const SHEET_EXPANDED_RATIO = 0.88;
const FLING_VELOCITY_THRESHOLD = 500;
// How often the list is re-fetched while Nearby is on screen, so runs other volunteers
// take (or orgs add) show up without pulling to refresh.
const AUTO_REFRESH_MS = 30_000;

const RADIUS_OPTIONS: { label: string; km: number | null }[] = [
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: '20 km', km: 20 },
  { label: 'All', km: null },
];

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

export default function NearbyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { acceptTask, isAccepted, acceptedCount, canAcceptMore } = useTrip();
  const { coords, status: locationStatus, requestPermission } = useLocation();
  // Set when arriving from a Home card: `/nearby?highlight=<taskId>`.
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const areaName = useAreaName(coords);
  const [radiusKm, setRadiusKm] = useState<number | null>(RADIUS_OPTIONS[0].km);
  // Null shows every team.
  const [team, setTeam] = useState<TaskTeam | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  // The sheet's snap points are a % of the map area, not the full window —
  // the docked header above the map shortens that area, so measure it directly
  // instead of assuming it's the whole screen.
  const [mapAreaHeight, setMapAreaHeight] = useState(windowHeight);
  const listRef = useRef<FlatList<Task>>(null);

  const { tasks: allTasks, loading, refreshing, error, reload } = useTasks();
  // The run whose Accept request is in flight, so its button can't be tapped twice.
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Refresh quietly every minute while this screen is focused; the timer stops when
  // the volunteer switches tab. The callback must stay stable — GPS fixes re-render
  // this screen every few metres, and re-running it would keep restarting the timer —
  // so it reaches the latest `reload` through a ref.
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  });
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => reloadRef.current('background'), AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [])
  );
  const tasks = allTasks
    .filter((task) => radiusKm === null || (task.distanceKm ?? 0) <= radiusKm)
    .filter((task) => team === null || task.team === team)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  // Outline the run the volunteer tapped on Home, widening the radius filter just enough
  // (and clearing a team filter that excludes it) so it isn't hidden. Adjusted during render (React's pattern for responding to a
  // changed input) so the first paint already has the right filter and outline.
  const [handledHighlight, setHandledHighlight] = useState<string | undefined>();
  // Waits for the first load, or a run that's on its way would look missing.
  if (highlight && highlight !== handledHighlight && !loading) {
    setHandledHighlight(highlight);
    const target = allTasks.find((task) => task.id === highlight);
    if (target) {
      setHighlightedTaskId(highlight);
      const distance = target.distanceKm ?? 0;
      if (radiusKm !== null && distance > radiusKm) {
        setRadiusKm(RADIUS_OPTIONS.find((o) => o.km === null || distance <= o.km)?.km ?? null);
      }
      if (team !== null && target.team !== team) setTeam(null);
    }
  }

  // Then bring its card into view. Keyed on the request only — the list re-sorts as the
  // volunteer moves, and that shouldn't keep yanking it back to this card.
  useEffect(() => {
    if (!handledHighlight) return;
    const index = tasks.findIndex((task) => task.id === handledHighlight);
    if (index !== -1) listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handledHighlight]);

  const locationOff = locationStatus === 'denied' || locationStatus === 'blocked';
  const locationLabel = locationOff
    ? 'Location off · tap to enable'
    : (areaName ?? (coords ? 'Near you' : 'Locating…'));

  const mapMarkers = [
    ...tasks
      .filter((task) => task.urgency === 'urgent')
      .map((task) => ({ ...task.pickupCoords, color: BrandColors.red, id: task.id })),
    ...tasks
      .filter((task) => task.urgency !== 'urgent')
      .map((task) => ({ ...task.pickupCoords, color: '#8a8d99', id: task.id })),
  ];

  const collapsedHeight = Math.round(mapAreaHeight * SHEET_COLLAPSED_RATIO);
  const defaultHeight = Math.round(mapAreaHeight * SHEET_DEFAULT_RATIO);
  const expandedHeight = Math.round(mapAreaHeight * SHEET_EXPANDED_RATIO);
  const snapPoints = [collapsedHeight, defaultHeight, expandedHeight];

  const sheetHeight = useSharedValue(defaultHeight);
  const dragStartHeight = useSharedValue(defaultHeight);

  // The backend creates the pickup first; only then does the run join the local trip.
  async function handleAccept(task: Task) {
    if (!canAcceptMore || acceptingId) return;
    setAcceptingId(task.id);
    try {
      const pickup = await api.acceptRequest(task.id);
      acceptTask({ ...task, pickupId: pickup.id });
    } catch (e) {
      // 401 already sends the volunteer back to login (see apiFetch).
      if (e instanceof ApiError && e.status === 401) return;
      if (e instanceof ApiError && (e.status === 404 || e.status === 409)) {
        Alert.alert('Run no longer available', 'Someone else may have taken it already.');
      } else {
        Alert.alert("Couldn't accept this run", describeApiError(e));
      }
      // Whatever went wrong, the backend may have half-done it (e.g. created the pickup
      // but not marked the request) — re-read both lists so the screen shows what's true.
      reload('background');
    } finally {
      setAcceptingId(null);
    }
  }

  function handleMarkerPress(taskId: string) {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index === -1) return;
    setHighlightedTaskId(taskId);
    // Expand the sheet so the highlighted card is actually visible, then scroll to it.
    sheetHeight.value = withSpring(defaultHeight, { damping: 22, stiffness: 220 });
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
  }

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
  // Floats just above the sheet's top edge, so it tracks the sheet as it's dragged open/closed.
  const routeCtaStyle = useAnimatedStyle(() => ({ bottom: sheetHeight.value + Spacing.sm }));

  return (
    <GestureHandlerRootView style={styles.screen}>
      <ThemedView type="canvasNavy" style={styles.screen}>
        <StatusBar style="light" />

        {/*
          A native WebView composites as its own always-on-top surface on iOS/Android
          and ignores normal sibling paint order (even zIndex/elevation), so this bar
          can't float translucently over the map the way it can over a plain image —
          it's docked above the map instead, in normal flex flow, so the two never
          overlap in the native view hierarchy.
        */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.topBarContent}>
            <View style={styles.topBarRow}>
              <Pressable
                onPress={requestPermission}
                disabled={!locationOff}
                style={styles.locationBadge}
              >
                <SymbolView
                  name={
                    locationOff
                      ? { ios: 'location.slash', android: 'location_off', web: 'location_off' }
                      : { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }
                  }
                  tintColor={theme.primaryText}
                  size={11}
                />
                <ThemedText
                  style={styles.locationBadgeLabel}
                  themeColor="primaryText"
                  numberOfLines={1}
                >
                  {locationLabel}
                </ThemedText>
              </Pressable>
              <TeamFilter value={team} onChange={setTeam} />
            </View>

            <View style={styles.filterRow}>
              {RADIUS_OPTIONS.map((option) => {
                const selected = option.km === radiusKm;
                return (
                  <Pressable
                    key={option.label}
                    onPress={() => setRadiusKm(option.km)}
                    style={[
                      styles.chip,
                      Elevation.level1,
                      {
                        backgroundColor: selected ? theme.primary : 'rgba(20,26,67,0.75)',
                        borderColor: selected ? theme.primary : 'rgba(255,255,255,0.25)',
                      },
                    ]}
                  >
                    <ThemedText
                      style={[styles.chipLabel, { opacity: selected ? 1 : 0.85 }]}
                      themeColor="primaryText"
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
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
          <InteractiveMap
            markers={mapMarkers}
            userLocation={coords}
            style={styles.mapImage}
            onMarkerPress={handleMarkerPress}
          />

          <Animated.View style={[styles.sheet, Elevation.level2, animatedSheetStyle]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.sheetHandleArea}>
                <View style={styles.sheetHandle} />
              </View>
            </GestureDetector>
            <FlatList
              ref={listRef}
              style={styles.list}
              alwaysBounceHorizontal={false}
              directionalLockEnabled
              data={tasks}
              keyExtractor={(task) => task.id}
              renderItem={({ item }) => (
                <TaskCard
                  task={item}
                  accepted={isAccepted(item.id)}
                  acceptBlockedReason={
                    acceptingId === item.id
                      ? 'Accepting…'
                      : canAcceptMore
                        ? undefined
                        : `Trip full · ${MAX_RUNS_PER_TRIP} runs max`
                  }
                  onAccept={() => handleAccept(item)}
                  highlighted={item.id === highlightedTaskId}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  listRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 100);
              }}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={reload}
              // A failed refresh keeps the last list; say so above it.
              ListHeaderComponent={
                error && allTasks.length > 0 ? (
                  <ThemedText style={styles.errorBanner} themeColor="primary">
                    {error}
                  </ThemedText>
                ) : null
              }
              ListEmptyComponent={
                loading ? (
                  <ActivityIndicator style={styles.loading} color={theme.primary} />
                ) : (
                  <ThemedText style={styles.emptyState} themeColor="mute">
                    {error ??
                      (allTasks.length === 0
                        ? 'No runs available right now. Pull down to refresh.'
                        : team === null
                          ? 'No runs within this radius — try widening your search.'
                          : 'No runs for this team within this radius — try another team or a wider radius.')}
                  </ThemedText>
                )
              }
            />
          </Animated.View>

          {acceptedCount > 0 && (
            <Animated.View style={[styles.routeCta, Elevation.level2, routeCtaStyle]}>
              <ThemedText style={styles.routeCtaLabel} themeColor="primaryText">
                {acceptedCount} stop{acceptedCount === 1 ? '' : 's'} · ready to plan
              </ThemedText>
              <Pressable
                onPress={() => router.push('/my-route')}
                style={[styles.routeCtaButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.routeCtaButtonLabel} themeColor="primaryText">
                  Plan route →
                </ThemedText>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  topBar: {
    alignItems: 'center',
  },
  topBarContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: Spacing.half,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.half + 1,
  },
  locationBadgeLabel: {
    ...Typography.caption,
    opacity: 0.9,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  chipLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
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
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: BottomTabInset + Spacing.md,
  },
  separator: {
    height: Spacing.sm,
  },
  loading: {
    paddingTop: Spacing.xxxl,
  },
  errorBanner: {
    ...Typography.caption,
    textAlign: 'center',
    paddingBottom: Spacing.sm,
  },
  emptyState: {
    ...Typography.bodyMd,
    textAlign: 'center',
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  routeCta: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.navy,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  routeCtaLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  routeCtaButton: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  routeCtaButtonLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
});
