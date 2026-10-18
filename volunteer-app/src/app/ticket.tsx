import { useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { AuthButton, AuthError, AuthField, authStyles } from '@/components/auth-form';
import { BrandColors, Radius, Spacing, Typography } from '@/constants/theme';

const TICKET_URL = 'https://goodrun-backend.onrender.com/volunteers/create-ticket';

export default function TicketScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const requestInProgress = useRef(false);

  function goBack() {
    if (requestInProgress.current) return;
    Keyboard.dismiss();
    router.replace('/home');
  }

  async function submitTicket() {
    if (requestInProgress.current || isSubmitted) return;
    if (!subject.trim() || !message.trim()) {
      setError('Please enter a subject and describe the help you need.');
      return;
    }
    requestInProgress.current = true;
    setIsSubmitting(true);
    setError('');
    Keyboard.dismiss();
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      const response = await fetch(TICKET_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          typeof data?.message === 'string' && data.message.trim()
            ? data.message
            : typeof data?.error === 'string' && data.error.trim()
              ? data.error
              : 'Unable to submit your request. Please try again.'
        );
        return;
      }
      setIsSubmitted(true);
      setSubject('');
      setMessage('');
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      requestInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button" accessibilityLabel="Go back"
                accessibilityState={{ disabled: isSubmitting }} disabled={isSubmitting}
                onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <MaterialIcons name="arrow-back" size={24} color={BrandColors.navy} />
              </Pressable>
              <Text style={styles.headerTitle}>Support</Text>
            </View>
            {isSubmitted ? (
              <View style={styles.success} accessibilityLiveRegion="polite">
                <View style={styles.successIcon}>
                  <MaterialIcons name="check" size={38} color={BrandColors.white} />
                </View>
                <Text accessibilityRole="header" style={styles.successTitle}>Request submitted</Text>
                <Text style={styles.successMessage}>Your request has been sent to the admin team for review.</Text>
                <View style={styles.fullWidth}>
                  <AuthButton label="Back to home" onPress={() => router.replace('/home')} />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.heading}>
                  <Text accessibilityRole="header" style={authStyles.title}>How can we help?</Text>
                  <Text style={authStyles.body}>Send a request to the admin team when you need help or manual intervention.</Text>
                </View>
                <View style={styles.infoCard}>
                  <MaterialIcons name="support-agent" size={26} color={BrandColors.navy} />
                  <View style={styles.flex}>
                    <Text style={authStyles.label}>Tell us what happened</Text>
                    <Text style={styles.hint}>Include relevant delivery details and explain what you need the admin team to do.</Text>
                  </View>
                </View>
                <AuthField
                  label="Subject" placeholder="A short summary of your request"
                  value={subject} onChangeText={setSubject} editable={!isSubmitting}
                  autoCapitalize="sentences" returnKeyType="next"
                />
                <AuthField
                  label="Message" placeholder="Describe the issue and the help you need…"
                  hint="Please do not include passwords or security question answers."
                  value={message} onChangeText={setMessage} editable={!isSubmitting}
                  multiline textAlignVertical="top" autoCapitalize="sentences" style={styles.messageInput}
                />
                <AuthError message={error} />
                <AuthButton
                  label="View past tickets"
                  onPress={() => router.push('/past-tickets')}
                  disabled={isSubmitting}
                  secondary
                />
                <AuthButton label={isSubmitting ? 'Submitting request…' : 'Submit request'} onPress={submitTicket} loading={isSubmitting} />
                <Text style={styles.note}>Your request will be reviewed by the admin team.</Text>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.white },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { ...Typography.displaySm, color: BrandColors.navy },
  backButton: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  logo: { width: '100%', maxWidth: 230, height: 48, resizeMode: 'contain', alignSelf: 'center', marginVertical: Spacing.sm },
  heading: { gap: Spacing.xs },
  infoCard: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: '#F5F5F7', alignItems: 'flex-start' },
  flex: { flex: 1 },
  hint: { ...Typography.bodySm, color: '#60646C', marginTop: Spacing.xxs },
  messageInput: { minHeight: 180 },
  note: { ...Typography.bodySm, color: '#60646C', textAlign: 'center', paddingBottom: Spacing.md },
  success: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.xl },
  successIcon: { width: 88, height: 88, borderRadius: Radius.full, backgroundColor: BrandColors.red, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...Typography.displayLg, color: BrandColors.navy, textAlign: 'center' },
  successMessage: { ...Typography.bodyMd, color: '#4A4A4A', textAlign: 'center' },
  fullWidth: { width: '100%', marginTop: Spacing.md },
});
