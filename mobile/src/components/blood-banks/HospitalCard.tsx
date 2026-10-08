import React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Hospital } from '@/lib/hospitalApi';
import { AppIcon } from './AppIcon';
import { StatusPill } from './StatusPill';
import { StockTile } from './StockTile';

function formatSyncTime(dateStr?: string) {
  if (!dateStr) return 'Updated recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMins < 60) return `Updated ${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `Updated ${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
}

export function HospitalCard({
  hospital,
  onOpenReserve,
}: {
  hospital: Hospital;
  onOpenReserve: (hospital: Hospital) => void;
}) {
  const router = useRouter();

  const handleCall = () => {
    if (hospital.phone) {
      Linking.openURL(`tel:${hospital.phone}`);
    }
  };

  const handlePortal = () => {
    if (hospital.portalUrl) {
      Linking.openURL(hospital.portalUrl);
    }
  };

  const handleOpenDetail = () => {
    router.push(`/blood-banks/${hospital._id}` as any);
  };

  const isNbts = hospital.accreditation === 'nbts_accredited';
  const isVerified = hospital.accreditation === 'hospital_verified';
  const hasPortal = Boolean(hospital.portalUrl);

  const displayStock = hospital.stock.slice(0, 4);

  return (
    <View style={styles.card}>
      {/* Top badges: Accreditation & Distance */}
      <View style={styles.topBadgeRow}>
        <View style={styles.accreditationContainer}>
          {isNbts && (
            <View style={styles.nbtsBadge}>
              <AppIcon name="verified" size={14} tintColor="#087A3E" />
              <Text style={styles.nbtsText}>NBTS Accredited</Text>
            </View>
          )}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <AppIcon name="shield" size={14} tintColor="#0878A8" />
              <Text style={styles.verifiedText}>Hospital Verified</Text>
            </View>
          )}
          {!isNbts && !isVerified && (
            <StatusPill variant="neutral" customLabel="Unverified" />
          )}
        </View>

        {hospital.distanceKm != null && (
          <View style={styles.distanceBadge}>
            <AppIcon name="location" size={13} tintColor="#6E7180" />
            <Text style={styles.distanceText}>{hospital.distanceKm} km away</Text>
          </View>
        )}
      </View>

      {/* Hospital Name */}
      <Pressable
        onPress={handleOpenDetail}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${hospital.name}`}
      >
        <Text style={styles.hospitalName} numberOfLines={2}>
          {hospital.name}
        </Text>
      </Pressable>

      {/* Sync Status line */}
      <View style={styles.syncRow}>
        <View style={styles.syncDot} />
        <Text style={styles.syncText}>
          {formatSyncTime(hospital.lastUpdatedAt)}
        </Text>
      </View>

      {/* Action Buttons row */}
      <View style={styles.actionRow}>
        <Pressable
          style={styles.callBtn}
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel={`Call blood bank at ${hospital.name}`}
        >
          <AppIcon name="phone" size={16} tintColor="#E7194F" />
          <Text style={styles.callBtnText}>Call Blood Bank</Text>
        </Pressable>

        {hasPortal ? (
          <Pressable
            style={styles.portalBtn}
            onPress={handlePortal}
            accessibilityRole="button"
            accessibilityLabel={`Open hospital portal for ${hospital.name}`}
          >
            <AppIcon name="portal" size={16} tintColor="#FFFFFF" />
            <Text style={styles.portalBtnText}>Hospital Portal</Text>
          </Pressable>
        ) : isNbts ? (
          <Pressable
            style={styles.primaryReserveBtn}
            onPress={() => onOpenReserve(hospital)}
            accessibilityRole="button"
            accessibilityLabel={`Reserve units at ${hospital.name}`}
          >
            <AppIcon name="reserve" size={16} tintColor="#FFFFFF" />
            <Text style={styles.primaryReserveBtnText}>Reserve Units</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.viewDetailBtn}
            onPress={handleOpenDetail}
            accessibilityRole="button"
            accessibilityLabel={`View detail and reserve units at ${hospital.name}`}
          >
            <AppIcon name="reserve" size={16} tintColor="#FFFFFF" />
            <Text style={styles.viewDetailBtnText}>View Detail & Reserve</Text>
          </Pressable>
        )}
      </View>

      {/* BLOOD GROUP STATUS Section */}
      <View style={styles.stockSection}>
        <Text style={styles.stockHeader}>BLOOD GROUP STATUS</Text>
        <View style={styles.stockGrid}>
          {displayStock.map((item) => (
            <View key={item._id} style={styles.tileCol}>
              <StockTile item={item} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    shadowColor: '#14253B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accreditationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nbtsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9F8E7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  nbtsText: {
    color: '#087A3E',
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    color: '#0878A8',
    fontSize: 11,
    fontWeight: '700',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6E7180',
    fontWeight: '500',
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14253B',
    lineHeight: 22,
    marginBottom: 4,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#087A3E',
  },
  syncText: {
    fontSize: 11,
    color: '#6E7180',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    gap: 6,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14253B',
  },
  primaryReserveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#E7194F',
    minHeight: 44,
    gap: 6,
  },
  primaryReserveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewDetailBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#0878A8',
    minHeight: 44,
    gap: 6,
  },
  viewDetailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  portalBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#14253B',
    minHeight: 44,
    gap: 6,
  },
  portalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stockSection: {
    marginTop: 4,
  },
  stockHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6E7180',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tileCol: {
    width: '48.5%',
  },
});
