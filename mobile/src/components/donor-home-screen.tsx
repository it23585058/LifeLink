import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
  type Href,
} from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import {
  donorManagementApi,
  type DonorProfile,
} from '@/lib/donor-api';
import { donorSession } from '@/lib/donor-session';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const palette = {
  canvas: '#F7F8FF',
  surface: '#FFFFFF',
  ink: '#14253B',
  muted: '#6E7180',
  border: '#D6DDEA',
  red: '#E7194F',
  redSoft: '#FFE7EE',
  blue: '#0878A8',
  blueSoft: '#E6F4FF',
  green: '#087A3E',
  errorText: '#B42318',
};

type Section = {
  key: 'medical' | 'history';
  title: string;
  description: string;
  path: string;
};

const SECTIONS: Section[] = [
  {
    key: 'medical',
    title: 'Medical Credentials',
    description: 'Add and manage your medical records',
    path: '/donor-medical',
  },
  {
    key: 'history',
    title: 'Donation History',
    description: 'See your past blood donations',
    path: '/donation-history',
  },
];

const PROFILE_PATH = '/donor-profile';

export function DonorHomeScreen() {
  const router = useRouter();

  const { donorId: paramDonorId } =
    useLocalSearchParams<{
      donorId?: string;
    }>();

  const [activeDonorId, setActiveDonorId] =
    useState<string | undefined>(undefined);

  const [donor, setDonor] =
    useState<DonorProfile | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [toggleError, setToggleError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDonorId = async () => {
      try {
        if (paramDonorId) {
          await donorSession.save(paramDonorId);

          if (!cancelled) {
            setActiveDonorId(paramDonorId);
          }

          return;
        }

        const savedDonorId =
          await donorSession.get();

        if (cancelled) {
          return;
        }

        if (savedDonorId) {
          setActiveDonorId(savedDonorId);
        } else {
          setIsLoading(false);
          setErrorMessage(
            'No donor selected.'
          );
        }
      } catch (error) {
        console.error(
          'DONOR SESSION ERROR:',
          error
        );

        if (!cancelled) {
          setIsLoading(false);
          setErrorMessage(
            'Could not load donor session.'
          );
        }
      }
    };

    void loadDonorId();

    return () => {
      cancelled = true;
    };
  }, [paramDonorId]);

  useEffect(() => {
    if (!activeDonorId) {
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setErrorMessage(null);

    donorManagementApi
      .get(activeDonorId)
      .then((data) => {
        console.log(
          'DONOR FROM API:',
          data
        );

        if (!cancelled) {
          setDonor(data);
        }
      })
      .catch((error) => {
        console.error(
          'GET DONOR ERROR:',
          error
        );

        if (!cancelled) {
          setErrorMessage(
            'Could not load your details. Check your connection.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeDonorId]);

  const goTo = (path: string) => {
    if (!activeDonorId) {
      console.log(
        'Navigation blocked: donor ID missing'
      );
      return;
    }

    console.log(
      'NAVIGATING TO:',
      path,
      'DONOR ID:',
      activeDonorId
    );

    router.push({
      pathname: path,
      params: {
        donorId: activeDonorId,
      },
    } as Href);
  };

  const handleToggleAvailable = async (
    value: boolean
  ) => {
    if (!activeDonorId || !donor) {
      return;
    }

    const previousDonor = donor;

    setDonor({
      ...donor,
      available: value,
    });

    setToggleError(null);
    setIsSaving(true);

    try {
      const updated =
        await donorManagementApi.update(
          activeDonorId,
          {
            available: value,
          }
        );

      setDonor(updated);
    } catch (error) {
      console.error(
        'UPDATE AVAILABILITY ERROR:',
        error
      );

      setDonor(previousDonor);

      setToggleError(
        'Could not update availability. Try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const firstName =
    donor?.name
      ?.trim()
      ?.split(/\s+/)[0] || '';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel="Back"
              onPress={() =>
                router.navigate(
                  '/role-select'
                )
              }
              style={styles.backButton}
            >
              <ThemedText
                style={styles.backText}
              >
                ‹
              </ThemedText>
            </Pressable>

            <View
              style={
                styles.headerTitleBlock
              }
            >
              <ThemedText
                type="subtitle"
                style={styles.heading}
              >
                {firstName
                  ? `Hi, ${firstName}`
                  : 'Donor Home'}
              </ThemedText>

              <ThemedText
                type="small"
                style={styles.headerSub}
              >
                LifeLink Official Network
              </ThemedText>
            </View>

            {/* PROFILE BUTTON */}
            <Pressable
              accessibilityLabel="Profile"
              accessibilityRole="button"
              onPress={() =>
                goTo(PROFILE_PATH)
              }
              style={styles.profileButton}
            >
              <SymbolView
                name={{
                  ios: 'person.crop.circle',
                  android: 'account_circle',
                  web: 'account_circle',
                }}
                size={30}
                tintColor={palette.red}
              />

              <ThemedText
                type="small"
                style={styles.profileLabel}
              >
                Profile
              </ThemedText>
            </Pressable>
          </View>

          {/* DONOR INFORMATION */}
          {isLoading ? (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                color={palette.red}
                size="large"
              />
            </View>
          ) : donor ? (
            <View
              style={styles.welcomeCard}
            >
              <View
                style={styles.welcomeCopy}
              >
                <ThemedText
                  type="small"
                  style={styles.welcomeLabel}
                >
                  Welcome back
                </ThemedText>

                <ThemedText
                  type="smallBold"
                  style={styles.welcomeName}
                  numberOfLines={1}
                >
                  {donor.name}
                </ThemedText>

                {donor.city && (
                  <ThemedText
                    type="small"
                    style={styles.cityText}
                    numberOfLines={1}
                  >
                    📍 {donor.city}
                  </ThemedText>
                )}

                <View
                  style={styles.toggleRow}
                >
                  <Switch
                    value={
                      donor.available
                    }
                    onValueChange={(
                      value
                    ) =>
                      void handleToggleAvailable(
                        value
                      )
                    }
                    disabled={isSaving}
                    trackColor={{
                      false: '#C9CED8',
                      true: palette.green,
                    }}
                    accessibilityLabel="Available to donate"
                  />

                  <ThemedText
                    type="small"
                    style={styles.welcomeLabel}
                  >
                    {donor.available
                      ? 'Available to donate'
                      : 'Currently unavailable'}
                  </ThemedText>
                </View>

                {toggleError && (
                  <ThemedText
                    type="small"
                    style={styles.errorText}
                  >
                    {toggleError}
                  </ThemedText>
                )}
              </View>

              {/* BLOOD GROUP */}
              <View
                style={styles.bloodBadge}
              >
                <ThemedText
                  style={styles.bloodText}
                >
                  {donor.bloodGroup ===
                  'UNKNOWN'
                    ? '?'
                    : donor.bloodGroup}
                </ThemedText>

                <ThemedText
                  style={styles.bloodCaption}
                >
                  TYPE
                </ThemedText>
              </View>
            </View>
          ) : (
            <View
              style={styles.noticeBox}
            >
              <ThemedText
                type="small"
                style={styles.noticeText}
              >
                {errorMessage ??
                  'No donor selected.'}
              </ThemedText>
            </View>
          )}

          {/* MEDICAL + HISTORY CARDS */}
          {SECTIONS.map(
            (section) => (
              <Pressable
                key={section.key}
                onPress={() =>
                  goTo(section.path)
                }
                accessibilityRole="button"
                accessibilityLabel={
                  section.title
                }
                style={styles.card}
              >
                <View
                  style={styles.cardCopy}
                >
                  <ThemedText
                    style={
                      styles.cardTitle
                    }
                  >
                    {section.title}
                  </ThemedText>

                  <ThemedText
                    type="small"
                    style={styles.cardText}
                  >
                    {section.description}
                  </ThemedText>
                </View>

                <ThemedText
                  style={styles.chevron}
                >
                  ›
                </ThemedText>
              </Pressable>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.canvas,
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: 110,
    paddingTop: Spacing.two,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },

  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  backButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 34,
  },

  backText: {
    color: palette.ink,
    fontSize: 30,
    lineHeight: 32,
  },

  headerTitleBlock: {
    flex: 1,
    marginLeft: Spacing.one,
  },

  heading: {
    color: palette.red,
    fontSize: 22,
    lineHeight: 27,
  },

  headerSub: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '600',
  },

  profileButton: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.two,
  },

  profileLabel: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '600',
  },

  welcomeCard: {
    alignItems: 'center',
    backgroundColor: palette.blueSoft,
    borderColor: '#A8D9FF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },

  welcomeCopy: {
    flex: 1,
    gap: 4,
  },

  welcomeLabel: {
    color: palette.blue,
    fontSize: 12,
  },

  welcomeName: {
    color: palette.ink,
    fontSize: 18,
    lineHeight: 22,
  },

  cityText: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 1,
  },

  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 2,
  },

  errorText: {
    color: palette.errorText,
    fontSize: 12,
  },

  bloodBadge: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 10,
    minWidth: 56,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  bloodText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  bloodCaption: {
    color: '#FFD0DC',
    fontSize: 8,
    letterSpacing: 1,
  },

  noticeBox: {
    backgroundColor: palette.redSoft,
    borderRadius: 9,
    padding: Spacing.three,
  },

  noticeText: {
    color: palette.errorText,
  },

  card: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 100,
    padding: Spacing.three,
  },

  cardCopy: {
    flex: 1,
    gap: 2,
  },

  cardTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },

  cardText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  chevron: {
    color: palette.muted,
    fontSize: 28,
    lineHeight: 30,
  },
});