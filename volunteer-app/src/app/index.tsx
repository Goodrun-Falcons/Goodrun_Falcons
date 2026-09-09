import { Redirect } from 'expo-router';
import LoginScreen from './login';
import RegisterScreen from './register';
import RegisterSuccessScreen from './register-success';

export default function IndexScreen() {
  return(
    <LoginScreen/>
  );
}