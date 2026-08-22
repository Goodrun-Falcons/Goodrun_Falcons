import { FlatList, StyleSheet, View } from 'react-native';
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const urgentCount = mockTasks.filter((task) => task.urgency === 'urgent').length;

  return (
    <ThemedView type="canvas" style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          style={styles.list}
          alwaysBounceHorizontal={false}
          directionalLockEnabled
          data={mockTasks}
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
                    {mockTasks.length}
                  </ThemedText>
                  <ThemedText style={styles.statLabel} themeColor="mute">
                    Tasks this week
                  </ThemedText>
                </ThemedView>
                <ThemedView type="primary" style={styles.statCard}>
                  <ThemedText style={styles.statNumber} themeColor="primaryText">
                    {urgentCount}
                  </ThemedText>
                  <ThemedText style={styles.statLabel} themeColor="primaryText">
                    Urgent
                  </ThemedText>
                </ThemedView>
              </View>

              <ThemedText style={styles.sectionHeading} themeColor="ink">
                This week&apos;s tasks
              </ThemedText>
            </View>
          }
          ListEmptyComponent={
            <ThemedText style={styles.emptyState} themeColor="mute">
              No tasks near you right now — check back soon.
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
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    paddingTop: Spacing.three,
  },
  greeting: {
    ...Typography.displayXl,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.four - Spacing.one,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
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
    marginTop: Spacing.four + Spacing.half,
    marginBottom: Spacing.sm,
  },
  separator: {
    height: Spacing.three,
  },
  emptyState: {
    ...Typography.bodyMd,
    textAlign: 'center',
    paddingTop: Spacing.six,
  },
});
