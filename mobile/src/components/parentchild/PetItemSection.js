import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  toggleBleProximity,
  addPetOrItem,
  deletePetOrItem,
} from '../../services/parentChildService';

const EMOJI_OPTIONS = {
  pet: ['🐕', '🐈', '🦜', '🐰', '🐢', '🐾'],
  item: ['🎒', '🔑', '💼', '💻', '🚲', '🏷️'],
};

export default function PetItemSection({ items = [], onRefresh }) {
  const [expanded, setExpanded] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagType, setTagType] = useState('pet'); // 'pet' | 'item'
  const [selectedEmoji, setSelectedEmoji] = useState('🐕');
  const [loading, setLoading] = useState(false);

  async function handleToggleProximity(itemId) {
    await toggleBleProximity(itemId);
    if (onRefresh) onRefresh();
  }

  function handleBlePairingPress() {
    Alert.alert(
      'BLE Pairing Not Available',
      'Hardware BLE tag scanning & pairing is out of scope for this version. Pet and valuable profiles can be managed and viewed directly.',
      [{ text: 'Understood' }]
    );
  }

  async function handleDeleteProfile(item) {
    Alert.alert(
      'Remove Profile',
      `Are you sure you want to remove "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deletePetOrItem(item.id);
            if (onRefresh) onRefresh();
          },
        },
      ]
    );
  }

  async function handleAddProfile() {
    if (!tagName.trim()) {
      Alert.alert('Required', 'Please enter a name for the pet or valuable item.');
      return;
    }
    setLoading(true);
    try {
      await addPetOrItem('parent_user_default', {
        name: tagName.trim(),
        type: tagType,
        avatarEmoji: selectedEmoji,
      });
      setTagName('');
      setModalVisible(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🐾 Tracked Pets & Valuables</Text>
          <View style={styles.tagCountBadge}>
            <Text style={styles.tagCountText}>{items.length} profiles</Text>
          </View>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Phase Notice */}
          <View style={styles.phaseNotice}>
            <Text style={styles.phaseNoticeText}>
              🏷️ Pet & Valuable Profiles: Profile Management Active
            </Text>
          </View>

          <Text style={styles.sectionSubtitle}>
            Tracked profiles for household pets, school backpacks, and keys.
          </Text>

          {items.map((item) => {
            const inRange = item.status === 'in_range';
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemTopRow}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.itemEmoji}>{item.avatarEmoji || (item.type === 'pet' ? '🐕' : '🎒')}</Text>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.nameLine}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.tagCode}>{item.tagCode}</Text>
                    </View>

                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.rangePill,
                          {
                            backgroundColor: inRange
                              ? COLORS.safeGreenLight
                              : COLORS.warnOrangeLight,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rangePillText,
                            { color: inRange ? COLORS.safeGreen : COLORS.warnOrange },
                          ]}
                        >
                          {inRange ? '🟢 In Range (Visual)' : '⚪ Out of Range'}
                        </Text>
                      </View>

                      <Text style={styles.distanceText}>
                        {item.type === 'pet' ? 'Pet Profile' : 'Valuable Profile'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.locationBar}>
                  <Text style={styles.locationText} numberOfLines={1}>
                    📍 {item.locationAddress} • 🔋 {item.batteryLevel || 100}%
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.itemActionRow}>
                  {/* Disabled Hardware BLE Pair Button with informative tag */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.blePairDisabledBtn]}
                    onPress={handleBlePairingPress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.blePairDisabledText}>
                      🔒 BLE Pairing: Not available yet
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.removeBtn]}
                    onPress={() => handleDeleteProfile(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeBtnText}>
                      ✕ Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.addTagBtn}
            onPress={() => {
              setSelectedEmoji(tagType === 'pet' ? '🐕' : '🎒');
              setModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.addTagBtnText}>+ Add New Pet or Valuable Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal to register new pet/valuable profile */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Pet or Valuable Profile</Text>
            <Text style={styles.modalSub}>
              Create a profile to monitor household pets or important personal items.
            </Text>

            <View style={styles.hardwareNoteBox}>
              <Text style={styles.hardwareNoteText}>
                ℹ️ Data-entry profile only. Real BLE hardware pairing is not available in this version.
              </Text>
            </View>

            <View style={styles.typeSwitchRow}>
              <TouchableOpacity
                style={[styles.typeBtn, tagType === 'pet' && styles.typeBtnActive]}
                onPress={() => {
                  setTagType('pet');
                  setSelectedEmoji('🐕');
                }}
              >
                <Text style={styles.typeBtnText}>🐕 Pet (Dog/Cat)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, tagType === 'item' && styles.typeBtnActive]}
                onPress={() => {
                  setTagType('item');
                  setSelectedEmoji('🎒');
                }}
              >
                <Text style={styles.typeBtnText}>🎒 Valuables / Bag</Text>
              </TouchableOpacity>
            </View>

            {/* Emoji Avatar Selector */}
            <Text style={styles.label}>Select Avatar Icon</Text>
            <View style={styles.emojiPickerRow}>
              {(EMOJI_OPTIONS[tagType] || EMOJI_OPTIONS.pet).map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnSelected]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Profile Name</Text>
            <TextInput
              style={styles.input}
              placeholder={tagType === 'pet' ? 'e.g. Bella (Puppy)' : 'e.g. School Backpack'}
              placeholderTextColor={COLORS.textMuted}
              value={tagName}
              onChangeText={setTagName}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleAddProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  tagCountBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  tagCountText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  body: {
    marginTop: SPACING.md,
  },
  phaseNotice: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: SPACING.sm,
  },
  phaseNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  itemCard: {
    backgroundColor: '#F9FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemEmoji: {
    fontSize: 22,
  },
  itemDetails: {
    flex: 1,
  },
  nameLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  tagCode: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  rangePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  rangePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  locationBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.sm,
  },
  actionBtn: {
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blePairDisabledBtn: {
    flex: 1.8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  blePairDisabledText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  removeBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  addTagBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addTagBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  modalBg: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  hardwareNoteBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  hardwareNoteText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  typeSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emojiPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
  },
  emojiText: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveModalBtn: {
    flex: 1.5,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  saveModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
