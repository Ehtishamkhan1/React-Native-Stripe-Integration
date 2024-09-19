import { StripeProvider } from '@stripe/stripe-react-native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Payment from './Components/Payment';

export default function App() {
  return (
    <View style={styles.container} >
   <StripeProvider publishableKey='Add Publishable key Here'>
    <Payment/>
   </StripeProvider>
   </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
