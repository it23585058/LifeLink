import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Hospital, reservationApi, StockItem } from '@/lib/hospitalApi';
import { AppIcon } from './AppIcon';

export function ReserveSheet({
  visible,
  hospital,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  hospital: Hospital;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const eligibleItems = hospital.stock.filter((s) => s.units > 0);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    eligibleItems.length > 0 ? eligibleItems[0]._id : ''
  );
  const [units, setUnits] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedItem =
    eligibleItems.find((s) => s._id === selectedItemId) || eligibleItems[0];
  const maxUnits = selectedItem ? selectedItem.units : 1;

  const handleSelectGroup = (item: StockItem) => {
    setSelectedItemId(item._id);
    setUnits(1);
    setErrorMessage(null);
  };

  const increment = () => {
    if (units < maxUnits) {
      setUnits((u) => u + 1);
      setErrorMessage(null);
    }
  };

  const decrement = () => {
    if (units > 1) {
      setUnits((u) => u - 1);
      setErrorMessage(null);
    }
  };

  const handleConfirm = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await reservationApi.create({
        hospital: hospital._id,
        bloodGroup: selectedItem.bloodGroup,
        component: selectedItem.component,
        units,
        note: 'Reserved via LifeLink mobile app',
      });

      setSuccessMessage(
        `Successfully reserved ${units} unit${units > 1 ? 's' : ''} of ${selectedItem.bloodGroup} blood!`
      );
      setTimeout(() => {
        setSuccessMessage(null);
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        const available = err?.response?.data?.availableUnits ?? 0;
        setErrorMessage(
          `Only ${available} unit${available === 1 ? '' : 's'} available. Please adjust your quantity.`
        );
      } else {
        setErrorMessage(
          err?.response?.data?.error || 'Failed to submit reservation. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sheetTitle}>Reserve Blood Units</Text>
              <Text style={styles.hospitalSub} numberOfLines={1}>
                {hospital.name}
              </Text>
            </View>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close reservation sheet"
            >
              <AppIcon name="close" size={20} tintColor="#6E7180" />
            </Pressable>
          </View>

          {eligibleItems.length === 0 ? (
            <View style={styles.emptyPrompt}>
              <Text style={styles.emptyText}>
                No blood units are currently available for reservation at this facility.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>SELECT BLOOD GROUP</Text>
              <View style={styles.groupChipsGrid}>
                {eligibleItems.map((item) => {
                  const isSelected =
                    selectedItem && selectedItem._id === item._id;
                  return (
                    <Pressable
                      key={item._id}
                      style={[
                        styles.groupChip,
                        isSelected && styles.groupChipSelected,
                      ]}
                      onPress={() => handleSelectGroup(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select blood group ${item.bloodGroup}, ${item.units} units available`}
                    >
                      <Text
                        style={[
                          styles.chipGroupText,
                          isSelected && styles.chipGroupTextSelected,
                        ]}
                      >
                        {item.bloodGroup}
                      </Text>
                      <Text
                        style={[
                          styles.chipUnitsText,
                          isSelected && styles.chipUnitsTextSelected,
                        ]}
                      >
                        {item.units} avail
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>REQUIRED UNITS</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  style={[
                    styles.stepperBtn,
                    units <= 1 && styles.stepperBtnDisabled,
                  ]}
                  onPress={decrement}
                  disabled={units <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease units"
                >
                  <AppIcon
                    name="minus"
                    size={20}
                    tintColor={units <= 1 ? '#D6DDEA' : '#14253B'}
                  />
                </Pressable>

                <View style={styles.stepperValueContainer}>
                  <Text style={styles.stepperValue}>{units}</Text>
                  <Text style={styles.stepperLabel}>
                    Unit{units > 1 ? 's' : ''} (Max: {maxUnits})
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.stepperBtn,
                    units >= maxUnits && styles.stepperBtnDisabled,
                  ]}
                  onPress={increment}
                  disabled={units >= maxUnits}
                  accessibilityRole="button"
                  accessibilityLabel="Increase units"
                >
                  <AppIcon
                    name="plus"
                    size={20}
                    tintColor={units >= maxUnits ? '#D6DDEA' : '#14253B'}
                  />
                </Pressable>
              </View>

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <AppIcon name="warning" size={16} tintColor="#E7194F" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {successMessage && (
                <View style={styles.successBanner}>
                  <AppIcon name="check" size={16} tintColor="#087A3E" />
                  <Text style={styles.successBannerText}>{successMessage}</Text>
                </View>
              )}

              <Pressable
                style={[
                  styles.confirmBtn,
                  submitting && styles.confirmBtnDisabled,
                ]}
                onPress={handleConfirm}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Confirm reservation"
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    Confirm Reservation ({units} Unit{units > 1 ? 's' : ''})
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20, 37, 59, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6DDEA',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14253B',
  },
  hospitalSub: {
    fontSize: 13,
    color: '#6E7180',
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6E7180',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  groupChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  groupChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F7F8FF',
    alignItems: 'center',
    minWidth: 70,
  },
  groupChipSelected: {
    borderColor: '#E7194F',
    backgroundColor: '#FFE7EE',
  },
  chipGroupText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14253B',
  },
  chipGroupTextSelected: {
    color: '#E7194F',
  },
  chipUnitsText: {
    fontSize: 10,
    color: '#6E7180',
    marginTop: 2,
  },
  chipUnitsTextSelected: {
    color: '#E7194F',
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F8FF',
    borderRadius: 14,
    padding: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D6DDEA',
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D6DDEA',
  },
  stepperBtnDisabled: {
    backgroundColor: '#F0F0F3',
    borderColor: '#E2E5EC',
  },
  stepperValueContainer: {
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14253B',
  },
  stepperLabel: {
    fontSize: 11,
    color: '#6E7180',
    fontWeight: '600',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE7EE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    color: '#E7194F',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9F8E7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  successBannerText: {
    color: '#087A3E',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: '#E7194F',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyPrompt: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6E7180',
    textAlign: 'center',
  },
});
