import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BloodComponent,
  Hospital,
  hospitalApi,
  inventoryApi,
  StockItem,
} from '@/lib/hospitalApi';
import {
  DemoRole,
  getDemoSession,
  setDemoRole,
  subscribeDemoSession,
} from '@/lib/demoSession';
import { usePolledResource } from '@/hooks/usePolledResource';
import { AppIcon } from '@/components/blood-banks/AppIcon';
import { StatusPill } from '@/components/blood-banks/StatusPill';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/blood-banks/StateViews';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS: { value: BloodComponent; label: string }[] = [
  { value: 'whole_blood', label: 'Whole Blood' },
  { value: 'platelets', label: 'Platelets' },
  { value: 'ffp', label: 'Fresh Frozen Plasma (FFP)' },
];

export default function ManageStockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [demoRole, setRoleState] = useState<DemoRole>(getDemoSession().role);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add stock modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroup, setNewGroup] = useState('A+');
  const [newComponent, setNewComponent] = useState<BloodComponent>('whole_blood');
  const [newUnits, setNewUnits] = useState('10');
  const [newThreshold, setNewThreshold] = useState('5');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Remove confirmation modal
  const [removeModal, setRemoveModal] = useState<{
    visible: boolean;
    item: StockItem | null;
  }>({
    visible: false,
    item: null,
  });

  useEffect(() => {
    return subscribeDemoSession((s) => {
      setRoleState(s.role);
    });
  }, []);

  const isStaff = demoRole === 'hospital_staff';

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

  const handleUpdateUnits = async (item: StockItem, delta: number) => {
    const nextUnits = Math.max(0, item.units + delta);
    setUpdatingId(item._id);
    try {
      await inventoryApi.update(item._id, { units: nextUnits });
      await refresh();
    } catch (err: any) {
      Alert.alert(
        'Update Failed',
        err?.response?.data?.error || 'Could not update inventory.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddStock = async () => {
    const unitsNum = parseInt(newUnits, 10);
    const threshNum = parseInt(newThreshold, 10);

    if (isNaN(unitsNum) || unitsNum < 0) {
      setAddError('Units must be a non-negative integer.');
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      await inventoryApi.create({
        hospital: id as string,
        bloodGroup: newGroup,
        component: newComponent,
        units: unitsNum,
        lowThreshold: isNaN(threshNum) ? 5 : threshNum,
      });
      setShowAddModal(false);
      setNewUnits('10');
      await refresh();
    } catch (err: any) {
      setAddError(
        err?.response?.data?.error ||
          'Failed to add inventory record. Please try again.'
      );
    } finally {
      setAdding(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeModal.item) return;
    const itemId = removeModal.item._id;
    setUpdatingId(itemId);
    setRemoveModal({ visible: false, item: null });
    try {
      await inventoryApi.delete(itemId);
      await refresh();
    } catch (err: any) {
      Alert.alert(
        'Removal Failed',
        err?.response?.data?.error || 'Could not remove inventory entry.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isStaff) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="back" size={22} tintColor="#14253B" />
          </Pressable>
          <Text style={styles.headerTitle}>Manage Stock</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.unauthorizedContainer}>
          <View style={styles.lockIconBox}>
            <AppIcon name="shield" size={36} tintColor="#0878A8" />
          </View>
          <Text style={styles.unauthorizedTitle}>Hospital Staff Only</Text>
          <Text style={styles.unauthorizedText}>
            Stock adjustment and inventory management require verified Hospital Staff privileges.
          </Text>

          <Pressable
            style={styles.switchRoleBtn}
            onPress={() => setDemoRole('hospital_staff')}
            accessibilityRole="button"
            accessibilityLabel="Switch to Hospital Staff demo role"
          >
            <Text style={styles.switchRoleBtnText}>
              Switch to Hospital Staff (DEV)
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Manage Blood Stock</Text>
          {hospital && (
            <Text style={styles.headerSub} numberOfLines={1}>
              {hospital.name}
            </Text>
          )}
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            setAddError(null);
            setShowAddModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Add new stock entry"
        >
          <AppIcon name="plus" size={18} tintColor="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={hospital?.stock || []}
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
        ListHeaderComponent={
          <View style={styles.guidanceBanner}>
            <AppIcon name="shield" size={18} tintColor="#0878A8" />
            <Text style={styles.guidanceText}>
              Use the +/− steppers to update live units. Setting units to 0 marks stock as out. Use &quot;Remove&quot; only to delete mistaken rows.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isBusy = updatingId === item._id;
          return (
            <View style={styles.stockRowCard}>
              <View style={styles.rowLeft}>
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>{item.bloodGroup}</Text>
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.componentName}>
                    {item.component === 'whole_blood'
                      ? 'Whole Blood'
                      : item.component === 'platelets'
                      ? 'Platelets'
                      : 'FFP'}
                  </Text>
                  <StatusPill variant={item.status} />
                </View>
              </View>

              <View style={styles.stepperContainer}>
                <Pressable
                  style={[
                    styles.stepBtn,
                    (item.units <= 0 || isBusy) && styles.stepBtnDisabled,
                  ]}
                  onPress={() => handleUpdateUnits(item, -1)}
                  disabled={item.units <= 0 || isBusy}
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${item.bloodGroup} units`}
                >
                  <AppIcon
                    name="minus"
                    size={16}
                    tintColor={item.units <= 0 || isBusy ? '#D6DDEA' : '#14253B'}
                  />
                </Pressable>

                <View style={styles.unitDisplay}>
                  <Text style={styles.unitNumber}>{item.units}</Text>
                  <Text style={styles.unitSub}>units</Text>
                </View>

                <Pressable
                  style={[styles.stepBtn, isBusy && styles.stepBtnDisabled]}
                  onPress={() => handleUpdateUnits(item, 1)}
                  disabled={isBusy}
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${item.bloodGroup} units`}
                >
                  <AppIcon
                    name="plus"
                    size={16}
                    tintColor={isBusy ? '#D6DDEA' : '#14253B'}
                  />
                </Pressable>
              </View>

              <Pressable
                style={styles.deleteRowBtn}
                onPress={() => setRemoveModal({ visible: true, item })}
                accessibilityRole="button"
                accessibilityLabel={`Remove entry for ${item.bloodGroup}`}
              >
                <AppIcon name="close" size={16} tintColor="#DC2626" />
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <LoadingView message="Loading inventory rows..." />
          ) : error ? (
            <ErrorView message={error} onRetry={refresh} />
          ) : (
            <EmptyView
              title="No Stock Records"
              message="No inventory records currently configured for this hospital."
              onReset={() => setShowAddModal(true)}
            />
          )
        }
      />

      {/* Add Stock Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowAddModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalSheetTitle}>Add Stock Record</Text>
            <Text style={styles.modalSheetSub}>
              Register an initial supply row for this facility.
            </Text>

            <Text style={styles.inputLabel}>BLOOD GROUP</Text>
            <View style={styles.groupChipsGrid}>
              {BLOOD_GROUPS.map((bg) => (
                <Pressable
                  key={bg}
                  style={[
                    styles.groupChip,
                    newGroup === bg && styles.groupChipActive,
                  ]}
                  onPress={() => setNewGroup(bg)}
                >
                  <Text
                    style={[
                      styles.groupChipText,
                      newGroup === bg && styles.groupChipTextActive,
                    ]}
                  >
                    {bg}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>COMPONENT</Text>
            <View style={styles.componentList}>
              {COMPONENTS.map((c) => (
                <Pressable
                  key={c.value}
                  style={[
                    styles.componentRadio,
                    newComponent === c.value && styles.componentRadioActive,
                  ]}
                  onPress={() => setNewComponent(c.value)}
                >
                  <Text
                    style={[
                      styles.componentRadioText,
                      newComponent === c.value && styles.componentRadioTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>INITIAL UNITS</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUnits}
                  onChangeText={setNewUnits}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>LOW THRESHOLD</Text>
                <TextInput
                  style={styles.textInput}
                  value={newThreshold}
                  onChangeText={setNewThreshold}
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>
            </View>

            {addError && (
              <View style={styles.errorBox}>
                <AppIcon name="warning" size={16} tintColor="#E7194F" />
                <Text style={styles.errorText}>{addError}</Text>
              </View>
            )}

            <Pressable
              style={[styles.saveBtn, adding && styles.btnDisabled]}
              onPress={handleAddStock}
              disabled={adding}
              accessibilityRole="button"
              accessibilityLabel="Save stock record"
            >
              <Text style={styles.saveBtnText}>
                {adding ? 'Saving...' : 'Add Stock Record'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Remove Confirmation Dialog Modal */}
      <Modal
        visible={removeModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemoveModal({ visible: false, item: null })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRemoveModal({ visible: false, item: null })}
        >
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Remove Stock Entry?</Text>
            <Text style={styles.confirmMsg}>
              This will permanently delete the{' '}
              {removeModal.item?.bloodGroup} (
              {removeModal.item?.component}) inventory record from this hospital.
              If stock is merely depleted, please set units to 0 instead.
            </Text>
            <View style={styles.dialogBtns}>
              <Pressable
                style={styles.dialogCancel}
                onPress={() => setRemoveModal({ visible: false, item: null })}
              >
                <Text style={styles.dialogCancelText}>Keep Record</Text>
              </Pressable>
              <Pressable
                style={styles.dialogDelete}
                onPress={handleConfirmRemove}
              >
                <Text style={styles.dialogDeleteText}>Remove Entry</Text>
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
  headerTitleBlock: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
  },
  headerSub: {
    fontSize: 12,
    color: '#6E7180',
    marginTop: 1,
  },
  headerSpacer: {
    width: 44,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0878A8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minHeight: 38,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  guidanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  guidanceText: {
    flex: 1,
    fontSize: 12,
    color: '#0878A8',
    lineHeight: 16,
  },
  stockRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F7F8FF',
    borderWidth: 1,
    borderColor: '#D6DDEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  groupBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#14253B',
  },
  itemMeta: {
    gap: 4,
  },
  componentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14253B',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FF',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#D6DDEA',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D6DDEA',
  },
  stepBtnDisabled: {
    backgroundColor: '#F0F0F3',
    borderColor: '#E2E5EC',
  },
  unitDisplay: {
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 46,
  },
  unitNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14253B',
  },
  unitSub: {
    fontSize: 9,
    color: '#6E7180',
    fontWeight: '600',
  },
  deleteRowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unauthorizedContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unauthorizedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14253B',
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 13,
    color: '#6E7180',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 280,
  },
  switchRoleBtn: {
    backgroundColor: '#0878A8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  switchRoleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 37, 59, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6DDEA',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14253B',
  },
  modalSheetSub: {
    fontSize: 12,
    color: '#6E7180',
    marginTop: 2,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6E7180',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  groupChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  groupChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F7F8FF',
  },
  groupChipActive: {
    backgroundColor: '#0878A8',
    borderColor: '#0878A8',
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14253B',
  },
  groupChipTextActive: {
    color: '#FFFFFF',
  },
  componentList: {
    gap: 6,
    marginBottom: 14,
  },
  componentRadio: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F7F8FF',
  },
  componentRadioActive: {
    backgroundColor: '#E6F4FF',
    borderColor: '#0878A8',
  },
  componentRadioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14253B',
  },
  componentRadioTextActive: {
    color: '#0878A8',
    fontWeight: '800',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  inputCol: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#F7F8FF',
    borderWidth: 1,
    borderColor: '#D6DDEA',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#14253B',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE7EE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#E7194F',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#0878A8',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmDialog: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignSelf: 'center',
    width: '90%',
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
    marginBottom: 8,
  },
  confirmMsg: {
    fontSize: 13,
    color: '#6E7180',
    lineHeight: 18,
    marginBottom: 18,
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
  },
  dialogDelete: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dialogDeleteText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
