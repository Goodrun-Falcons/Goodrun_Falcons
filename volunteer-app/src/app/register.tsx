import { StyleSheet, View , ScrollView ,TextInput, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useState } from 'react';
import { BrandColors, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';

const URL = 'https://goodrun-backend.onrender.com/volunteers/register'

export default function RegisterScreen() {

    const PACKAGE_SIZE = [
        'small -takes one seat',
        'medium -takes whole backseats',
        'large -need a truck to carry'
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
            if(name.trim() === '' || email.trim() === '' || phone.trim() === '' || size.trim() === '' || password.trim() === '' || confirmPassword === ''){
                setErrorMessage('Please fill in all blanks');
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
                setErrorMessage('Password must be longer than 8 characters.');
                return;
            }else if (password !== confirmPassword) {
                setErrorMessage('Passwords do not match.');
                return;
            }
    
            setErrorMessage('');
            setIsLoading(true);
    
            const registerData = {
                email: email.trim(),
                full_name : name,
                phone : phone,
                password: password,
                preferred_package_size: size.trim().split(/\s+/)[0],
            };
    
            const registerRequest = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            }
    
            try {
                const response = await fetch(URL, registerRequest);
                const data = await response.json();
    
                if (response.ok) {
                    router.replace('/register-success');
                    return;
                }else{
                    setErrorMessage(data.message || data.error ||'Unable to register. Please try again later.');
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
            <View style = {styles.headerview}>
                <ThemedText
                    type= 'subtitle'
                    themeColor="secondaryText"
                >
                    Sign up
                </ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style = {styles.body}>
                    <Pressable 
                        style={({ pressed }) => [styles.button, (pressed || isLoading) && styles.pressed]}
                        onPress={() => router.push('/login')}
                        disabled={isLoading}
                    >
                        <ThemedText
                            type='smallBold'
                            themeColor="secondaryText"
                        >
                            ← Back
                        </ThemedText>
                    </Pressable>

                    <ThemedText
                        type="heading"
                        style={styles.welcomeText}
                    >
                        Welcome!{'\n'}Let's get started!
                    </ThemedText>
                </View>
                
                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Full Name
                    </ThemedText>
                    <TextInput 
                        style = {styles.input}
                        value = {name}
                        onChangeText={setName}
                    />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Email Address
                    </ThemedText>
                    <TextInput 
                        style = {styles.input} 
                        placeholder='xxx@example.com'
                        value = {email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Phone Number
                    </ThemedText>
                    <TextInput 
                        style = {styles.input} 
                        value = {phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholder='Australian mobile number'
                    />
                </View>

                <View style={styles.form}>
                    <ThemedText type="smallBold">
                        Preferred Package Size
                    </ThemedText>

                    <Pressable
                        onPress={() =>setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                        style={({ pressed }) => [styles.input, styles.dropdown, pressed && styles.pressed,]}
                    >
                        <ThemedText style={!size ? styles.placeholderText : undefined}>
                            {size || 'Select package size'}
                        </ThemedText>

                        <ThemedText>
                            {isSizeDropdownOpen ? '▲' : '▼'}
                        </ThemedText>
                    </Pressable>

                    {isSizeDropdownOpen && (
                        <View style={styles.dropdownList}>
                            {PACKAGE_SIZE.map((option) => (
                                <Pressable
                                    key={option}
                                    onPress={() => {setSize(option); setIsSizeDropdownOpen(false);}}
                                    style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed,]}
                                >
                                    <ThemedText>
                                        {option}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Preferred Password
                    </ThemedText>
                    <TextInput 
                        style = {styles.input}
                        value = {password}
                        onChangeText={setPassword}
                        placeholder='minimum 8 letters'
                    />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Confirm Password
                    </ThemedText>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                </View>

                {errorMessage !== '' && (
                    <ThemedText style={styles.errorText}>
                        {errorMessage}
                    </ThemedText>
                )}

                <Pressable 
                    style={({ pressed }) => [styles.submit, (pressed || isLoading) && styles.pressed]}
                    disabled={isLoading}
                    onPress={handleRegister}
                >
                    <ThemedText
                        type='smallBold'
                        themeColor="secondaryText"
                    >
                        Submit
                    </ThemedText>
                </Pressable>
            </ScrollView> 
        </View>
    );
}

const styles = StyleSheet.create({
    logo: {
        marginTop: Spacing.xl,
        width: 250,
        height: 70,
        resizeMode: 'contain',
    },

    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },

    headerview: {
        backgroundColor: BrandColors.navy,
        height: 3*Spacing.xl,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    body: {
        marginTop: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.md,
    },

    input: {
        backgroundColor: BrandColors.white,
        borderWidth: 1.5,
        borderColor: BrandColors.navy,
        borderRadius: Radius.xl,
        minHeight: 44,
        width: '90%',
        paddingHorizontal: Spacing.md,
    },

    button: {
        marginLeft: Spacing.lg,
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        width: '23%',
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },

    form: {
        marginTop: Spacing.lg,
        marginLeft: '10%',
        alignItems: 'flex-start',
    },

    submit: {
        marginTop: Spacing.xl,
        marginRight: Spacing.lg,
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        width: '23%',
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },

    scrollContent: {
        paddingBottom: '50%',
    },

    welcomeText: {
        alignSelf: 'flex-start',
        marginLeft: '10%',
    },

    pressed: {
        opacity: 0.7,
    },

    dropdown: {
        marginTop: Spacing.xs,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    placeholderText: {
        color: 'gray',
    },

    dropdownList: {
        width: '90%',
        borderWidth: 1.5,
        borderColor: BrandColors.navy,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        backgroundColor: BrandColors.white,
    },

    dropdownOption: {
        minHeight: 44,
        paddingHorizontal: Spacing.md,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.navy,
    },

    errorText: {
        color: BrandColors.red,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
})