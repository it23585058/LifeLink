import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Transfer,
  transferApi,
} from '@/lib/hospitalApi';
import {
  DemoRole,
  getDemoSession,
  subscribeDemoSession,
} from '@/lib/demoSession';
import { usePolledResource } from '@/hooks/usePolledResource';
import { AppIcon } from '@/components/blood-banks/AppIcon';
import { TransferTimeline } from '@/components/blood-banks/TransferTimeline';
import {
  ErrorView,
  LoadingView,
} from '@/components/blood-banks/StateViews';

export default function TransferCoordinationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [demoRole, setRoleState] = useState<DemoRole>(getDemoSession().role);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  // Cancellation modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  useEffect(() => {
    return subscribeDemoSession((s) => {
      setRoleState(s.role);
    });
  }, []);

  const isStaff = demoRole === 'hospital_staff';

  const {
    data: transfer,
    loading,
    refreshing,
    error,
    refresh,
  } = usePolledResource<Transfer>(
    () => transferApi.getById(id as string),
    10_000,
    [id]
  );

  const handleArrivalPing = async () => {
    if (!transfer) return;
    setSubmittingAction('arrival');
    try {
      await transferApi.updateStatus(
        transfer._id,
        'arrived_at_gate',
        "I've arrived at main gate (#GT-881 barrier lift)"
      );
      await refresh();
    } catch (err: any) {
      Alert.alert(
        'Action Failed',
        err?.response?.data?.error || 'Could not update transfer status.'
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleDelayPing = async () => {
    if (!transfer) return;
    setSubmittingAction('delay');
    try {
      const nextEta = transfer.etaMinutes + 5;
      await transferApi.updateEta(
        transfer._id,
        nextEta,
        'Traffic delay (+5 mins)'
      );
      await refresh();
    } catch (err: any) {
      Alert.alert(
        'Action Failed',
        err?.response?.data?.error || 'Could not update ETA.'
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleAdvanceToTriage = async () => {
    if (!transfer) return;
    setSubmittingAction('triage');
    try {
      await transferApi.updateStatus(
        transfer._id,
        'triage_crossmatch',
        'Donor checked in at Ward Triage & Crossmatch'
      );
      await refresh();
    } catch (err: any) {
      Alert.alert(
        'Status Update Failed',
        err?.response?.data?.error || 'Could not advance to triage.'
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleCompleteTransfusion = async () => {
    if (!transfer) return;
    setSubmittingAction('complete');
    try {
      await transferApi.updateStatus(
        transfer._id,
        'completed',
        'Transfusion Complete & Verified'
      );
      await refresh();
    } catch (err: any) {
      Alert.alert(
        'Completion Failed',
        err?.response?.data?.error || 'Could not complete transfer.'
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!transfer) return;
    setSubmittingAction('cancel');
    setCancelModalVisible(false);
    try {
      await transferApi.updateStatus(
        transfer._id,
        'cancelled',
        'Transfer cancelled by hospital staff'
      );
      await refresh();
    } catch (err: any) {
      Alert.alert(
        'Cancellation Failed',
        err?.response?.data?.error || 'Could not cancel transfer.'
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  if (loading && !transfer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading transfer telemetry..." />
      </SafeAreaView>
    );
  }

  if (error || !transfer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          message={error || 'Transfer case not found.'}
          onRetry={refresh}
        />
      </SafeAreaView>
    );
  }

  const hospitalObj =
    typeof transfer.hospital === 'object' ? transfer.hospital : null;
  const hospitalName = hospitalObj?.name || 'Colombo General Hospital';
  const hospitalPhone = hospitalObj?.phone || '+94 11 269 1111';
  const wardExtension = hospitalObj?.wardExtension || 'EXT 412';

  const isTerminal =
    transfer.status === 'completed' || transfer.status === 'cancelled';
  const isAtGate = transfer.status === 'arrived_at_gate';
  const isInTriage = transfer.status === 'triage_crossmatch';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="back" size={22} tintColor="#14253B" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Transfer Coordination</Text>
            <View
              style={[
                styles.statusChip,
                isTerminal && styles.statusChipTerminal,
              ]}
            >
              <View
                style={[
                  styles.statusChipDot,
                  isTerminal && styles.statusChipDotTerminal,
                ]}
              />
              <Text
                style={[
                  styles.statusChipText,
                  isTerminal && styles.statusChipTextTerminal,
                ]}
              >
                {transfer.status === 'completed'
                  ? 'Completed'
                  : transfer.status === 'cancelled'
                  ? 'Cancelled'
                  : 'In Transit'}
              </Text>
            </View>
          </View>
          <Text style={styles.caseIdText}>Case ID: #{transfer.caseCode}</Text>
        </View>

        <View style={styles.redCrossIcon}>
          <AppIcon name="drop" size={22} tintColor="#E7194F" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#E7194F']}
            tintColor="#E7194F"
          />
        }
      >
        {/* Hospital Ward Line Card */}
        <View style={styles.hospitalTopCard}>
          <View style={styles.hospitalRow}>
            <AppIcon name="hospital" size={18} tintColor="#0878A8" />
            <Text style={styles.hospitalText} numberOfLines={1}>
              {hospitalName} {transfer.ward ? `— ${transfer.ward}` : ''}
            </Text>
          </View>
          <View style={styles.attendingRow}>
            <Text style={styles.attendingLabel}>
              Attending: {transfer.attendingStaff || 'Dr. Samantha W.'}
            </Text>
            <View style={styles.onDeckRow}>
              <View style={styles.greenOnDeckDot} />
              <Text style={styles.onDeckText}>ON-DECK</Text>
            </View>
          </View>
        </View>

        {/* Donor Card */}
        <View style={styles.donorCard}>
          <View style={styles.donorMainRow}>
            {/* Blood Type Badge */}
            <View style={styles.bloodTypeBox}>
              <Text style={styles.bloodTypeText}>{transfer.bloodGroup}</Text>
              <Text style={styles.bloodComponentText}>
                {transfer.component === 'whole_blood' ? 'PRBC' : 'PLT'}
              </Text>
            </View>

            {/* Donor Information */}
            <View style={styles.donorInfoCol}>
              <View style={styles.donorNameRow}>
                <Text style={styles.donorName}>{transfer.donorName}</Text>
                <View style={styles.verifiedDonorBadge}>
                  <AppIcon name="check" size={11} tintColor="#0878A8" />
                  <Text style={styles.verifiedDonorText}>Verified Donor</Text>
                </View>
              </View>

              {/* Transit & ETA row */}
              <View style={styles.etaRow}>
                <AppIcon name="location" size={13} tintColor="#E7194F" />
                <Text style={styles.distanceText}>1.2 km away</Text>
                <Text style={styles.bulletSep}>•</Text>
                <Text style={styles.etaHighlight}>
                  ETA: {transfer.etaMinutes} mins
                </Text>
                <Text style={styles.bulletSep}>•</Text>
                <Text style={styles.transitModeText}>Direct Transit</Text>
              </View>

              <Text style={styles.vehicleText} numberOfLines={1}>
                Vehicle: {transfer.vehicleInfo || 'White Prius (WP-CAB-4912) • Security Pre-Cleared'}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.donorActionsRow}>
            <Pressable
              style={styles.emergencyCallBtn}
              onPress={() => Linking.openURL(`tel:${hospitalPhone}`)}
              accessibilityRole="button"
              accessibilityLabel="Emergency call to hospital"
            >
              <AppIcon name="phone" size={16} tintColor="#14253B" />
              <Text style={styles.emergencyCallText}>Emergency Call</Text>
            </Pressable>
          </View>
        </View>

        {/* Clinical Transfer Chain Timeline */}
        <TransferTimeline currentStatus={transfer.status} />

        {/* Quick-Action Coordinate Pings */}
        {!isTerminal && (
          <View style={styles.quickActionsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.quickSectionTitle}>
                Quick-Action Coordinate Pings
              </Text>
              <Text style={styles.rapidResponseBadge}>Sub-5s Rapid Response</Text>
            </View>

            {/* Ping 1: Arrived at Main Gate */}
            <Pressable
              style={[
                styles.pingCard,
                isAtGate && styles.pingCardDisabled,
              ]}
              onPress={handleArrivalPing}
              disabled={isAtGate || submittingAction === 'arrival'}
              accessibilityRole="button"
              accessibilityLabel="I've arrived at main gate"
            >
              <View style={styles.pingIconWrap}>
                <AppIcon name="hospital" size={18} tintColor="#0878A8" />
              </View>
              <View style={styles.pingTextCol}>
                <View style={styles.pingTitleRow}>
                  <Text style={styles.pingTitle}>I've Arrived at Main Gate</Text>
                  <View style={styles.gateTag}>
                    <Text style={styles.gateTagText}>#GT-881</Text>
                  </View>
                </View>
                <Text style={styles.pingDesc}>
                  Sends automated beep to Guardhouse 2 for gate barrier lift.
                </Text>
              </View>
            </Pressable>

            {/* Ping 2: Traffic Delay */}
            <Pressable
              style={styles.pingCard}
              onPress={handleDelayPing}
              disabled={submittingAction === 'delay'}
              accessibilityRole="button"
              accessibilityLabel="Traffic delay plus 5 minutes"
            >
              <View style={[styles.pingIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <AppIcon name="clock" size={18} tintColor="#D97706" />
              </View>
              <View style={styles.pingTextCol}>
                <View style={styles.pingTitleRow}>
                  <Text style={styles.pingTitle}>Traffic Delay (+5 mins)</Text>
                  <View style={[styles.gateTag, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.gateTagText, { color: '#D97706' }]}>+5m</Text>
                  </View>
                </View>
                <Text style={styles.pingDesc}>
                  Alerts triage lab to pause anticoagulant preparation.
                </Text>
              </View>
            </Pressable>

            {/* Ping 3: Direct Line to Ward Sister */}
            <Pressable
              style={styles.pingCard}
              onPress={() => Linking.openURL(`tel:${hospitalPhone}`)}
              accessibilityRole="button"
              accessibilityLabel="Direct line to ward sister"
            >
              <View style={[styles.pingIconWrap, { backgroundColor: '#D9F8E7' }]}>
                <AppIcon name="phone" size={18} tintColor="#087A3E" />
              </View>
              <View style={styles.pingTextCol}>
                <View style={styles.pingTitleRow}>
                  <Text style={styles.pingTitle}>Direct Line to Ward Sister</Text>
                  <View style={[styles.gateTag, { backgroundColor: '#D9F8E7' }]}>
                    <Text style={[styles.gateTagText, { color: '#087A3E' }]}>
                      {wardExtension}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pingDesc}>
                  Priority intercom bridge directly to Ward 4 lead nurse.
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Event & Activity Audit Log */}
        <View style={styles.auditSection}>
          <View style={styles.auditHeaderRow}>
            <View style={styles.auditTitleLeft}>
              <AppIcon name="clock" size={16} tintColor="#0878A8" />
              <Text style={styles.auditTitle}>Event & Activity Audit Log</Text>
            </View>
            <Text style={styles.auditSubtitle}>Immutable Clinical Trail</Text>
          </View>

          <View style={styles.auditList}>
            {transfer.events.map((event, idx) => {
              const isLast = idx === transfer.events.length - 1;
              const atDate = event.at ? new Date(event.at) : new Date();
              const timeFormatted = atDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <View key={idx} style={styles.auditRow}>
                  <View style={styles.auditDotCol}>
                    <View
                      style={[
                        styles.auditDot,
                        idx === 0 && { backgroundColor: '#087A3E' },
                        idx === 1 && { backgroundColor: '#0878A8' },
                        idx === 2 && { backgroundColor: '#E7194F' },
                        idx >= 3 && { backgroundColor: '#D97706' },
                      ]}
                    />
                    {!isLast && <View style={styles.auditLine} />}
                  </View>

                  <View style={styles.auditDetailsCol}>
                    <View style={styles.auditItemHeader}>
                      <Text style={styles.auditLabel}>{event.label}</Text>
                      <Text style={styles.auditTime}>{timeFormatted}</Text>
                    </View>
                    <Text style={styles.auditBy}>
                      Logged by {event.by || 'System'} • {event.kind || 'clinical_trail'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Primary Progression Actions */}
        {!isTerminal && (
          <View style={styles.bottomActionsArea}>
            {!isInTriage ? (
              <Pressable
                style={[
                  styles.primaryProgressBtn,
                  submittingAction === 'triage' && styles.btnDisabled,
                ]}
                onPress={handleAdvanceToTriage}
                disabled={submittingAction === 'triage'}
                accessibilityRole="button"
                accessibilityLabel="Confirm donor check-in at triage"
              >
                <AppIcon name="check" size={18} tintColor="#FFFFFF" />
                <Text style={styles.primaryProgressBtnText}>
                  Confirm Donor Check-in at Ward 4 Triage
                </Text>
              </Pressable>
            ) : isStaff ? (
              <Pressable
                style={[
                  styles.primaryProgressBtn,
                  { backgroundColor: '#087A3E' },
                  submittingAction === 'complete' && styles.btnDisabled,
                ]}
                onPress={handleCompleteTransfusion}
                disabled={submittingAction === 'complete'}
                accessibilityRole="button"
                accessibilityLabel="Mark transfusion complete"
              >
                <AppIcon name="check" size={18} tintColor="#FFFFFF" />
                <Text style={styles.primaryProgressBtnText}>
                  Mark Transfusion Complete
                </Text>
              </Pressable>
            ) : (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  Donor is currently in Triage & Serology Crossmatch. Transfusion completion will be confirmed by Ward Staff.
                </Text>
              </View>
            )}

            {isStaff && (
              <Pressable
                style={styles.cancelTransferBtn}
                onPress={() => setCancelModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Cancel this transfer"
              >
                <Text style={styles.cancelTransferText}>Cancel Transfer</Text>
              </Pressable>
            )}
          </View>
        )}

        {isTerminal && (
          <View style={styles.terminalNotice}>
            <AppIcon
              name={transfer.status === 'completed' ? 'check' : 'close'}
              size={20}
              tintColor={transfer.status === 'completed' ? '#087A3E' : '#6E7180'}
            />
            <Text style={styles.terminalNoticeText}>
              {transfer.status === 'completed'
                ? 'Clinical transfer and blood transfusion successfully completed.'
                : 'This clinical transfer case was cancelled.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cancellation Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCancelModalVisible(false)}
        >
          <View style={styles.confirmDialog}>
            <Text style={styles.dialogTitle}>Cancel Transfer Case?</Text>
            <Text style={styles.dialogMsg}>
              Are you sure you want to abort clinical transfer #{transfer.caseCode}? This action cannot be reversed.
            </Text>
            <View style={styles.dialogBtns}>
              <Pressable
                style={styles.dialogCancel}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Back</Text>
              </Pressable>
              <Pressable
                style={styles.dialogAbort}
                onPress={handleConfirmCancel}
              >
                <Text style={styles.dialogAbortText}>Confirm Cancellation</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5EC',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14253B',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusChipTerminal: {
    backgroundColor: '#F0F0F3',
  },
  statusChipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D97706',
  },
  statusChipDotTerminal: {
    backgroundColor: '#6E7180',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  statusChipTextTerminal: {
    color: '#6E7180',
  },
  caseIdText: {
    fontSize: 12,
    color: '#6E7180',
    marginTop: 2,
  },
  redCrossIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  hospitalTopCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  hospitalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    flex: 1,
  },
  attendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 26,
  },
  attendingLabel: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  onDeckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenOnDeckDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#087A3E',
  },
  onDeckText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#087A3E',
  },
  donorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    marginBottom: 14,
  },
  donorMainRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  bloodTypeBox: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#E7194F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bloodComponentText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  donorInfoCol: {
    flex: 1,
  },
  donorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14253B',
  },
  verifiedDonorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  verifiedDonorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0878A8',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 11,
    color: '#6E7180',
    fontWeight: '600',
  },
  bulletSep: {
    fontSize: 10,
    color: '#6E7180',
  },
  etaHighlight: {
    fontSize: 11,
    color: '#E7194F',
    fontWeight: '800',
  },
  transitModeText: {
    fontSize: 11,
    color: '#6E7180',
  },
  vehicleText: {
    fontSize: 11,
    color: '#6E7180',
  },
  donorActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emergencyCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    gap: 6,
  },
  emergencyCallText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14253B',
  },
  quickActionsSection: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#14253B',
    letterSpacing: 0.5,
  },
  rapidResponseBadge: {
    fontSize: 10,
    color: '#6E7180',
    fontWeight: '600',
  },
  pingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    gap: 12,
  },
  pingCardDisabled: {
    opacity: 0.5,
  },
  pingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingTextCol: {
    flex: 1,
  },
  pingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  pingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14253B',
  },
  gateTag: {
    backgroundColor: '#E6F4FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  gateTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0878A8',
  },
  pingDesc: {
    fontSize: 11,
    color: '#6E7180',
    lineHeight: 15,
  },
  auditSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    marginBottom: 16,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  auditTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14253B',
  },
  auditSubtitle: {
    fontSize: 10,
    color: '#6E7180',
    fontWeight: '600',
  },
  auditList: {
    paddingLeft: 4,
  },
  auditRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  auditDotCol: {
    alignItems: 'center',
    width: 20,
  },
  auditDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#087A3E',
  },
  auditLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E5EC',
    marginVertical: 2,
  },
  auditDetailsCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 10,
  },
  auditItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  auditLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14253B',
    flex: 1,
    paddingRight: 8,
  },
  auditTime: {
    fontSize: 10,
    color: '#6E7180',
    fontWeight: '500',
  },
  auditBy: {
    fontSize: 11,
    color: '#6E7180',
  },
  bottomActionsArea: {
    marginTop: 8,
    gap: 12,
  },
  primaryProgressBtn: {
    backgroundColor: '#E7194F',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryProgressBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelTransferBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTransferText: {
    color: '#E7194F',
    fontWeight: '700',
    fontSize: 14,
  },
  terminalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    gap: 10,
    marginTop: 8,
  },
  terminalNoticeText: {
    fontSize: 13,
    color: '#14253B',
    fontWeight: '600',
    flex: 1,
  },
  infoBox: {
    backgroundColor: '#E6F4FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoBoxText: {
    fontSize: 12,
    color: '#0878A8',
    textAlign: 'center',
    lineHeight: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 37, 59, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
    marginBottom: 8,
  },
  dialogMsg: {
    fontSize: 13,
    color: '#6E7180',
    lineHeight: 18,
    marginBottom: 20,
  },
  dialogBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dialogCancelText: {
    color: '#6E7180',
    fontWeight: '700',
    fontSize: 14,
  },
  dialogAbort: {
    backgroundColor: '#E7194F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dialogAbortText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
