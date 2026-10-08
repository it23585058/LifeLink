import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Reservation,
  reservationApi,
} from '@/lib/hospitalApi';
import { getDemoSession } from '@/lib/demoSession';
import { usePolledResource } from '@/hooks/usePolledResource';
import { AppIcon } from '@/components/blood-banks/AppIcon';
import { StatusPill } from '@/components/blood-banks/StatusPill';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/blood-banks/StateViews';

export default function MyReservationsScreen() {
  const router = useRouter();
  const session = getDemoSession();
  const [actingId, setActingId] = useState<string | null>(null);

  // Confirmation dialog modal state (cross-platform, reliable on web + mobile)
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => Promise<void>;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: async () => {},
  });

  const {
    data: reservations,
    loading,
    refreshing,
    error,
    refresh,
  } = usePolledResource<Reservation[]>(
    () => reservationApi.list({ reservedBy: session.userId }),
    20_000,
    []
  );

  const handleCancelReservation = (reservation: Reservation) => {
    setConfirmModal({
      visible: true,
      title: 'Cancel Reservation?',
      message: `Are you sure you want to cancel your reservation for ${reservation.units} unit(s) of ${reservation.bloodGroup} blood? The reserved units will be returned to the hospital's available stock.`,
      confirmText: 'Yes, Cancel Reservation',
      onConfirm: async () => {
        setActingId(reservation._id);
        try {
          await reservationApi.updateStatus(reservation._id, 'cancelled');
          await refresh();
        } catch (err: any) {
          Alert.alert(
            'Cancellation Failed',
            err?.response?.data?.error || 'Could not cancel reservation.'
          );
        } finally {
          setActingId(null);
          setConfirmModal((prev) => ({ ...prev, visible: false }));
        }
      },
    });
  };

  const handleRemoveRecord = (reservation: Reservation) => {
    setConfirmModal({
      visible: true,
      title: 'Remove Record?',
      message:
        'This will permanently remove this completed or cancelled reservation from your personal history.',
      confirmText: 'Remove Record',
      onConfirm: async () => {
        setActingId(reservation._id);
        try {
          await reservationApi.delete(reservation._id);
          await refresh();
        } catch (err: any) {
          Alert.alert(
            'Delete Failed',
            err?.response?.data?.error || 'Could not delete record.'
          );
        } finally {
          setActingId(null);
          setConfirmModal((prev) => ({ ...prev, visible: false }));
        }
      },
    });
  };

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
        <Text style={styles.headerTitle}>My Reservations</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <FlatList
        data={reservations || []}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#E7194F']}
            tintColor="#E7194F"
          />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const hospitalName =
            typeof item.hospital === 'string'
              ? 'Hospital Facility'
              : item.hospital?.name || 'Hospital Facility';

          const hospitalPhone =
            typeof item.hospital === 'object' && item.hospital?.phone
              ? item.hospital.phone
              : null;

          const isPending = item.status === 'pending';
          const isBusy = actingId === item._id;

          return (
            <View style={styles.reservationCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>{item.bloodGroup}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.hospitalName} numberOfLines={1}>
                    {hospitalName}
                  </Text>
                  <Text style={styles.unitsSubtitle}>
                    {item.units} Unit{item.units > 1 ? 's' : ''} •{' '}
                    {item.component === 'whole_blood'
                      ? 'Whole Blood'
                      : item.component.toUpperCase()}
                  </Text>
                </View>
                <StatusPill
                  variant={
                    item.status === 'pending'
                      ? 'low'
                      : item.status === 'collected'
                      ? 'available'
                      : 'cancelled'
                  }
                  customLabel={
                    item.status === 'pending'
                      ? 'Pending'
                      : item.status === 'collected'
                      ? 'Collected'
                      : 'Cancelled'
                  }
                />
              </View>

              {item.createdAt && (
                <View style={styles.timeRow}>
                  <AppIcon name="clock" size={13} tintColor="#6E7180" />
                  <Text style={styles.timeText}>
                    Reserved on {new Date(item.createdAt).toLocaleDateString()} at{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}

              {item.note && (
                <Text style={styles.noteText}>Note: {item.note}</Text>
              )}

              <View style={styles.cardActionsRow}>
                {hospitalPhone && (
                  <Text style={styles.contactHint}>
                    Contact: {hospitalPhone}
                  </Text>
                )}

                <View style={styles.buttonGroup}>
                  {isPending ? (
                    <Pressable
                      style={[styles.cancelBtn, isBusy && styles.btnDisabled]}
                      onPress={() => handleCancelReservation(item)}
                      disabled={isBusy}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel reservation and restore stock"
                    >
                      <Text style={styles.cancelBtnText}>
                        {isBusy ? 'Processing...' : 'Cancel'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.removeBtn, isBusy && styles.btnDisabled]}
                      onPress={() => handleRemoveRecord(item)}
                      disabled={isBusy}
                      accessibilityRole="button"
                      accessibilityLabel="Remove historical record"
                    >
                      <Text style={styles.removeBtnText}>
                        {isBusy ? 'Removing...' : 'Remove'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <LoadingView message="Loading your blood unit reservations..." />
          ) : error ? (
            <ErrorView message={error} onRetry={refresh} />
          ) : (
            <EmptyView
              title="No Reservations Found"
              message="You haven't reserved any blood units yet. Browse verified blood banks to place a reservation."
              onReset={() => router.push('/blood-banks' as any)}
            />
          )
        }
      />

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setConfirmModal((prev) => ({ ...prev, visible: false }))
        }
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() =>
            setConfirmModal((prev) => ({ ...prev, visible: false }))
          }
        >
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{confirmModal.title}</Text>
            <Text style={styles.confirmMessage}>{confirmModal.message}</Text>
            <View style={styles.confirmActionsRow}>
              <Pressable
                style={styles.dialogCancelBtn}
                onPress={() =>
                  setConfirmModal((prev) => ({ ...prev, visible: false }))
                }
              >
                <Text style={styles.dialogCancelText}>Back</Text>
              </Pressable>
              <Pressable
                style={styles.dialogActionBtn}
                onPress={confirmModal.onConfirm}
              >
                <Text style={styles.dialogActionText}>
                  {confirmModal.confirmText}
                </Text>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
    flex: 1,
  },
  headerRightSpacer: {
    width: 44,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    shadowColor: '#14253B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFE7EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E7194F',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14253B',
  },
  unitsSubtitle: {
    fontSize: 12,
    color: '#6E7180',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 11,
    color: '#6E7180',
  },
  noteText: {
    fontSize: 12,
    color: '#14253B',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
  },
  contactHint: {
    fontSize: 11,
    color: '#6E7180',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  cancelBtn: {
    backgroundColor: '#FFE7EE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#E7194F',
    fontWeight: '700',
    fontSize: 13,
  },
  removeBtn: {
    backgroundColor: '#F0F0F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#6E7180',
    fontWeight: '700',
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 37, 59, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 13,
    color: '#6E7180',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dialogCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dialogCancelText: {
    color: '#6E7180',
    fontWeight: '700',
    fontSize: 14,
  },
  dialogActionBtn: {
    backgroundColor: '#E7194F',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  dialogActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
