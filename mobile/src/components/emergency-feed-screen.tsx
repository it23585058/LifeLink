import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
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

import { bloodRequestApi, donorApi, type BloodRequest, type Donor, type DonorResponse } from '@/lib/api';
import { donorSession } from '@/lib/donor-session';
import { Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const colors = {
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

type FeedFilter = 'all' | 'critical' | 'verified';
type ActionState = 'idle' | 'sending' | 'success' | 'error';
type ActionStatus = 'accepted' | 'declined';

type ActionFeedback = {
  state: ActionState;
  message?: string;
};

function responseDonorId(response: DonorResponse) {
  return typeof response.donor === 'string' ? response.donor : response.donor._id;
}

function formatRequestDate(date?: string) {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return `Posted ${parsedDate.toLocaleString()}`;
}

function requestTitle(request: BloodRequest) {
  return `${request.unitsNeeded} unit${request.unitsNeeded === 1 ? '' : 's'} of ${request.bloodGroup} blood needed`;
}

function actionKey(requestId: string, status: ActionStatus) {
  return `${requestId}:${status}`;
}

function RequestMeta({ request }: { request: BloodRequest }) {
  const postedAt = formatRequestDate(request.createdAt);

  return (
    <View style={styles.metaRow}>
      {postedAt && <ThemedText type="small" style={styles.metaText}>{postedAt}</ThemedText>}
      <ThemedText type="small" style={styles.metaSeparator}>•</ThemedText>
      <View style={styles.metaLocation}>
        <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} size={13} tintColor={colors.blue} />
        <ThemedText type="small" style={styles.metaText}>{request.city}</ThemedText>
      </View>
    </View>
  );
}

function RequestCard({
  request,
  feedback,
  onRespond,
  currentResponse,
  isResponseLoading,
  onWithdraw,
}: {
  request: BloodRequest;
  feedback?: ActionFeedback;
  onRespond: (request: BloodRequest, status: ActionStatus) => void;
  currentResponse?: DonorResponse;
  isResponseLoading: boolean;
  onWithdraw: (request: BloodRequest) => void;
}) {
  const isCritical = request.urgency === 'critical';
  const isSending = isResponseLoading || feedback?.state === 'sending';

  return (
    <ThemedView style={[styles.requestCard, isCritical ? styles.criticalCard : styles.standardCard]}>
      <View style={styles.requestTopRow}>
        <View style={styles.requestBloodBadge}>
          <ThemedText style={styles.requestBloodText}>{request.bloodGroup}</ThemedText>
        </View>
        <View style={styles.requestTitleBlock}>
          <ThemedText type="smallBold" style={styles.requestTitle}>{requestTitle(request)}</ThemedText>
          <View style={[styles.urgencyChip, isCritical ? styles.criticalChip : styles.standardChip]}>
            <ThemedText style={[styles.urgencyText, isCritical ? styles.criticalText : styles.standardText]}>
              {request.urgency.toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedText type="small" style={styles.hospitalText}>{request.hospital}</ThemedText>
      <ThemedText type="small" style={styles.requestDetails}>{request.notes || `${request.unitsNeeded} unit${request.unitsNeeded === 1 ? '' : 's'} required in ${request.city}.`}</ThemedText>
      <RequestMeta request={request} />

      {feedback?.state === 'success' && (
        <ThemedText type="small" style={styles.successMessage}>{feedback.message}</ThemedText>
      )}
      {feedback?.state === 'error' && (
        <ThemedText type="small" style={styles.errorMessage}>{feedback.message}</ThemedText>
      )}

      {currentResponse && (
        <View style={styles.responseState}>
          <ThemedText type="smallBold" style={styles.responseStateTitle}>Your response: {currentResponse.status.toUpperCase()}</ThemedText>
          <Pressable disabled={isSending} onPress={() => onWithdraw(request)}>
            <ThemedText type="smallBold" style={styles.withdrawText}>Withdraw response</ThemedText>
          </Pressable>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          disabled={isSending}
          onPress={() => onRespond(request, 'accepted')}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed, isSending && styles.disabledAction]}>
          <SymbolView name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }} size={17} tintColor="#FFFFFF" />
          <ThemedText style={styles.primaryActionText}>{isSending ? 'Sending...' : 'Accept Dispatch'}</ThemedText>
        </Pressable>
        <Pressable
          disabled={isSending}
          onPress={() => onRespond(request, 'declined')}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed, isSending && styles.disabledAction]}>
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor={colors.muted} />
          <ThemedText style={styles.secondaryActionText}>Cannot Attend</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

