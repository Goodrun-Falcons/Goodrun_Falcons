import { StyleSheet, View , Image ,TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';

const URL = 'xxx'

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleLogin() {
        if(email == '' || password == ''){
            return;
        }

        const loginData = {
            email: email.trim(),
            password: password,
        };

        const loginRequest = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        }

        const response = await fetch(URL, loginRequest);
        const data = await response.json();

        if (response.ok) {
            router.replace('/home');
            return;
        }

        if (response.status === 403) {
            return;
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
                        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                        onPress={handleLogin}
                    >
                        <ThemedText
                            type= 'smallBold'
                            themeColor="secondaryText"
                        >
                            Log in
                        </ThemedText>
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
});