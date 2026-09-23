import { StyleSheet, View , Image ,TextInput, Pressable, ActivityIndicator, } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const URL = 'https://goodrun-backend.onrender.com/volunteers/login'

export default function LoginScreen() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleLogin() {
        if(email.trim() === '' || password === ''){
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
            body: JSON.stringify(loginData)
        }

        try {
            const response = await fetch(URL, loginRequest);
            const data = await response.json();

            if (response.ok) {
                router.replace('/home');
                return;
            }

            if (response.status === 403) {
                if (data.error === 'AWAITING_VETTING') {
                    setErrorMessage(
                    'Your account is still awaiting approval.'
                    );
                    return;
                }

                if (data.error === 'INACTIVE') {
                    setErrorMessage(
                    'Your account has been rejected or deactivated.'
                    );
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
            
        } catch (error) {
            setErrorMessage('Unable to connect to the server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return(
        <View style = {styles.container}>

            <Image
                source = {require('../assets/medical-pantry-logo-navy-small.png')}
                style = {styles.logo}
            />

            <View style={styles.form}>

                <View style={styles.loginForm}>
                    <ThemedText
                        type= 'smallBold'
                        themeColor="secondaryText"
                    >
                        Email Address
                    </ThemedText>

                    <TextInput 
                        autoCapitalize="none"
                        autoCorrect={false}
                        value = {email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        style={styles.input}
                    />
                </View>
                
                <View style={styles.loginForm}>
                    <ThemedText
                        type= 'smallBold'
                        themeColor="secondaryText"
                    >
                        Password
                    </ThemedText>

                    <TextInput 
                        value = {password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={styles.input}
                    />
                </View>

                {errorMessage !== '' && (
                    <View style={styles.errorBox}>
                        <MaterialIcons
                        name="error-outline"
                        size={14}
                        color={BrandColors.red}
                        />

                        <ThemedText style={styles.errorText}>
                        {errorMessage}
                        </ThemedText>
                    </View>
                )}

                <View style={styles.buttonRow}>
                    <Pressable 
                        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                        onPress={() => router.push('/register')}
                    >
                        <ThemedText
                            type= 'smallBold'
                            themeColor="secondaryText"
                        >
                            Sign up
                        </ThemedText>
                    </Pressable>

                    <Pressable 
                        disabled={isLoading}
                        style={({ pressed }) => [styles.button, (pressed || isLoading) && styles.pressed]}
                        onPress={handleLogin}
                    >
                        {isLoading ? (
                            <ActivityIndicator
                                size="small"
                                color={BrandColors.white}
                            />
                        ) : (
                            <ThemedText
                                type="smallBold"
                                themeColor="secondaryText"
                            >
                                Log in
                            </ThemedText>
                        )}
                    </Pressable>
                </View>
            </View>

            

            <View style = {styles.teamInfo}>
                <ThemedText
                    type= 'smallBold'
                    themeColor="secondaryText"
                >
                    Project GoodRun
                </ThemedText>
                <ThemedText
                    type= 'small'
                    themeColor="secondaryText"
                >
                    by Team Falcons
                </ThemedText>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    logo: {
        marginTop: '30%',
        width: 700,
        height: 120,
        resizeMode: 'contain',
    },

    container: {
        flex: 1,
        backgroundColor : BrandColors.navy,
        alignItems: 'center',
    },

    teamInfo: {
        marginTop: 'auto',
        alignSelf: 'flex-end',
        marginRight: Spacing.sm,
        marginBottom: Spacing.xxl,
    },

    input: {
        backgroundColor: BrandColors.white,
        borderRadius: Radius.xl,
        minHeight: 44,
        paddingHorizontal: Spacing.md,
    },

    form: {
        marginTop: Spacing.xs,
        width: '82%',
        justifyContent: 'center',
    },

    loginForm: {
        marginTop: Spacing.lg,
    },

    buttonRow: {
        flexDirection: 'row',
        gap: Spacing.xxl,
        marginTop: Spacing.sm,
    },

    button: {
        marginTop: Spacing.xl,
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },

    pressed: {
        opacity: 0.7,
    },

    errorBox: {
        minHeight: 26,
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.sm,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,

        borderWidth: 1,
        borderColor: BrandColors.red,
        borderRadius: 4,
        backgroundColor: 'rgba(220, 40, 45, 0.1)',
    },

    errorText: {
        color: BrandColors.red,
        fontSize: 11,
    },
});