export function EmergencyFeedScreen() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [responses, setResponses] = useState<Record<string, DonorResponse[]>>({});
  const [responseLoading, setResponseLoading] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, ActionFeedback>>({});

  const loadResponsesForRequest = async (requestId: string) => {
    setResponseLoading((current) => ({ ...current, [requestId]: true }));
    try {
      const requestResponses = await bloodRequestApi.listResponses(requestId);
      setResponses((current) => ({ ...current, [requestId]: requestResponses }));
      return requestResponses;
    } finally {
      setResponseLoading((current) => ({ ...current, [requestId]: false }));
    }
  };

  const loadRequests = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      const [nextRequests, nextDonors] = await Promise.all([
        bloodRequestApi.list({ status: 'open' }),
        donorApi.list(),
      ]);
      setRequests(nextRequests);
      setDonors(nextDonors);
      setSelectedDonorId((current) => {
        if (current && nextDonors.some((donor) => donor._id === current)) return current;
        return nextDonors.find((donor) => donor.available)?._id || nextDonors[0]?._id || '';
      });
      const responseEntries = await Promise.all(nextRequests.map(async (request) => {
        try {
          return [request._id, await bloodRequestApi.listResponses(request._id)] as const;
        } catch {
          return [request._id, []] as const;
        }
      }));
      setResponses(Object.fromEntries(responseEntries));
    } catch {
      setErrorMessage('We could not load emergency requests. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void donorSession.get()
      .then((donorId) => {
        if (!cancelled && donorId) setSelectedDonorId(donorId);
        return loadRequests();
      })
      .catch(() => {
        if (!cancelled) setErrorMessage('Could not restore your donor session. Please sign in again.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesSearch = !normalizedQuery ||
        request.patientName.toLowerCase().includes(normalizedQuery) ||
        request.bloodGroup.toLowerCase().includes(normalizedQuery) ||
        request.hospital.toLowerCase().includes(normalizedQuery) ||
        request.city.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === 'all' || (filter === 'critical' && request.urgency === 'critical');
      return matchesSearch && matchesFilter;
    });
  }, [filter, requests, searchQuery]);

  const selectedResponseFor = (requestId: string) => {
    return responses[requestId]?.find((response) => responseDonorId(response) === selectedDonorId);
  };

  const respondToRequest = async (request: BloodRequest, status: ActionStatus) => {
    const key = actionKey(request._id, status);
    if (!selectedDonorId) {
      setFeedback((current) => ({
        ...current,
        [key]: {
          state: 'error',
          message: 'A donor profile is required before sending a response. Please sign in again.',
        },
      }));
      return;
    }

    const existingResponse = selectedResponseFor(request._id);
    setFeedback((current) => ({ ...current, [key]: { state: 'sending' } }));
    setResponseLoading((current) => ({ ...current, [request._id]: true }));
    try {
      const payload = {
        status,
        message: status === 'accepted' ? 'Dispatch accepted from Emergency Feed.' : 'Unable to attend this dispatch.',
      } as const;
      if (existingResponse) {
        await bloodRequestApi.updateResponse(request._id, existingResponse._id, payload);
      } else {
        await bloodRequestApi.createResponse(request._id, { donor: selectedDonorId, ...payload });
      }
      await loadResponsesForRequest(request._id);
      setFeedback((current) => ({
        ...current,
        [key]: {
          state: 'success',
          message: existingResponse
            ? 'Response updated in MongoDB.'
            : status === 'accepted' ? 'Dispatch response created in MongoDB.' : 'Cannot Attend response created in MongoDB.',
        },
      }));
    } catch (error) {
      const isDuplicate = axios.isAxiosError(error) && error.response?.status === 409;
      await loadResponsesForRequest(request._id).catch(() => undefined);
      setFeedback((current) => ({
        ...current,
        [key]: {
          state: 'error',
          message: isDuplicate
            ? 'A response already exists for this donor. The current MongoDB state was reloaded.'
            : 'The response could not be sent. Please try again.',
        },
      }));
    } finally {
      setResponseLoading((current) => ({ ...current, [request._id]: false }));
    }
  };

  const withdrawResponse = async (request: BloodRequest) => {
    const existingResponse = selectedResponseFor(request._id);
    if (!existingResponse) return;

    const key = actionKey(request._id, 'declined');
    setFeedback((current) => ({ ...current, [key]: { state: 'sending' } }));
    setResponseLoading((current) => ({ ...current, [request._id]: true }));
    try {
      await bloodRequestApi.deleteResponse(request._id, existingResponse._id);
      await loadResponsesForRequest(request._id);
      setFeedback((current) => ({ ...current, [key]: { state: 'success', message: 'Response withdrawn from MongoDB.' } }));
    } catch {
      setFeedback((current) => ({ ...current, [key]: { state: 'error', message: 'The response could not be withdrawn.' } }));
    } finally {
      setResponseLoading((current) => ({ ...current, [request._id]: false }));
    }
  };

  const liveRequest = filteredRequests.find((request) => request.urgency === 'critical') || filteredRequests[0];

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={filteredRequests}
          keyExtractor={(request) => request._id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              feedback={feedback[actionKey(item._id, 'declined')] || feedback[actionKey(item._id, 'accepted')]}
              onRespond={respondToRequest}
              currentResponse={selectedResponseFor(item._id)}
              isResponseLoading={Boolean(responseLoading[item._id])}
              onWithdraw={withdrawResponse}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadRequests(true)} />}
          ListHeaderComponent={
            <View>
              <View style={styles.headerRow}>
                <Pressable accessibilityLabel="Back" style={styles.headerIconButton}>
                  <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={colors.ink} />
                </Pressable>
                <View style={styles.headerTitleBlock}>
                  <ThemedText type="subtitle" style={styles.heading}>Emergency Alert Broadcasts</ThemedText>
                </View>
              </View>

              <View style={styles.liveHeader}>
                <View style={styles.liveTitleRow}>
                  <SymbolView name={{ ios: 'bell.badge', android: 'notifications_active', web: 'notifications_active' }} size={22} tintColor={colors.red} />
                  <ThemedText type="subtitle" style={styles.liveTitle}>Live Heads-Up{`\n`}Simulation</ThemedText>
                </View>
                <View style={styles.demoChip}><ThemedText style={styles.demoText}>LOCK-SCREEN{`\n`}DEMO</ThemedText></View>
              </View>

              <View style={styles.profileSection}>
                <ThemedText type="smallBold" style={styles.profileLabel}>Respond as donor</ThemedText>
                {donors.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRow}>
                    {donors.map((donor) => (
                      <Pressable
                        key={donor._id}
                        onPress={() => setSelectedDonorId(donor._id)}
                        style={[styles.profileChip, donor._id === selectedDonorId && styles.selectedProfileChip]}>
                        <ThemedText type="small" style={donor._id === selectedDonorId ? styles.selectedProfileText : styles.profileText}>
                          {donor.name} · {donor.bloodGroup}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <ThemedText type="small" style={styles.mutedText}>No donor profiles are available for responses.</ThemedText>
                )}
              </View>

              {liveRequest && (
                <ThemedView style={styles.liveCard}>
                  <View style={styles.liveCardInner}>
                    <View style={styles.liveMetaRow}>
                      <ThemedText type="smallBold" style={styles.liveMetaText}>LIFELINK ALERT</ThemedText>
                      <ThemedText type="smallBold" style={styles.liveMetaText}>•</ThemedText>
                      <ThemedText type="smallBold" style={styles.liveMetaText}>{liveRequest.urgency.toUpperCase()}</ThemedText>
                      <ThemedText type="smallBold" style={styles.liveMetaText}>DISPATCH NOW</ThemedText>
                    </View>
                    <RequestCard
                      request={liveRequest}
                      feedback={feedback[actionKey(liveRequest._id, 'declined')] || feedback[actionKey(liveRequest._id, 'accepted')]}
                      onRespond={respondToRequest}
                      currentResponse={selectedResponseFor(liveRequest._id)}
                      isResponseLoading={Boolean(responseLoading[liveRequest._id])}
                      onWithdraw={withdrawResponse}
                    />
                  </View>
                </ThemedView>
              )}

              <ThemedText type="subtitle" style={styles.feedHeading}>Notification Broadcast Feed</ThemedText>
              <ThemedText type="small" style={styles.feedSubtitle}>Real-time alerts from the emergency request service</ThemedText>
              <View style={styles.statusStrip}>
                <ThemedText type="smallBold" style={styles.statusStripText}>● Live API feed</ThemedText>
                <ThemedText type="smallBold" style={styles.statusStripText}>● Open requests only</ThemedText>
              </View>
              <View style={styles.searchBox}>
                <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} tintColor={colors.muted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search alerts, hospitals, or blood groups..."
                  placeholderTextColor="#B29BA2"
                  style={styles.searchInput}
                  accessibilityLabel="Search emergency alerts"
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {([
                  ['all', 'All Alerts'],
                  ['critical', 'Critical Code-Red'],
                  ['verified', 'Hospital Verified'],
                ] as const).map(([value, label]) => {
                  const isDisabled = value === 'verified';
                  const isSelected = filter === value;
                  return (
                    <Pressable
                      key={value}
                      disabled={isDisabled}
                      onPress={() => setFilter(value)}
                      style={[styles.filterButton, isSelected && styles.selectedFilter, value === 'critical' && styles.criticalFilter, isDisabled && styles.disabledFilter]}>
                      {value === 'critical' && <View style={styles.filterDot} />}
                      <ThemedText type="small" style={[styles.filterText, isSelected && styles.selectedFilterText, isDisabled && styles.disabledFilterText]}>
                        {label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.stateContainer}><ActivityIndicator color={colors.red} /><ThemedText type="small" style={styles.mutedText}>Loading emergency requests...</ThemedText></View>
            ) : errorMessage ? (
              <View style={styles.stateContainer}><ThemedText type="small" style={styles.errorMessage}>{errorMessage}</ThemedText><Pressable onPress={() => void loadRequests()} style={styles.retryButton}><ThemedText style={styles.retryText}>Try again</ThemedText></Pressable></View>
            ) : (
              <View style={styles.stateContainer}><ThemedText type="smallBold" style={styles.emptyTitle}>No emergency requests found</ThemedText><ThemedText type="small" style={styles.mutedText}>Refresh the feed or change the current filter.</ThemedText></View>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  safeArea: { flex: 1 },
  listContent: { gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: 110 },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  headerIconButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 30 },
  headerTitleBlock: { flex: 1 },
  heading: { color: colors.red, fontSize: 22, lineHeight: 28 },
  liveHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.two },
  liveTitleRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  liveTitle: { color: colors.ink, fontSize: 20, lineHeight: 26 },
  demoChip: { backgroundColor: '#DCE8FF', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8 },
  demoText: { color: '#4A4E63', fontSize: 11, fontWeight: '800', lineHeight: 13 },
  liveCard: { backgroundColor: '#FFF7F8', borderColor: '#F2B5C0', borderRadius: 12, borderWidth: 1, marginBottom: Spacing.three, padding: Spacing.two },
  liveCardInner: { borderColor: colors.red, borderRadius: 9, borderWidth: 2, overflow: 'hidden', padding: Spacing.two },
  liveMetaRow: { borderBottomColor: '#F2CBD2', borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.two, paddingBottom: Spacing.two },
  liveMetaText: { color: colors.red, fontSize: 10, letterSpacing: 0.5 },
  profileSection: { marginBottom: Spacing.two },
  profileLabel: { color: colors.ink, marginBottom: Spacing.one },
  profileRow: { gap: Spacing.one },
  profileChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  selectedProfileChip: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  profileText: { color: colors.muted, fontSize: 12 },
  selectedProfileText: { color: colors.blue, fontSize: 12 },
  feedHeading: { color: colors.ink, fontSize: 21, lineHeight: 27, marginTop: Spacing.one },
  feedSubtitle: { color: colors.muted, fontSize: 12, marginBottom: Spacing.two },
  statusStrip: { backgroundColor: colors.surface, borderColor: '#F0B7C3', borderRadius: 7, borderWidth: 1, flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.two, padding: Spacing.two },
  statusStripText: { color: colors.ink, fontSize: 11 },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#CAD4E6', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: Spacing.two, minHeight: 46, paddingHorizontal: Spacing.two, marginBottom: Spacing.two },
  searchInput: { color: colors.ink, flex: 1, fontSize: 14, minHeight: 44 },
  filterRow: { gap: Spacing.one, paddingBottom: Spacing.two },
  filterButton: { backgroundColor: colors.surface, borderColor: '#DFE4ED', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  selectedFilter: { backgroundColor: colors.red, borderColor: colors.red },
  criticalFilter: { backgroundColor: '#EAF1FF' },
  filterDot: { backgroundColor: colors.red, borderRadius: 5, height: 9, width: 9 },
  filterText: { color: colors.muted, fontSize: 12 },
  selectedFilterText: { color: colors.surface },
  disabledFilter: { opacity: 0.45 },
  disabledFilterText: { textDecorationLine: 'line-through' },
  limitNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: Spacing.one },
  requestCard: { borderColor: colors.border, borderRadius: 9, borderWidth: 1, gap: Spacing.two, padding: Spacing.three },
  criticalCard: { borderLeftColor: colors.red, borderLeftWidth: 4 },
  standardCard: { borderLeftColor: colors.blue, borderLeftWidth: 4 },
  requestTopRow: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.two },
  requestBloodBadge: { alignItems: 'center', backgroundColor: '#E7EEF9', borderColor: '#B7C9E5', borderRadius: 7, borderWidth: 1, minWidth: 49, paddingHorizontal: 7, paddingVertical: 8 },
  requestBloodText: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  requestTitleBlock: { flex: 1, gap: Spacing.one },
  requestTitle: { color: '#F8FAFC', fontSize: 18, lineHeight: 23 },
  urgencyChip: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  criticalChip: { backgroundColor: colors.redSoft },
  standardChip: { backgroundColor: colors.blueSoft },
  urgencyText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  criticalText: { color: colors.red },
  standardText: { color: colors.blue },
  hospitalText: { color: '#F1F5F9', fontSize: 15, fontWeight: '600' },
  requestDetails: { color: '#D5DCE8', fontSize: 14, lineHeight: 21 },
  metaRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  metaLocation: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  metaText: { color: '#C3CCD9', fontSize: 11 },
  metaSeparator: { color: '#B8A5AD' },
  successMessage: { color: '#86EFAC', fontWeight: '700' },
  errorMessage: { color: '#FDA4AF', fontSize: 12, lineHeight: 17 },
  responseState: { alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: 7, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.two, paddingVertical: 8 },
  responseStateTitle: { color: colors.green, fontSize: 12 },
  withdrawText: { color: colors.red, fontSize: 12 },
  actionRow: { gap: Spacing.two },
  primaryAction: { alignItems: 'center', backgroundColor: colors.red, borderRadius: 9, flexDirection: 'row', gap: Spacing.one, justifyContent: 'center', minHeight: 45, paddingHorizontal: Spacing.two },
  primaryActionText: { color: colors.surface, fontWeight: '800' },
  secondaryAction: { alignItems: 'center', borderColor: '#D5AAB6', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: Spacing.one, justifyContent: 'center', minHeight: 43 },
  secondaryActionText: { color: '#F8FAFC', fontWeight: '700' },
  disabledAction: { opacity: 0.6 },
  pressed: { opacity: 0.75 },
  stateContainer: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  mutedText: { color: '#C3CCD9', textAlign: 'center' },
  emptyTitle: { color: colors.ink },
  retryButton: { backgroundColor: colors.red, borderRadius: 9, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  retryText: { color: colors.surface, fontWeight: '800' },
});
