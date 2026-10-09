import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function ComingSoonScreen() {
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText style={styles.icon}>+</ThemedText>
          <ThemedText type="subtitle" style={styles.title}>Request</ThemedText>
          <ThemedText type="smallBold" style={styles.badge}>COMING SOON</ThemedText>
          <ThemedText type="small" style={styles.description}>
            Blood-request creation will be connected here when Member 2&apos;s implementation is merged.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F8FF', flex: 1 },
  safeArea: { flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: Spacing.four },
  icon: { alignItems: 'center', backgroundColor: '#FFE7EE', borderRadius: 36, color: '#E7194F', fontSize: 40, fontWeight: '700', height: 72, lineHeight: 68, textAlign: 'center', width: 72 },
  title: { color: '#14253B', fontSize: 28, marginTop: Spacing.three },
  badge: { backgroundColor: '#FFE7EE', borderRadius: 14, color: '#C9003D', fontSize: 11, letterSpacing: 0.7, marginTop: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  description: { color: '#6E7180', lineHeight: 22, marginTop: Spacing.three, maxWidth: 320, textAlign: 'center' },
});
