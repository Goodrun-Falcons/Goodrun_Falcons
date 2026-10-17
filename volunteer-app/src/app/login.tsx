import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AuthButton, AuthError, AuthField, AuthScreen, authStyles } from '@/components/auth-form';

const URL = 'https://goodrun-backend.onrender.com/volunteers/login';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (isLoading) return;
    if (email.trim() === '' || password === '') {
      setErrorMessage('Please enter your email address and password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const loginData = {
      email: email.trim(),
      password: password,
    };

    const loginRequest = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    };

    try {
      const response = await fetch(URL, loginRequest);
      const data = await response.json();

      if (response.ok) {
        const accessToken = data.session?.accessToken;
        const refreshToken = data.session?.refreshToken;

        if (!accessToken || !refreshToken) {
          setErrorMessage('Login succeeded, but session data is missing.');
          return;
        }

        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);

        router.replace('/home');
        return;
      }

      if (response.status === 403) {
        if (data.error === 'AWAITING_VETTING') {
          setErrorMessage('Your account is still awaiting approval.');
          return;
        }

        if (data.error === 'INACTIVE') {
          setErrorMessage('Your account has been rejected or deactivated.');
          return;
        }
      }

      if (response.status === 400) {
        setErrorMessage('Invalid email address or password.');
        return;
      }

      if (response.status === 500) {
        setErrorMessage('Unable to log in. Please try again later.');
        return;
      }

      setErrorMessage('Unable to log in. Please try again later.');
    } catch {
      setErrorMessage('Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthScreen title="Welcome back" subtitle="Log in to continue your GoodRun journey.">
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
      <View style={styles.passwordGroup}>
        <AuthField
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          editable={!isLoading}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />
        <Pressable
          accessibilityRole="link"
          disabled={isLoading}
          onPress={() => router.push('/forgot-password')}
          style={({ pressed }) => [authStyles.linkButton, styles.forgot, pressed && styles.pressed]}
        >
          <Text style={authStyles.link}>Forgot password?</Text>
        </Pressable>
      </View>
      <AuthError message={errorMessage} />
      <AuthButton
        label={isLoading ? 'Logging in…' : 'Log in'}
        onPress={handleLogin}
        loading={isLoading}
      />
      <View style={authStyles.divider} />
      <Text style={styles.signupPrompt}>New to GoodRun?</Text>
      <AuthButton
        label="Sign up"
        onPress={() => router.push('/register')}
        disabled={isLoading}
        secondary
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  passwordGroup: { gap: 4 },
  forgot: { alignSelf: 'flex-end' },
  pressed: { opacity: 0.65 },
  signupPrompt: { ...authStyles.body, textAlign: 'center' },
});
