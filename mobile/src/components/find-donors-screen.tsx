import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { donorApi, type Donor } from '@/lib/api';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type DonorFilter = 'all' | 'available' | 'verified';

const m02Colors = {
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
  greenSoft: '#D9F8E7',
};

function formatLastDonation(date?: string) {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return `Last donation: ${parsedDate.toLocaleDateString()}`;
}

function DonorCard({ donor }: { donor: Donor }) {
  const lastDonation = formatLastDonation(donor.lastDonationAt);

  return (
    <ThemedView type="backgroundElement" style={[styles.donorCard, donor.available ? styles.availableCard : styles.unavailableCard]}>
      <View style={styles.cardTopRow}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{donor.name.charAt(0).toUpperCase()}</ThemedText>
        </View>
        <View style={styles.nameBlock}>
          <ThemedText type="smallBold" style={styles.donorName} numberOfLines={1}>{donor.name}</ThemedText>
          <View style={styles.locationRow}>
            <SymbolView name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} size={13} tintColor={m02Colors.muted} />
            <ThemedText type="small" style={styles.locationText}>{donor.city}</ThemedText>
          </View>
        </View>
        <View style={styles.bloodBadge}>
          <ThemedText style={styles.bloodText}>{donor.bloodGroup}</ThemedText>
          <ThemedText style={styles.bloodCaption}>TYPE</ThemedText>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <View style={[styles.statusDot, donor.available ? styles.availableDot : styles.unavailableDot]} />
        <ThemedText type="small" style={styles.statusText}>
          {donor.available ? 'Available now' : 'Currently unavailable'}
        </ThemedText>
      </View>
      {lastDonation && (
        <View style={styles.infoPanel}>
          <SymbolView name={{ ios: 'calendar', android: 'event', web: 'event' }} size={17} tintColor={m02Colors.blue} />
          <ThemedText type="small" style={styles.infoText}>{lastDonation}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

export function FindDonorsScreen() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<DonorFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDonors = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      setDonors(await donorApi.list());
    } catch {
      setErrorMessage('We could not load donors. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDonors();
  }, []);

  const filteredDonors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return donors.filter((donor) => {
      const matchesSearch = !normalizedQuery ||
        donor.name.toLowerCase().includes(normalizedQuery) ||
        donor.bloodGroup.toLowerCase().includes(normalizedQuery) ||
        donor.city.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === 'all' || (filter === 'available' && donor.available);
      return matchesSearch && matchesFilter;
    });
  }, [donors, filter, searchQuery]);

  const activeDonorCount = donors.filter((donor) => donor.available).length;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={filteredDonors}
          keyExtractor={(donor) => donor._id}
          renderItem={({ item }) => <DonorCard donor={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadDonors(true)} />}
          ListHeaderComponent={
            <View>
              <View style={styles.headerRow}>
                <Pressable accessibilityLabel="Back" style={styles.headerIconButton}>
                  <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={m02Colors.ink} />
                </Pressable>
                <View style={styles.headerTitleBlock}>
                  <ThemedText type="subtitle" style={styles.heading}>Find Donors</ThemedText>
                  <View style={styles.locationRow}>
                    <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} size={13} tintColor={m02Colors.blue} />
                    <ThemedText type="small" style={styles.headerLocation}>Colombo Metro (Within 10 km)</ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.searchBox}>
                <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={19} tintColor={m02Colors.muted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name, blood group, or hospital..."
                  placeholderTextColor="#B29BA2"
                  style={styles.searchInput}
                  accessibilityLabel="Search donors"
                />
                <SymbolView name={{ ios: 'scope', android: 'my_location', web: 'my_location' }} size={19} tintColor={m02Colors.muted} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {([
                  ['all', 'All Donors'],
                  ['available', 'Available Now'],
                  ['verified', 'Verified Only'],
                ] as const).map(([value, label]) => {
                  const isDisabled = value === 'verified';
                  const isSelected = filter === value;
                  return (
                    <Pressable
                      key={value}
                      disabled={isDisabled}
                      onPress={() => setFilter(value)}
                      style={[styles.filterButton, isSelected && styles.selectedFilter, isDisabled && styles.disabledFilter]}>
                      {value === 'available' && <View style={styles.filterDot} />}
                      <ThemedText type="small" themeColor={isSelected ? 'text' : 'textSecondary'} style={isDisabled && styles.disabledFilterText}>
                        {label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ThemedView style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <SymbolView name={{ ios: 'cross.fill', android: 'add', web: 'add' }} size={18} tintColor={m02Colors.blue} />
                </View>
                <View style={styles.summaryCopy}>
                  <ThemedText type="smallBold" style={styles.summaryTitle}>{activeDonorCount} Active Donors</ThemedText>
                  <ThemedText type="small" style={styles.summarySubtitle}>Screened via NBTS &amp; ready for emergency dispatch</ThemedText>
                </View>
                <SymbolView name={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }} size={19} tintColor={m02Colors.blue} />
              </ThemedView>
              <ThemedText type="small" themeColor="textSecondary" style={styles.dataNote}>
                Verification, hospital, distance, and direct requests are not provided by the current donor API.
              </ThemedText>
            </View>
          }
          ListEmptyComponent={
            isLoading ? <View style={styles.stateContainer}><ActivityIndicator color="#C94848" /><ThemedText type="small" themeColor="textSecondary">Loading donors...</ThemedText></View> :
            errorMessage ? <View style={styles.stateContainer}><ThemedText type="small" style={styles.errorText}>{errorMessage}</ThemedText><Pressable onPress={() => void loadDonors()} style={styles.retryButton}><ThemedText type="smallBold" style={styles.retryText}>Try again</ThemedText></Pressable></View> :
            <View style={styles.stateContainer}><ThemedText type="smallBold">No donors found</ThemedText><ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>Try another search or refresh the directory.</ThemedText></View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: m02Colors.canvas, flex: 1 },
  safeArea: { flex: 1 },
  listContent: { gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: 110 },
  headerRow: { alignItems: 'center', flexDirection: 'row', marginBottom: Spacing.three, paddingTop: Spacing.two },
  headerIconButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 34 },
  headerTitleBlock: { flex: 1, marginLeft: Spacing.one },
  heading: { color: m02Colors.red, fontSize: 22, lineHeight: 27 },
  headerLocation: { color: m02Colors.blue, fontSize: 12, fontWeight: '600' },
  searchBox: { alignItems: 'center', backgroundColor: m02Colors.surface, borderColor: '#CAD4E6', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: Spacing.two, minHeight: 48, paddingHorizontal: Spacing.two, marginBottom: Spacing.two },
  searchInput: { color: m02Colors.ink, flex: 1, fontSize: 14, minHeight: 46 },
  filterRow: { gap: Spacing.one, paddingBottom: Spacing.two },
  filterButton: { alignItems: 'center', backgroundColor: m02Colors.surface, borderColor: '#DFE4ED', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  selectedFilter: { backgroundColor: m02Colors.surface, borderColor: '#DFE4ED' },
  filterDot: { backgroundColor: m02Colors.green, borderRadius: 5, height: 9, width: 9 },
  summaryCard: { alignItems: 'center', backgroundColor: m02Colors.blueSoft, borderColor: '#A8D9FF', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two, padding: Spacing.two },
  summaryIcon: { alignItems: 'center', backgroundColor: m02Colors.blue, height: 18, justifyContent: 'center', width: 18 },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: m02Colors.blue },
  summarySubtitle: { color: m02Colors.blue, fontSize: 12, lineHeight: 17 },
  summaryCount: { fontSize: 34, lineHeight: 40, marginVertical: Spacing.one },
  disabledFilter: { opacity: 0.45 },
  disabledFilterText: { textDecorationLine: 'line-through' },
  dataNote: { marginBottom: Spacing.two },
  donorCard: { borderRadius: 16, gap: Spacing.two, padding: Spacing.three },
  availableCard: { borderLeftColor: m02Colors.red, borderLeftWidth: 4 },
  unavailableCard: { borderLeftColor: '#E8B8C3', borderLeftWidth: 4 },
  cardTopRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  avatar: { alignItems: 'center', backgroundColor: '#F8D9D9', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  avatarText: { color: '#9B2C2C', fontSize: 20, fontWeight: '700' },
  nameBlock: { flex: 1, gap: 2 },
  donorName: { color: m02Colors.ink, fontSize: 17, lineHeight: 21 },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  locationText: { color: m02Colors.muted, fontSize: 12 },
  bloodBadge: { alignItems: 'center', backgroundColor: '#C94848', borderRadius: 10, minWidth: 52, paddingHorizontal: 8, paddingVertical: 8 },
  bloodText: { color: '#FFFFFF', fontWeight: '700' },
  bloodCaption: { color: m02Colors.muted, fontSize: 8, letterSpacing: 1 },
  cardDetails: { alignItems: 'center', flexDirection: 'row', gap: Spacing.one },
  statusDot: { borderRadius: 4, height: 8, width: 8 },
  availableDot: { backgroundColor: '#2F9E68' },
  unavailableDot: { backgroundColor: '#8F9198' },
  statusText: { fontWeight: '600' },
  infoPanel: { alignItems: 'center', backgroundColor: '#F1F6FF', borderColor: '#D8E5FA', borderRadius: 6, borderWidth: 1, flexDirection: 'row', gap: Spacing.one, paddingHorizontal: Spacing.two, paddingVertical: 10 },
  infoText: { color: m02Colors.ink, fontSize: 12 },
  stateContainer: { alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.five },
  errorText: { color: '#B42318', textAlign: 'center' },
  emptyText: { textAlign: 'center' },
  retryButton: { backgroundColor: '#C94848', borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  retryText: { color: '#FFFFFF' },
});