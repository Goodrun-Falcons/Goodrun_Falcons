import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BrandColors, Radius, Spacing } from '@/constants/theme';
import { AuthButton, AuthError, AuthField, AuthScreen, authStyles } from '@/components/auth-form';

const URL = 'https://goodrun-backend.onrender.com/volunteers/register';

export default function RegisterScreen() {
  const PACKAGE_SIZE = [
    'small — takes one seat',
    'medium — takes the whole back seat',
    'large — requires a truck',
  ] as const;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [size, setSize] = useState('');
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedPhone = phone.replace(/[\s()-]/g, '');
  const australianMobilePattern = /^(?:\+61|0)?4\d{8}$/;

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    if (isLoading) return;
    if (
      name.trim() === '' ||
      email.trim() === '' ||
      phone.trim() === '' ||
      size.trim() === '' ||
      password.trim() === '' ||
      confirmPassword === ''
    ) {
      setErrorMessage('Please complete all fields.');
      return;
    }

    if (!emailPattern.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!australianMobilePattern.test(normalizedPhone)) {
      setErrorMessage('Please enter a valid Australian mobile number.');
      return;
    }

    if (password.length <= 7) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    } else if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const registerData = {
      email: email.trim(),
      full_name: name,
      phone: phone,
      password: password,
      preferred_package_size: size.trim().split(/\s+/)[0],
    };

    const registerRequest = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    };

    try {
      const response = await fetch(URL, registerRequest);
      const data = await response.json();

      if (response.ok) {
        router.replace('/register-success');
        return;
      } else {
        setErrorMessage(
          data.message || data.error || 'Unable to register. Please try again later.'
        );
        return;
      }
    } catch {
      setErrorMessage('Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Join GoodRun and help essential supplies reach those who need them."
      onBack={() => router.replace('/login')}
      backDisabled={isLoading}
    >
      <View style={authStyles.section}>
        <Text accessibilityRole="header" style={authStyles.sectionTitle}>
          Your details
        </Text>
        <AuthField
          label="Full name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          editable={!isLoading}
        />
        <AuthField
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!isLoading}
        />
        <AuthField
          label="Phone number"
          placeholder="04xx xxx xxx"
          hint="Use an Australian mobile number."
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          editable={!isLoading}
        />
        <View style={authStyles.field}>
          <Text style={authStyles.label}>Preferred package size</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Preferred package size: ${size || 'not selected'}`}
            accessibilityState={{ expanded: isSizeDropdownOpen, disabled: isLoading }}
            disabled={isLoading}
            onPress={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
            style={({ pressed }) => [
              authStyles.input,
              styles.dropdown,
              isSizeDropdownOpen && authStyles.focused,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[authStyles.body, styles.optionText, !size && styles.placeholder]}>
              {size || 'Select package size'}
            </Text>
            <MaterialIcons
              name={isSizeDropdownOpen ? 'expand-less' : 'expand-more'}
              size={24}
              color={BrandColors.navy}
            />
          </Pressable>
          {isSizeDropdownOpen && (
            <View style={styles.dropdownList}>
              {PACKAGE_SIZE.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: size === option, disabled: isLoading }}
                  disabled={isLoading}
                  onPress={() => {
                    setSize(option);
                    setIsSizeDropdownOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.dropdownOption,
                    size === option && styles.selectedOption,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[authStyles.body, styles.optionText]}>{option}</Text>
                  {size === option && (
                    <MaterialIcons name="check" size={20} color={BrandColors.navy} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
      <View style={authStyles.divider} />
      <View style={authStyles.section}>
        <Text accessibilityRole="header" style={authStyles.sectionTitle}>
          Secure your account
        </Text>
        <AuthField
          label="Password"
          placeholder="Create a password"
          hint="Use at least 8 characters."
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          editable={!isLoading}
        />
        <AuthField
          label="Confirm password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          editable={!isLoading}
          onSubmitEditing={handleRegister}
          returnKeyType="go"
        />
      </View>
      <AuthError message={errorMessage} />
      <AuthButton
        label={isLoading ? 'Creating account…' : 'Create account'}
        onPress={handleRegister}
        loading={isLoading}
      />
      <Text style={styles.note}>Your account will need admin approval before you can log in.</Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  optionText: { flex: 1, color: BrandColors.navy },
  placeholder: { color: '#727581' },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#D5D7DF',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  selectedOption: { backgroundColor: '#F5F5F7' },
  pressed: { opacity: 0.65 },
  note: { ...authStyles.hint, textAlign: 'center' },
});
