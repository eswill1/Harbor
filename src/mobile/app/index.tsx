import { View, Text, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Harbor</Text>
      <Text style={styles.subtitle}>The feed you can finish.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B2A3B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5A6A7A',
  },
})
