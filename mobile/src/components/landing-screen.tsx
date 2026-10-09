import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { donorSession } from '@/lib/donor-session';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const colors = {
  canvas: '#FFF1F4',
  blush: '#FFD8E0',
  red: '#E7194F',
  deepRed: '#C9003D',
  ink: '#14253B',
  muted: '#785F68',
  white: '#FFFFFF',
};

export function LandingScreen() {
  const router = useRouter();
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  useEffect(() => {
    let mounted = true;

    void Promise.all([donorSession.get(), donorSession.getRole()])
      .then(([userId, role]) => {
        if (!mounted || !userId) return;
        if (role === 'recipient') router.replace('/recipient-dashboard');
        else if (role === 'hospital_staff') router.replace('/hospital-dashboard');
        else router.replace({ pathname: '/profile', params: { donorId: userId } } as never);
      })
      .catch(() => {
        if (mounted) {
          setStorageUnavailable(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.networkPill}>
            <View style={styles.networkDot} />
            <ThemedText type="smallBold" style={styles.networkText}>LIVE NETWORK ACTIVE</ThemedText>
          </View>

          <View style={styles.hero}>
            <View style={styles.logoRing}>
              <View style={styles.logoShadow}>
                <View style={styles.logoCircle}>
                  <SymbolView
                    name={{ ios: 'drop.fill', android: 'water_drop', web: 'favorite' }}
                    size={56}
                    tintColor={colors.white}
                  />
                </View>
              </View>
              <View style={styles.medicalBadge}>
                <ThemedText style={styles.medicalBadgeText}>+</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.brand}>
              Life<TextColor color={colors.red}>Link</TextColor>
            </ThemedText>
            <View style={styles.subtitleRow}>
              <View style={styles.subtitleRule} />
              <ThemedText type="smallBold" style={styles.subtitle}>CLINICAL EMERGENCY NETWORK</ThemedText>
              <View style={styles.subtitleRule} />
            </View>

            <ThemedText style={styles.message}>Every drop counts.</ThemedText>
            <ThemedText style={[styles.message, styles.messageAccent]}>Every donor matters.</ThemedText>
            <ThemedText type="small" style={styles.description}>
              Connect verified donors with patients and{'\n'}hospitals in emergency situations.
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get started"
            onPress={() => router.push('/role-select')}
            style={({ pressed }) => [styles.getStarted, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.getStartedText}>Get Started</ThemedText>
            <SymbolView
              name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
              size={22}
              tintColor={colors.white}
            />
          </Pressable>

          {storageUnavailable && (
            <ThemedText type="small" style={styles.storageNotice}>
              Session storage is unavailable. You can continue, but this device
              may not remember your login until the app is rebuilt with storage
              support.
            </ThemedText>
          )}

          <View style={styles.footer}>
            <View style={styles.divider} />
            <ThemedText type="small" style={styles.footerText}>
              Built for emergency blood donation coordination
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function TextColor({ children, color }: { children: string; color: string }) {
  return <ThemedText style={{ color }}>{children}</ThemedText>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  safeArea: { flex: 1 },
  topGlow: {
    backgroundColor: colors.blush,
    borderRadius: 260,
    height: 390,
    opacity: 0.75,
    position: 'absolute',
    right: -150,
    top: -160,
    width: 480,
  },
  bottomGlow: {
    backgroundColor: '#FFE7EC',
    borderRadius: 300,
    bottom: -180,
    height: 430,
    opacity: 0.8,
    position: 'absolute',
    left: -180,
    width: 520,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    paddingTop: Spacing.two,
  },
  networkPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 20,
    elevation: 2,
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 7,
    shadowColor: colors.deepRed,
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  networkDot: { backgroundColor: colors.red, borderRadius: 5, height: 8, width: 8 },
  networkText: { color: colors.red, fontSize: 11, letterSpacing: 0.3 },
  hero: { alignItems: 'center', paddingVertical: Spacing.four },
  logoRing: {
    alignItems: 'center',
    borderColor: '#F7B3C0',
    borderRadius: 90,
    borderWidth: 1,
    height: 180,
    justifyContent: 'center',
    marginBottom: Spacing.three,
    position: 'relative',
    width: 180,
  },
  logoShadow: {
    borderRadius: 58,
    elevation: 9,
    shadowColor: colors.deepRed,
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.deepRed,
    borderColor: '#F35678',
    borderRadius: 58,
    borderWidth: 2,
    height: 116,
    justifyContent: 'center',
    width: 116,
  },
  medicalBadge: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.red,
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    top: 25,
    width: 30,
  },
  medicalBadgeText: { color: colors.red, fontSize: 23, fontWeight: '800', lineHeight: 25 },
  brand: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -1.2 },
  subtitleRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.one, marginTop: Spacing.one },
  subtitleRule: { backgroundColor: '#F2B4C0', height: 1, width: 18 },
  subtitle: { color: colors.muted, fontSize: 11, letterSpacing: 0.8 },
  message: { color: '#573E47', fontSize: 19, fontWeight: '700', lineHeight: 27, marginTop: Spacing.four },
  messageAccent: { color: colors.deepRed, marginTop: 0 },
  description: { color: '#513C44', fontSize: 14, lineHeight: 22, marginTop: Spacing.four, textAlign: 'center' },
  getStarted: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.red,
    borderRadius: 17,
    elevation: 4,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 64,
    shadowColor: colors.deepRed,
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  getStartedText: { color: colors.white, fontSize: 15 },
  pressed: { opacity: 0.82 },
  footer: { alignItems: 'center', marginTop: Spacing.four },
  divider: { backgroundColor: '#E7AAB7', height: 1, marginBottom: Spacing.two, width: '100%' },
  storageNotice: {
    color: colors.deepRed,
    fontSize: 12,
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  footerText: { color: colors.muted, fontSize: 11, textAlign: 'center' },
});
