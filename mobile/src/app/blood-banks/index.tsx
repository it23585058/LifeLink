import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  hospitalApi,
  Hospital,
  HospitalSummary,
} from '@/lib/hospitalApi';
import {
  DemoRole,
  getDemoSession,
  setDemoRole,
  subscribeDemoSession,
} from '@/lib/demoSession';
import { usePolledResource } from '@/hooks/usePolledResource';
import { AppIcon } from '@/components/blood-banks/AppIcon';
import { HospitalCard } from '@/components/blood-banks/HospitalCard';
import { ShortageBanner } from '@/components/blood-banks/ShortageBanner';
import { ReserveSheet } from '@/components/blood-banks/ReserveSheet';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/blood-banks/StateViews';

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function HospitalBloodBanksScreen() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [activeHospitalForReserve, setActiveHospitalForReserve] =
    useState<Hospital | null>(null);

  // Demo session state
  const [demoRole, setRoleState] = useState<DemoRole>(getDemoSession().role);
  const [showRolePicker, setShowRolePicker] = useState(false);

  useEffect(() => {
    return subscribeDemoSession((s) => {
      setRoleState(s.role);
    });
  }, []);

  const fetchHospitals = async () => {
    const params = selectedGroup !== 'All' ? { bloodGroup: selectedGroup } : undefined;
    return hospitalApi.list(params);
  };

  const {
    data: hospitals,
    loading,
    refreshing,
    error,
    refresh,
  } = usePolledResource<Hospital[]>(fetchHospitals, 30_000, [selectedGroup]);

  const { data: summary, refresh: refreshSummary } =
    usePolledResource<HospitalSummary>(() => hospitalApi.summary(), 30_000, []);

  const handleRefreshAll = async () => {
    await Promise.all([refresh(), refreshSummary()]);
  };

  const handleSwitchRole = (newRole: DemoRole) => {
    setDemoRole(newRole);
    setRoleState(newRole);
    setShowRolePicker(false);
  };

  // Compute newest sync time
  const latestSyncMinutes = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return 3;
    let latest = 0;
    for (const h of hospitals) {
      if (h.lastUpdatedAt) {
        const time = new Date(h.lastUpdatedAt).getTime();
        if (time > latest) latest = time;
      }
    }
    if (latest === 0) return 3;
    const diff = Math.max(1, Math.floor((Date.now() - latest) / 60000));
    return diff;
  }, [hospitals]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="back" size={22} tintColor="#14253B" />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>Hospital Blood Banks</Text>
            <View style={styles.syncStatusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.headerSubtitle}>
                Live Network • Synced {latestSyncMinutes} mins ago
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* DEV Role Chip */}
          <Pressable
            style={styles.devRoleChip}
            onPress={() => setShowRolePicker(true)}
            accessibilityRole="button"
            accessibilityLabel={`Switch demo role, currently ${demoRole}`}
          >
            <Text style={styles.devTag}>DEV</Text>
            <Text style={styles.devRoleText}>
              {demoRole === 'hospital_staff' ? 'Staff' : 'Donor'} ▾
            </Text>
          </Pressable>

          <Pressable
            style={styles.myReservationsBtn}
            onPress={() => router.push('/blood-banks/reservations' as any)}
            accessibilityRole="button"
            accessibilityLabel="My Reservations"
          >
            <AppIcon name="calendar" size={18} tintColor="#0878A8" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={hospitals || []}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefreshAll}
            colors={['#E7194F']}
            tintColor="#E7194F"
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* District Summary Card */}
            <View style={styles.districtCard}>
              <View style={styles.districtTopRow}>
                <View style={styles.districtIconWrap}>
                  <AppIcon name="location" size={20} tintColor="#0878A8" />
                </View>
                <View style={styles.districtTextWrap}>
                  <Text style={styles.districtTitle}>Colombo Metropolitan District</Text>
                  <Text style={styles.districtSubtitle}>
                    {summary ? summary.facilities : 8} Facilities Linked & Verified via NBTS Central Hub
                  </Text>
                </View>
              </View>

              {/* Filter Row */}
              <Pressable
                style={styles.filterButton}
                onPress={() => setShowFilterPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by blood group, currently ${selectedGroup}`}
              >
                <AppIcon name="filter" size={16} tintColor="#6E7180" />
                <Text style={styles.filterButtonText}>
                  Filter Blood Group: <Text style={styles.filterBold}>{selectedGroup}</Text>
                </Text>
                <Text style={styles.filterCaret}>▾</Text>
              </Pressable>
            </View>

            {/* Total Blood Reserves Card */}
            <View style={styles.reservesCard}>
              <View style={styles.reservesLeft}>
                <Text style={styles.reservesTag}>TOTAL BLOOD RESERVES</Text>
                <Text style={styles.reservesCount}>
                  {summary ? summary.totalUnits : 142} Units
                </Text>
                <Text style={styles.reservesAvailable}>
                  Available across {summary ? summary.facilities : 8} accredited facilities
                </Text>
              </View>
              <View style={styles.bloodDropIconWrap}>
                <AppIcon name="drop" size={26} tintColor="#0878A8" />
              </View>
            </View>

            {/* Critical Shortage Banner */}
            {summary && (
              <ShortageBanner shortages={summary.criticalShortages} />
            )}

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Verified Hospital Stock</Text>
              <Text style={styles.sectionSub}>Real-time blood bank availability</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <HospitalCard
            hospital={item}
            onOpenReserve={(h) => setActiveHospitalForReserve(h)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <LoadingView message="Loading verified hospital inventory..." />
          ) : error ? (
            <ErrorView message={error} onRetry={handleRefreshAll} />
          ) : (
            <EmptyView
              title="No facilities found"
              message={`No facilities currently have stock for blood group ${selectedGroup}.`}
              onReset={() => setSelectedGroup('All')}
            />
          )
        }
      />

      {/* Reserve Sheet Modal */}
      {activeHospitalForReserve && (
        <ReserveSheet
          visible={Boolean(activeHospitalForReserve)}
          hospital={activeHospitalForReserve}
          onClose={() => setActiveHospitalForReserve(null)}
          onSuccess={handleRefreshAll}
        />
      )}

      {/* Blood Group Filter Modal */}
      <Modal
        visible={showFilterPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterPicker(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowFilterPicker(false)}
        >
          <View style={styles.filterModalCard}>
            <Text style={styles.modalTitle}>Filter by Blood Group</Text>
            <View style={styles.filterGrid}>
              {BLOOD_GROUPS.map((group) => {
                const isSelected = selectedGroup === group;
                return (
                  <Pressable
                    key={group}
                    style={[
                      styles.filterGridChip,
                      isSelected && styles.filterGridChipActive,
                    ]}
                    onPress={() => {
                      setSelectedGroup(group);
                      setShowFilterPicker(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${group}`}
                  >
                    <Text
                      style={[
                        styles.filterGridText,
                        isSelected && styles.filterGridTextActive,
                      ]}
                    >
                      {group}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* DEV Role Switcher Modal */}
      <Modal
        visible={showRolePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRolePicker(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowRolePicker(false)}
        >
          <View style={styles.filterModalCard}>
            <Text style={styles.modalTitle}>Demonstration Role (DEV)</Text>
            <Text style={styles.roleSub}>
              Switch roles to evaluate donor reservations or hospital staff inventory management:
            </Text>
            <Pressable
              style={[
                styles.roleChoice,
                demoRole === 'donor' && styles.roleChoiceActive,
              ]}
              onPress={() => handleSwitchRole('donor')}
            >
              <Text style={styles.roleChoiceTitle}>Donor / Public User</Text>
              <Text style={styles.roleChoiceDesc}>
                Browse hospitals, view live stock, reserve units, cancel my reservations.
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleChoice,
                demoRole === 'hospital_staff' && styles.roleChoiceActive,
              ]}
              onPress={() => handleSwitchRole('hospital_staff')}
            >
              <Text style={styles.roleChoiceTitle}>Hospital Staff</Text>
              <Text style={styles.roleChoiceDesc}>
                Manage inventory stock (+/− units, add group, remove entry), start and coordinate transfers.
              </Text>
            </Pressable>
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
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5EC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleBlock: {
    marginLeft: 2,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E7194F',
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#087A3E',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6E7180',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devRoleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F3',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  devTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E7194F',
    backgroundColor: '#FFE7EE',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  devRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14253B',
  },
  myReservationsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  districtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E5EC',
  },
  districtTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  districtIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  districtTextWrap: {
    flex: 1,
  },
  districtTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14253B',
  },
  districtSubtitle: {
    fontSize: 12,
    color: '#6E7180',
    marginTop: 2,
    lineHeight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 13,
    color: '#6E7180',
  },
  filterBold: {
    fontWeight: '800',
    color: '#14253B',
  },
  filterCaret: {
    fontSize: 14,
    color: '#6E7180',
  },
  reservesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reservesLeft: {
    flex: 1,
  },
  reservesTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6E7180',
    letterSpacing: 0.6,
  },
  reservesCount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#14253B',
    marginVertical: 4,
  },
  reservesAvailable: {
    fontSize: 12,
    color: '#6E7180',
    fontWeight: '500',
  },
  bloodDropIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    marginTop: 18,
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6E7180',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 37, 59, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  filterModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
    marginBottom: 14,
  },
  roleSub: {
    fontSize: 13,
    color: '#6E7180',
    marginBottom: 16,
    lineHeight: 18,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterGridChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F7F8FF',
  },
  filterGridChipActive: {
    backgroundColor: '#E7194F',
    borderColor: '#E7194F',
  },
  filterGridText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14253B',
  },
  filterGridTextActive: {
    color: '#FFFFFF',
  },
  roleChoice: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    marginBottom: 10,
    backgroundColor: '#F7F8FF',
  },
  roleChoiceActive: {
    borderColor: '#0878A8',
    backgroundColor: '#E6F4FF',
  },
  roleChoiceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14253B',
    marginBottom: 4,
  },
  roleChoiceDesc: {
    fontSize: 12,
    color: '#6E7180',
    lineHeight: 16,
  },
});
