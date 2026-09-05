import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskCard } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  Elevation,
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { mockTasks } from '@/data/mock-tasks';
import { useTheme } from '@/hooks/use-theme';

// Placeholder until Story 1-4 (auth/profile) supplies the real signed-in volunteer.
const VOLUNTEER_NAME = 'Alex Rivera';

const IMPACT_STATS = [
  { label: 'Runs done', value: '18' },
  { label: 'Items moved', value: '132' },
  { label: 'Orgs helped', value: '9' },
];

const RECENT_ACTIVITY = [
  { id: 'act-1', desc: 'Surgical gloves → Riverbank Aged Care', date: 'Yesterday' },
  { id: 'act-2', desc: 'Wound dressing kits → Hope Street Pharmacy', date: 'Mon 24 Aug' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const urgentTasks = mockTasks.filter((task) => task.urgency === 'urgent');
  const nearestDistance = Math.min(...mockTasks.map((task) => task.distanceKm));

  return (
    <ThemedView type="canvasSoft" style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        alwaysBounceHorizontal={false}
        directionalLockEnabled
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + Spacing.md, backgroundColor: theme.secondary },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              {/* Temporary logo — swap for the client's final asset once supplied. */}
              <Image
                source={require('@/assets/images/logo_temp.png')}
                style={styles.brandLogo}
                contentFit="contain"
              />
              <View style={styles.bellButton}>
                <SymbolView
                  name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
                  tintColor={theme.primaryText}
                  size={17}
                />
                <View
                  style={[
                    styles.bellDot,
                    { backgroundColor: theme.primary, borderColor: theme.secondary },
                  ]}
                />
              </View>
            </View>

            <ThemedText style={styles.greetingLabel} themeColor="primaryText">
              {getGreeting()}
            </ThemedText>
            <ThemedText style={styles.greetingName} themeColor="primaryText">
              {VOLUNTEER_NAME}
            </ThemedText>

            <Pressable
              onPress={() => router.push('/nearby')}
              style={[styles.heroCard, { backgroundColor: theme.primary }]}
            >
              <SymbolView
                name={{ ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' }}
                tintColor={theme.primaryText}
                size={64}
                style={styles.heroWatermark}
              />
              <ThemedText style={styles.heroEyebrow} themeColor="primaryText">
                Available this week
              </ThemedText>
              <ThemedText style={styles.heroTitle} themeColor="primaryText">
                {mockTasks.length} runs near you
              </ThemedText>
              <ThemedText style={styles.heroSubtitle} themeColor="primaryText">
                {urgentTasks.length} urgent · from {nearestDistance.toFixed(1)} km away
              </ThemedText>
              <View style={styles.heroPill}>
                <ThemedText style={styles.heroPillLabel} themeColor="primaryText">
                  Browse runs
                </ThemedText>
                <SymbolView
                  name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                  tintColor={theme.primaryText}
                  size={13}
                />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statRow}>
            {IMPACT_STATS.map((stat) => (
              <ThemedView
                key={stat.label}
                type="canvas"
                style={[styles.statCard, Elevation.level1]}
              >
                <ThemedText style={styles.statValue} themeColor="ink">
                  {stat.value}
                </ThemedText>
                <ThemedText style={styles.statLabel} themeColor="mute">
                  {stat.label}
                </ThemedText>
              </ThemedView>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.sectionHeading} themeColor="ink">
                Urgent today
              </ThemedText>
              <Pressable onPress={() => router.push('/nearby')}>
                <ThemedText style={styles.seeAll} themeColor="primary">
                  See all
                </ThemedText>
              </Pressable>
            </View>
            {urgentTasks.length === 0 ? (
              <ThemedText style={styles.emptyState} themeColor="mute">
                Nothing urgent right now.
              </ThemedText>
            ) : (
              <View style={styles.cardGroup}>
                {urgentTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionHeading} themeColor="ink">
              Recent activity
            </ThemedText>
            <ThemedView type="canvas" style={[styles.activityCard, Elevation.level1]}>
              {RECENT_ACTIVITY.map((activity, i) => (
                <View
                  key={activity.id}
                  style={[
                    styles.activityRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: theme.surfacePressed },
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: theme.canvasSoft }]}>
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      tintColor={theme.secondary}
                      size={14}
                    />
                  </View>
                  <View style={styles.activityTextGroup}>
                    <ThemedText style={styles.activityDesc} themeColor="ink" numberOfLines={1}>
                      {activity.desc}
                    </ThemedText>
                    <ThemedText style={styles.activityDate} themeColor="mute">
                      {activity.date}
                    </ThemedText>
                  </View>
                  <View style={[styles.doneBadge, { backgroundColor: theme.canvasSoft }]}>
                    <ThemedText style={styles.doneBadgeLabel} themeColor="secondary">
                      Done
                    </ThemedText>
                  </View>
                </View>
              ))}
            </ThemedView>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.md,
  },
  header: {
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLogo: {
    width: 122,
    height: 28,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  greetingLabel: {
    ...Typography.bodySm,
    opacity: 0.6,
    marginTop: Spacing.lg,
  },
  greetingName: {
    ...Typography.displayMd,
  },
  heroCard: {
    marginTop: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  heroWatermark: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.sm,
    opacity: 0.15,
  },
  heroEyebrow: {
    ...Typography.caption,
    fontFamily: Typography.bodyMdStrong.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.75,
  },
  heroTitle: {
    ...Typography.displaySm,
    marginTop: Spacing.half,
  },
  heroSubtitle: {
    ...Typography.bodySm,
    opacity: 0.75,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  heroPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: Spacing.xxs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  heroPillLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  content: {
    alignItems: 'center',
  },
  statRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.displaySm,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    ...Typography.bodyMdStrong,
    marginBottom: Spacing.sm,
  },
  seeAll: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  cardGroup: {
    gap: Spacing.md,
  },
  emptyState: {
    ...Typography.bodyMd,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  activityCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTextGroup: {
    flex: 1,
  },
  activityDesc: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  activityDate: {
    ...Typography.caption,
    marginTop: 2,
  },
  doneBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  doneBadgeLabel: {
    ...Typography.caption,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
});
