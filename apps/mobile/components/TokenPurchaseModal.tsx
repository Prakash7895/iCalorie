import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTokenPricing, PricingInfo, TokenPackage } from '@/lib/api';

const COLORS = {
  background: '#0A0E27',
  card: '#151932',
  cardHover: '#1A1F3A',
  primary: '#6C63FF',
  accent: '#FF6584',
  text: '#FFFFFF',
  textSecondary: '#A0A0C8',
  success: '#4ADE80',
  border: '#2A2F4A',
};

interface TokenPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  currentBalance: number;
  onPurchaseComplete: () => void;
}

export default function TokenPurchaseModal({
  visible,
  onClose,
  currentBalance,
  onPurchaseComplete,
}: TokenPurchaseModalProps) {
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(
    null
  );
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPricing();
    }
  }, [visible]);

  const loadPricing = async () => {
    try {
      setLoading(true);
      const data = await getTokenPricing();
      console.log('Pricing data loaded:', JSON.stringify(data, null, 2));
      console.log('Packages:', data.packages);
      setPricing(data);
    } catch (error) {
      console.error('Failed to load pricing:', error);
      Alert.alert('Error', 'Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setPurchasing(true);

    try {
      // Import IAP service
      const { purchaseProduct } = await import('@/lib/iap');

      // Initiate purchase
      await purchaseProduct(pkg.product_id);

      // Purchase successful (verification happens in iap.ts)
      Alert.alert(
        'Purchase Successful!',
        `Added ${pkg.scans} scans to your account`,
        [
          {
            text: 'OK',
            onPress: () => {
              onPurchaseComplete();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Purchase error:', error);

      let errorMessage = 'Please try again later';
      if (error.message === 'Purchase cancelled') {
        errorMessage = 'Purchase was cancelled';
      } else if (error.message?.includes('already been processed')) {
        errorMessage = 'This purchase was already processed';
      }

      Alert.alert('Purchase Failed', errorMessage);
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const renderPackage = (pkg: TokenPackage, index: number) => {
    const isPopular = index === 1; // Middle package is most popular
    const isSelected = selectedPackage?.product_id === pkg.product_id;
    const pricePerScan = (pkg.price_usd / pkg.scans).toFixed(2);

    return (
      <TouchableOpacity
        style={[
          styles.packageCard,
          isPopular && styles.popularCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handlePurchase(pkg)}
        disabled={purchasing}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.packageHeader}>
          <Text style={styles.packageScans}>{pkg.scans}</Text>
          <Text style={styles.packageLabel}>Scans</Text>
        </View>

        <View style={styles.packagePricing}>
          <Text style={styles.packagePrice}>${pkg.price_usd}</Text>
          <Text style={styles.pricePerScan}>${pricePerScan} per scan</Text>
        </View>

        {pkg.savings_percent > 0 && (
          <View style={styles.savingsBadge}>
            <Ionicons name='pricetag' size={14} color={COLORS.success} />
            <Text style={styles.savingsText}>Save {pkg.savings_percent}%</Text>
          </View>
        )}

        {purchasing && isSelected ? (
          <View style={styles.purchaseButton}>
            <ActivityIndicator color={COLORS.text} size='small' />
          </View>
        ) : (
          <View
            style={[styles.purchaseButton, isPopular && styles.popularButton]}
          >
            <Text style={styles.purchaseButtonText}>Purchase</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Buy Scan Tokens</Text>
              <Text style={styles.subtitle}>
                Current balance: {currentBalance} scans
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close' size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading packages...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.infoText}>
                  Choose a package that fits your needs. Larger packs offer
                  better value!
                </Text>

                <View style={styles.packagesContainer}>
                  {pricing?.packages?.map((pkg, index) => (
                    <View key={pkg.product_id}>
                      {renderPackage(pkg, index)}
                    </View>
                  ))}
                </View>

                <View style={styles.footer}>
                  <Ionicons
                    name='information-circle-outline'
                    size={20}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.footerText}>
                    Tokens never expire and can be used anytime. Get 1 free scan
                    daily!
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  packagesContainer: {
    padding: 20,
    gap: 16,
  },
  packageCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  popularCard: {
    borderColor: COLORS.primary,
    transform: [{ scale: 1.02 }],
  },
  selectedCard: {
    borderColor: COLORS.accent,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  packageScans: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
  },
  packageLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  packagePricing: {
    alignItems: 'center',
    marginBottom: 12,
  },
  packagePrice: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  pricePerScan: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  savingsText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  purchaseButton: {
    backgroundColor: COLORS.cardHover,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: COLORS.primary,
  },
  purchaseButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 20,
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  footerText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
