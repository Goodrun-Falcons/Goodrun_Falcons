import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskCard } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { mockTasks } from '@/data/mock-tasks';
import { useTheme } from '@/hooks/use-theme';
import { daysUntil } from '@/lib/date';

const THIS_WEEK_DAYS = 6;

const RADIUS_OPTIONS: { label: string; km: number | null }[] = [
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: '20 km', km: 20 },
  { label: 'All', km: null },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const theme = useTheme();
  const [radiusKm, setRadiusKm] = useState<number | null>(RADIUS_OPTIONS[0].km);

  const urgentThisWeekCount = mockTasks.filter(
    (task) => daysUntil(task.dueBy) <= THIS_WEEK_DAYS && task.urgency === 'urgent'
  ).length;
  const thisWeekCount = mockTasks.filter((task) => daysUntil(task.dueBy) <= THIS_WEEK_DAYS).length;

  const tasks = mockTasks
    .filter((task) => radiusKm === null || task.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <ThemedView type="canvas" style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          style={styles.list}
          alwaysBounceHorizontal={false}
          directionalLockEnabled
          data={tasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => <TaskCard task={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText style={styles.greeting} themeColor="ink">
                {getGreeting()}
              </ThemedText>

              <View style={styles.statRow}>
                <ThemedView type="canvasSoft" style={styles.statCard}>
                  <ThemedText style={styles.statNumber} themeColor="ink">
                    {thisWeekCount}
                  </ThemedText>
                  <ThemedText style={styles.statLabel} themeColor="mute">
                    Tasks this week
                  </ThemedText>
                </ThemedView>
                <ThemedView type="primary" style={styles.statCard}>
                  <ThemedText style={styles.statNumber} themeColor="primaryText">
                    {urgentThisWeekCount}
                  </ThemedText>
                  <ThemedText style={styles.statLabel} themeColor="primaryText">
                    Urgent
                  </ThemedText>
                </ThemedView>
              </View>

              <ThemedText style={styles.sectionHeading} themeColor="ink">
                Tasks
              </ThemedText>

              <View style={styles.filterRow}>
                {RADIUS_OPTIONS.map((option) => {
                  const selected = option.km === radiusKm;
                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => setRadiusKm(option.km)}
                      style={[
                        styles.chip,
                        { backgroundColor: selected ? theme.secondary : theme.canvasSoft },
                      ]}>
                      <ThemedText
                        style={styles.chipLabel}
                        themeColor={selected ? 'secondaryText' : 'ink'}>
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            <ThemedText style={styles.emptyState} themeColor="mute">
              No tasks within this radius — try widening your search.
            </ThemedText>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  list: {
    width: '100%',
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    paddingBottom: BottomTabInset + Spacing.md,
  },
  header: {
    paddingTop: Spacing.md,
  },
  greeting: {
    ...Typography.displayXl,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg - Spacing.xxs,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.half,
  },
  statNumber: {
    ...Typography.displayMd,
  },
  statLabel: {
    ...Typography.bodySm,
  },
  sectionHeading: {
    ...Typography.displaySm,
    marginTop: Spacing.lg + Spacing.half,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  chipLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  separator: {
    height: Spacing.md,
  },
  emptyState: {
    ...Typography.bodyMd,
    textAlign: 'center',
    paddingTop: Spacing.xxxl,
  },
});
