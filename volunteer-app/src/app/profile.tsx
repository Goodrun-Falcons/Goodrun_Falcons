import { useState } from 'react';
import { Keyboard , Modal , Pressable , ScrollView , StyleSheet , TextInput , View, } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BrandColors, FontFamily, Radius, Spacing, } from '@/constants/theme';

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  serviceArea: string;
  vehicleType: string;
};


const initialProfile: Profile = {
  fullName: 'abcd efgh',
  email: 'abcde@abcde.com',
  phone: '+64 123456789',
  serviceArea: 'Carlton',
  vehicleType: 'SUV',
};

const fields: { key: keyof Profile; label: string }[] = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'serviceArea', label: 'Service Area' },
  { key: 'vehicleType', label: 'Vehicle Type' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const [profile] = useState<Profile>(initialProfile);
  const [draft, setDraft] = useState<Profile>(initialProfile);
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showLogout, setShowLogout] = useState(false);

  const hasPendingRequest = pendingProfile !== null;
  const values = isEditing ? draft : profile;

  //extract capitalized first letters of surname and given name
  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function goBack() {
    Keyboard.dismiss();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  function startEditing() {
    if (hasPendingRequest) return;

    setDraft({ ...profile });
    setError('');
    setNotice('');
    setShowLogout(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft({ ...profile });
    setError('');
    setNotice('');
    setIsEditing(false);
    Keyboard.dismiss();
  }

  function submitProfileRequest() {
    if (hasPendingRequest) return;

    const requestedProfile: Profile = {
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      serviceArea: draft.serviceArea.trim(),
      vehicleType: draft.vehicleType.trim(),
    };

    if (
      Object.values(requestedProfile).some((value) => !value)
    ) {
      setError('Please complete all fields.');
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedProfile.email)
    ) {
      setError('Please enter a valid email address.');
      return;
    }

    const hasChanges = fields.some(
      ({ key }) => requestedProfile[key] !== profile[key]
    );

    if (!hasChanges) {
      setError('Please make a change before submitting.');
      return;
    }

    setPendingProfile({ ...requestedProfile });
    setDraft({ ...profile });
    setIsEditing(false);
    setError('');
    setNotice('');
    Keyboard.dismiss();
  }

  function openLogoutConfirmation() {
    Keyboard.dismiss();
    setNotice('');
    setShowLogout(true);
  }

  function logout() {
    setShowLogout(false);
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + Spacing.lg,
              paddingLeft: Math.max(insets.left, Spacing.lg),
              paddingRight: Math.max(insets.right, Spacing.lg),
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={goBack}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.backArrow} />
            </Pressable>
          </View>

          <View style={styles.identity}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <ThemedText style={styles.initials}>
                  {initials}
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                onPress={() =>
                  setNotice(
                    'Profile photo upload is not available yet.'
                  )
                }
                style={({ pressed }) => [
                  styles.cameraButton,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cameraBody}>
                  <View style={styles.cameraTop} />
                  <View style={styles.cameraLens} />
                </View>
              </Pressable>
            </View>

            <ThemedText type="heading" style={styles.name}>
              {profile.fullName}
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Active Medical Volunteer
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.form,
            {
              paddingBottom: insets.bottom + Spacing.xxxl,
              paddingLeft: Math.max(insets.left, Spacing.lg),
              paddingRight: Math.max(insets.right, Spacing.lg),
            },
          ]}
        >
          <View style={styles.informationCard}>
            <ThemedText type="smallBold" style={styles.label}>
              {isEditing
                ? 'Request Profile Change'
                : 'Approved Profile'}
            </ThemedText>

            <ThemedText style={styles.informationText}>
              {isEditing
                ? 'Enter your proposed changes below. Your current details will remain active until an admin approves your request.'
                : 'These are your currently approved details. Changes require admin approval.'}
            </ThemedText>

            <ThemedText style={styles.previewText}>
              Preview only: requests are not sent to an admin
              and will be lost when this page is reloaded.
            </ThemedText>
          </View>

          {fields.map(({ key, label }) => (
            <View key={key} style={styles.field}>
              <ThemedText
                type="smallBold"
                style={styles.label}
              >
                {label}
              </ThemedText>

              <TextInput
                accessibilityLabel={label}
                value={values[key]}
                editable={isEditing && !hasPendingRequest}
                onChangeText={(value) => {
                  setDraft((previous) => ({
                    ...previous,
                    [key]: value,
                  }));
                  setError('');
                }}
                keyboardType={
                  key === 'email'
                    ? 'email-address'
                    : key === 'phone'
                      ? 'phone-pad'
                      : 'default'
                }
                autoCapitalize={
                  key === 'email' ? 'none' : 'words'
                }
                autoCorrect={
                  key !== 'email' && key !== 'phone'
                }
                selectionColor={BrandColors.navy}
                underlineColorAndroid="transparent"
                style={[
                  styles.input,
                  isEditing && styles.editableInput,
                ]}
              />
            </View>
          ))}

          {pendingProfile && (
            <View style={styles.reviewCard}>
              <ThemedText
                type="smallBold"
                style={styles.label}
                accessibilityLiveRegion="polite"
              >
                Pending Review — Preview
              </ThemedText>

              <ThemedText style={styles.informationText}>
                Your approved profile above is unchanged.
                The following changes are awaiting review
                in this preview.
              </ThemedText>

              {fields
                .filter(
                  ({ key }) =>
                    pendingProfile[key] !== profile[key]
                )
                .map(({ key, label }) => (
                  <View
                    key={key}
                    style={styles.requestedField}
                  >
                    <ThemedText
                      type="smallBold"
                      style={styles.label}
                    >
                      {label}
                    </ThemedText>

                    <ThemedText style={styles.requestedText}>
                      Current: {profile[key]}
                    </ThemedText>

                    <ThemedText style={styles.requestedText}>
                      Requested: {pendingProfile[key]}
                    </ThemedText>
                  </View>
                ))}
            </View>
          )}

          {!!error && (
            <ThemedText
              accessibilityRole="alert"
              style={styles.error}
            >
              {error}
            </ThemedText>
          )}

          {!!notice && (
            <ThemedText
              accessibilityLiveRegion="polite"
              style={styles.notice}
            >
              {notice}
            </ThemedText>
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: hasPendingRequest,
              }}
              disabled={hasPendingRequest}
              onPress={
                isEditing
                  ? submitProfileRequest
                  : startEditing
              }
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                hasPendingRequest && styles.disabledButton,
                pressed &&
                  !hasPendingRequest &&
                  styles.pressed,
              ]}
            >
              <ThemedText
                type="smallBold"
                style={styles.whiteText}
              >
                {hasPendingRequest
                  ? 'Pending Review'
                  : isEditing
                    ? 'Submit for Review'
                    : 'Request Profile Change'}
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={
                isEditing
                  ? cancelEditing
                  : openLogoutConfirmation
              }
              style={({ pressed }) => [
                styles.button,
                styles.outlineButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                type="smallBold"
                style={styles.redText}
              >
                {isEditing ? 'Cancel' : 'Log Out'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogout(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalCard}
            accessibilityViewIsModal
          >
            <ThemedText
              type="smallBold"
              style={styles.label}
            >
              Log Out
            </ThemedText>

            <ThemedText style={styles.modalMessage}>
              Are you sure you want to log out?
            </ThemedText>

            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowLogout(false)}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={styles.label}
                >
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={logout}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={styles.redText}
                >
                  Log Out
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.navy,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: BrandColors.white,
  },

  header: {
    backgroundColor: BrandColors.navy,
    paddingBottom: Spacing.xl,
  },

  headerRow: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: BrandColors.white,
    transform: [{ rotate: '45deg' }],
  },

  identity: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },

  avatarContainer: {
    width: 104,
    height: 104,
    marginBottom: Spacing.md,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    borderWidth: 3,
    borderColor: BrandColors.white,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  initials: {
    fontFamily: FontFamily.bold,
    fontSize: 30,
    lineHeight: 42,
    color: BrandColors.navy,
  },

  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: BrandColors.white,
    borderWidth: 3,
    borderColor: BrandColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraBody: {
    width: 19,
    height: 14,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraTop: {
    position: 'absolute',
    top: -5,
    width: 9,
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: BrandColors.navy,
  },

  cameraLens: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
  },

  name: {
    color: BrandColors.white,
    textAlign: 'center',
  },

  subtitle: {
    color: BrandColors.white,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },

  form: {
    width: '100%',
    maxWidth: 568,
    alignSelf: 'center',
    paddingTop: Spacing.lg,
  },

  informationCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BrandColors.navy,
    borderRadius: Radius.lg,
    backgroundColor: BrandColors.white,
  },

  informationText: {
    color: BrandColors.navy,
    marginTop: Spacing.xs,
  },

  previewText: {
    color: BrandColors.navy,
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },

  field: {
    marginBottom: Spacing.md,
  },

  label: {
    color: BrandColors.navy,
  },

  input: {
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xxs,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.navy,
    backgroundColor: BrandColors.white,
  },

  editableInput: {
    borderColor: BrandColors.red,
  },

  reviewCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BrandColors.navy,
    borderRadius: Radius.lg,
    backgroundColor: BrandColors.white,
  },

  requestedField: {
    marginTop: Spacing.md,
  },

  requestedText: {
    color: BrandColors.navy,
    marginTop: Spacing.xxs,
  },

  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },

  button: {
    minHeight: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },

  primaryButton: {
    backgroundColor: BrandColors.red,
  },

  outlineButton: {
    borderWidth: 1.5,
    borderColor: BrandColors.red,
  },

  whiteText: {
    color: BrandColors.white,
  },

  redText: {
    color: BrandColors.red,
  },

  disabledButton: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  error: {
    color: BrandColors.red,
    marginBottom: Spacing.xs,
  },

  notice: {
    color: BrandColors.navy,
    marginBottom: Spacing.xs,
  },

  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },

  confirmButton: {
    minHeight: 44,
    padding: Spacing.sm,
    justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.white,
  },

  modalMessage: {
    color: BrandColors.navy,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
});