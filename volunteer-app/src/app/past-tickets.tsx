import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { AuthButton, AuthError } from '@/components/auth-form';
import { BrandColors, Radius, Spacing, Typography } from '@/constants/theme';

type Ticket = { key: string; subject: string; message: string; status: string };
const TICKETS_URL = 'https://goodrun-backend.onrender.com/volunteers/view-ticket';

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function parseTickets(data: unknown): Ticket[] {
  const body = asObject(data);
  const rows = Array.isArray(data) ? data : Array.isArray(body.tickets) ? body.tickets : body.data;
  if (!Array.isArray(rows)) throw new Error('Unexpected ticket list format. Please contact the admin team.');
  return rows.map((row: unknown, index: number) => {
    const ticket = asObject(row);
    if (typeof ticket.subject !== 'string' || typeof ticket.message !== 'string' || typeof ticket.status !== 'string') {
      throw new Error('The server returned incomplete ticket details. Please try again later.');
    }
    return { key: String(index), subject: ticket.subject, message: ticket.message, status: ticket.status };
  });
}

export default function PastTicketsScreen() {
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const statuses = [...new Set(tickets.map((ticket) => ticket.status))];
  const visibleTickets = tickets.filter((ticket) => filter === null || ticket.status === filter);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    async function loadTickets() {
      setIsLoading(true);
      setError('');
      setTickets([]);
      setFilter(null);
      setExpandedId(null);
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (cancelled) return;
        if (!token) { router.replace('/login'); return; }
        const response = await fetch(TICKETS_URL, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          return;
        }
        const data: unknown = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          const body = asObject(data);
          setError(typeof body.message === 'string' ? body.message : typeof body.error === 'string' ? body.error : 'Unable to load your tickets. Please try again.');
          return;
        }
        setTickets(parseTickets(data));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && !(err instanceof TypeError) ? err.message : 'Unable to connect to the server. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadTickets();
    return () => { cancelled = true; };
  // reloadVersion deliberately restarts the focused request when Refresh is pressed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadVersion]));

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/ticket');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <FlatList
        data={visibleTickets}
        keyExtractor={(ticket) => ticket.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.heading}>
            <View style={styles.headerRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <MaterialIcons name="arrow-back" size={24} color={BrandColors.navy} />
              </Pressable>
              <Text accessibilityRole="header" style={styles.title}>Past tickets</Text>
            </View>
            <Text style={styles.body}>View your requests for help from the admin team.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/ticket')} style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}>
              <MaterialIcons name="add" size={20} color={BrandColors.white} />
              <Text style={styles.newButtonText}>New request</Text>
            </Pressable>
            <View style={styles.filters}>
              {[null, ...statuses].map((option) => (
                <Pressable key={option === null ? 'all' : `status:${option}`} accessibilityRole="button" accessibilityState={{ selected: filter === option }} onPress={() => { setFilter(option); setExpandedId(null); }} style={({ pressed }) => [styles.filter, filter === option && styles.activeFilter, pressed && styles.pressed]}>
                  <Text style={[styles.filterText, filter === option && styles.activeFilterText]}>{option ?? 'All'}</Text>
                </Pressable>
              ))}
            </View>
            {!isLoading && !error && <Text accessibilityLiveRegion="polite" style={styles.count}>{visibleTickets.length} {visibleTickets.length === 1 ? 'ticket' : 'tickets'}</Text>}
            <AuthError message={error} />
            <AuthButton label={isLoading ? 'Loading tickets…' : error ? 'Try again' : 'Refresh tickets'} loading={isLoading} secondary onPress={() => setReloadVersion((version) => version + 1)} />
          </View>
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.key;
          return (
            <View style={styles.card}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${item.subject}, ${item.status}, ${expanded ? 'hide' : 'view'} details`} accessibilityState={{ expanded }} onPress={() => setExpandedId(expanded ? null : item.key)} style={({ pressed }) => [styles.cardHeader, pressed && styles.pressed]}>
                <View style={styles.metaRow}>
                  <View style={[styles.badge, item.status === 'Resolved' && styles.resolvedBadge]}>
                    <Text style={[styles.badgeText, item.status === 'Resolved' && styles.resolvedText]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.subject}>{item.subject}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{expanded ? 'Hide details' : 'View details'}</Text>
                  <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={24} color={BrandColors.navy} />
                </View>
              </Pressable>
              {expanded && (
                <View style={styles.details}>
                  <Text style={styles.detailLabel}>Your message</Text>
                  <Text selectable style={styles.body}>{item.message}</Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={isLoading ? <View style={styles.empty}><ActivityIndicator color={BrandColors.navy} /><Text style={styles.body}>Loading your tickets…</Text></View> : error ? null : (
          <View style={styles.empty}>
            <MaterialIcons name="confirmation-number" size={42} color={BrandColors.navy} />
            <Text style={styles.subject}>No tickets to show</Text>
            <Text style={styles.emptyText}>{filter === null ? 'You haven’t submitted any support requests yet.' : `There are no tickets marked ${filter}. Try another filter.`}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.white },
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.md },
  heading: { gap: Spacing.md, marginBottom: Spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.displayLg, color: BrandColors.navy, flexShrink: 1 },
  iconButton: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
  body: { ...Typography.bodyMd, color: '#4A4A4A' },
  newButton: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center', justifyContent: 'center', minHeight: 52, padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: BrandColors.red },
  newButtonText: { ...Typography.buttonMd, color: BrandColors.white },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  filter: { minHeight: 44, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: '#D5D7DF', borderRadius: Radius.full, justifyContent: 'center' },
  activeFilter: { backgroundColor: BrandColors.navy, borderColor: BrandColors.navy },
  filterText: { ...Typography.bodySm, color: BrandColors.navy },
  activeFilterText: { color: BrandColors.white },
  count: { ...Typography.bodySm, color: '#60646C' },
  card: { borderWidth: 1, borderColor: '#E0E1E7', borderRadius: Radius.lg, overflow: 'hidden' },
  cardHeader: { padding: Spacing.md, gap: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, flexWrap: 'wrap' },
  meta: { ...Typography.caption, color: '#60646C' },
  subject: { ...Typography.bodyMdStrong, color: BrandColors.navy },
  badge: { backgroundColor: '#EEEFF5', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs, borderRadius: Radius.full },
  badgeText: { ...Typography.caption, color: BrandColors.navy },
  resolvedBadge: { backgroundColor: '#EAF3ED' },
  resolvedText: { color: '#285C3D' },
  details: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: '#E0E1E7', backgroundColor: '#FAFAFC', gap: Spacing.xs },
  detailLabel: { ...Typography.bodySm, color: '#60646C' },
  pressed: { opacity: 0.65 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { ...Typography.bodySm, color: '#60646C', textAlign: 'center' },
});
