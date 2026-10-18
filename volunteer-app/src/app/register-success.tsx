import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthButton } from '@/components/auth-form';
import { BrandColors, Radius, Spacing, Typography } from '@/constants/theme';

export default function RegisterSuccessScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <Image
            source={require('../assets/medical-pantry-logo-white.png')}
            style={styles.logo}
            accessibilityLabel="Medical Pantry"
          />
          <View style={styles.hero}>
            <View style={styles.iconRing}>
              <View style={styles.successIcon}>
                <MaterialIcons name="check" size={38} color={BrandColors.white} />
              </View>
            </View>
            <Text style={styles.eyebrow}>THANK YOU FOR JOINING GOODRUN</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Application submitted
            </Text>
            <Text style={styles.message}>
              Your volunteer details have been submitted successfully. We’re glad you’re here.
            </Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardHeading}>
              <MaterialIcons name="schedule" size={22} color={BrandColors.navy} />
              <Text style={styles.cardTitle}>What happens next?</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.number}><Text style={styles.numberText}>1</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Admin review</Text>
                <Text style={styles.detail}>Our team will review your volunteer application.</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.step}>
              <View style={styles.number}><Text style={styles.numberText}>2</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Start your GoodRun journey</Text>
                <Text style={styles.detail}>
                  Once your account is approved, you can log in and explore available deliveries.
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.actions}>
            <AuthButton label="Back to log in" onPress={() => router.replace('/login')} />
            <Text style={styles.note}>You’ll need admin approval before you can log in.</Text>
          </View>
          <Text style={styles.footer}>Project GoodRun · Team Falcons</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.white },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: Spacing.xl },
  logo: { width: '100%', maxWidth: 260, height: 54, resizeMode: 'contain', alignSelf: 'center' },
  hero: { alignItems: 'center', gap: Spacing.md },
  iconRing: {
    width: 112, height: 112, borderRadius: Radius.full,
    backgroundColor: '#FCEEEF', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: Radius.full,
    backgroundColor: BrandColors.red, alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { ...Typography.caption, color: BrandColors.navy, textAlign: 'center', letterSpacing: 1 },
  title: { ...Typography.displayLg, color: BrandColors.navy, textAlign: 'center' },
  message: { ...Typography.bodyMd, color: '#4A4A4A', textAlign: 'center' },
  card: { padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: '#F5F5F7', gap: Spacing.md },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardTitle: { ...Typography.bodyMdStrong, color: BrandColors.navy, flexShrink: 1 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  number: {
    width: 28, height: 28, borderRadius: Radius.full, backgroundColor: '#E6E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  numberText: { ...Typography.bodySm, color: BrandColors.navy, fontWeight: '600' },
  stepContent: { flex: 1, gap: Spacing.xxs },
  stepTitle: { ...Typography.bodyMdStrong, color: BrandColors.navy },
  detail: { ...Typography.bodySm, color: '#60646C' },
  divider: { height: 1, backgroundColor: '#E0E1E7' },
  actions: { gap: Spacing.sm },
  note: { ...Typography.bodySm, color: '#60646C', textAlign: 'center' },
  footer: { ...Typography.caption, color: '#60646C', textAlign: 'center' },
});
