import React, { useEffect, useState } from 'react';
import {
  Linking,
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
  Hospital,
  hospitalApi,
} from '@/lib/hospitalApi';
import {
  DemoRole,
  getDemoSession,
  subscribeDemoSession,
} from '@/lib/demoSession';
import { usePolledResource } from '@/hooks/usePolledResource';
import { AppIcon } from '@/components/blood-banks/AppIcon';
import { StatusPill } from '@/components/blood-banks/StatusPill';
import { StockTile } from '@/components/blood-banks/StockTile';
import { ReserveSheet } from '@/components/blood-banks/ReserveSheet';
import {
  ErrorView,
  LoadingView,
} from '@/components/blood-banks/StateViews';

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showReserveSheet, setShowReserveSheet] = useState(false);
  const [demoRole, setRoleState] = useState<DemoRole>(getDemoSession().role);

  useEffect(() => {
    return subscribeDemoSession((s) => {
      setRoleState(s.role);
    });
  }, []);

  const {
    data: hospital,
    loading,
    refreshing,
    error,
    refresh,
  } = usePolledResource<Hospital>(
    () => hospitalApi.getById(id as string),
    15_000,
    [id]
  );

  const isStaff = demoRole === 'hospital_staff';

  if (loading && !hospital) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading facility details..." />
      </SafeAreaView>
    );
  }

  if (error || !hospital) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          message={error || 'Facility not found.'}
          onRetry={refresh}
        />
      </SafeAreaView>
    );
  }

  const isNbts = hospital.accreditation === 'nbts_accredited';
  const isVerified = hospital.accreditation === 'hospital_verified';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="back" size={22} tintColor="#14253B" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Facility Overview
        </Text>
        <Pressable
          style={styles.reservationsBtn}
          onPress={() => router.push('/blood-banks/reservations' as any)}
          accessibilityRole="button"
          accessibilityLabel="My Reservations"
        >
          <AppIcon name="calendar" size={18} tintColor="#0878A8" />
        </Pressable>
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
        {/* Main Info Card */}
        <View style={styles.facilityCard}>
          <View style={styles.badgeRow}>
            {isNbts ? (
              <StatusPill variant="nbts" customLabel="NBTS Accredited" />
            ) : isVerified ? (
              <StatusPill variant="verified" customLabel="Hospital Verified" />
            ) : (
              <StatusPill variant="neutral" customLabel="Unverified" />
            )}
            {hospital.distanceKm != null && (
              <View style={styles.distBadge}>
                <AppIcon name="location" size={13} tintColor="#6E7180" />
                <Text style={styles.distText}>{hospital.distanceKm} km away</Text>
              </View>
            )}
          </View>

          <Text style={styles.hospitalName}>{hospital.name}</Text>
          <Text style={styles.addressText}>{hospital.address}, {hospital.city}</Text>

          {hospital.phone && (
            <View style={styles.contactRow}>
              <AppIcon name="phone" size={14} tintColor="#0878A8" />
              <Text style={styles.phoneText}>
                {hospital.phone} {hospital.wardExtension ? `(${hospital.wardExtension})` : ''}
              </Text>
            </View>
          )}

          {/* Quick Contact Buttons */}
          <View style={styles.actionBtnRow}>
            <Pressable
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${hospital.phone}`)}
              accessibilityRole="button"
              accessibilityLabel="Call hospital phone"
            >
              <AppIcon name="phone" size={16} tintColor="#14253B" />
              <Text style={styles.contactBtnText}>Call Facility</Text>
            </Pressable>

            {hospital.portalUrl && (
              <Pressable
                style={[styles.contactBtn, styles.portalBtn]}
                onPress={() => Linking.openURL(hospital.portalUrl!)}
                accessibilityRole="button"
                accessibilityLabel="Open hospital portal"
              >
                <AppIcon name="portal" size={16} tintColor="#FFFFFF" />
                <Text style={styles.portalBtnText}>Online Portal</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Staff Management Panel */}
        {isStaff && (
          <View style={styles.staffCard}>
            <View style={styles.staffHeaderRow}>
              <View style={styles.staffTag}>
                <Text style={styles.staffTagText}>HOSPITAL STAFF ACTION</Text>
              </View>
            </View>
            <Text style={styles.staffCardTitle}>Facility Inventory & Transfers</Text>
            <View style={styles.staffBtnRow}>
              <Pressable
                style={styles.manageStockBtn}
                onPress={() => router.push(`/blood-banks/manage/${hospital._id}` as any)}
                accessibilityRole="button"
                accessibilityLabel="Manage Stock"
              >
                <AppIcon name="plus" size={16} tintColor="#FFFFFF" />
                <Text style={styles.manageStockBtnText}>Manage Stock</Text>
              </Pressable>

              <Pressable
                style={styles.startTransferBtn}
                onPress={() =>
                  router.push(`/transfers/new?hospital=${hospital._id}` as any)
                }
                accessibilityRole="button"
                accessibilityLabel="Start Transfer"
              >
                <AppIcon name="truck" size={16} tintColor="#FFFFFF" />
                <Text style={styles.startTransferBtnText}>Start Transfer</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Live Blood Inventory Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Full Blood Inventory</Text>
            <Text style={styles.sectionSub}>Total: {hospital.totalUnits} Units</Text>
          </View>

          {hospital.stock.length === 0 ? (
            <Text style={styles.emptyStockText}>
              No stock entries recorded for this facility.
            </Text>
          ) : (
            <View style={styles.stockGrid}>
              {hospital.stock.map((item) => (
                <View key={item._id} style={styles.stockCol}>
                  <StockTile item={item} />
                </View>
              ))}
            </View>
          )}

          {/* Reserve Primary Button */}
          <Pressable
            style={styles.reservePrimaryBtn}
            onPress={() => setShowReserveSheet(true)}
            accessibilityRole="button"
            accessibilityLabel="Reserve blood units at this facility"
          >
            <AppIcon name="reserve" size={18} tintColor="#FFFFFF" />
            <Text style={styles.reservePrimaryBtnText}>Reserve Blood Units</Text>
          </Pressable>
        </View>

        {/* Active In-Transit Transfers */}
        {hospital.activeTransfers && hospital.activeTransfers.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Incoming Transfers</Text>
              <Text style={styles.sectionSub}>
                {hospital.activeTransfers.length} In-Transit
              </Text>
            </View>

            {hospital.activeTransfers.map((t) => (
              <Pressable
                key={t._id}
                style={styles.transferRow}
                onPress={() => router.push(`/transfers/${t._id}` as any)}
                accessibilityRole="button"
                accessibilityLabel={`View transfer ${t.caseCode} for donor ${t.donorName}`}
              >
                <View style={styles.transferIconBox}>
                  <AppIcon name="car" size={20} tintColor="#0878A8" />
                </View>
                <View style={styles.transferInfo}>
                  <View style={styles.transferCaseRow}>
                    <Text style={styles.caseCode}>{t.caseCode}</Text>
                    <StatusPill variant={t.status as any} />
                  </View>
                  <Text style={styles.transferDonor}>
                    {t.donorName} ({t.bloodGroup} • {t.units} Unit)
                  </Text>
                  <Text style={styles.transferEta}>
                    ETA: {t.etaMinutes} mins • {t.ward || 'Triage'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Reserve Sheet Modal */}
      <ReserveSheet
        visible={showReserveSheet}
        hospital={hospital}
        onClose={() => setShowReserveSheet(false)}
        onSuccess={refresh}
      />
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
    marginLeft: 4,
  },
  reservationsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  facilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distText: {
    fontSize: 12,
    color: '#6E7180',
    fontWeight: '500',
  },
  hospitalName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14253B',
    lineHeight: 26,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 13,
    color: '#6E7180',
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  phoneText: {
    fontSize: 13,
    color: '#0878A8',
    fontWeight: '600',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
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
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14253B',
  },
  portalBtn: {
    backgroundColor: '#14253B',
    borderColor: '#14253B',
  },
  portalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  staffCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  staffHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  staffTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  staffTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  staffCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  staffBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manageStockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0878A8',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    gap: 6,
  },
  manageStockBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  startTransferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#087A3E',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    gap: 6,
  },
  startTransferBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14253B',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6E7180',
    fontWeight: '600',
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  stockCol: {
    width: '48.5%',
  },
  emptyStockText: {
    color: '#6E7180',
    fontSize: 13,
    marginBottom: 16,
  },
  reservePrimaryBtn: {
    backgroundColor: '#E7194F',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reservePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  transferRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
    alignItems: 'center',
    gap: 12,
  },
  transferIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferInfo: {
    flex: 1,
  },
  transferCaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  caseCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14253B',
  },
  transferDonor: {
    fontSize: 13,
    color: '#14253B',
    fontWeight: '600',
  },
  transferEta: {
    fontSize: 11,
    color: '#6E7180',
    marginTop: 2,
  },
});
