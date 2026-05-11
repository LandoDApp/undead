import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEquipmentStore } from '@/stores/equipment';
import { colors, fontFamily, spacing, borderRadius, shadows } from '@/theme';
import { icons } from '@/assets';
import type { LootItem, EquipSlot, ItemRarity } from '@undead/shared';

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  rare: '#3498db',
  epic: '#8e44ad',
  legendary: '#f1c40f',
};

const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Gewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
};

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: 'Waffe',
  armor: 'Rüstung',
  amulet: 'Amulett',
};

const SLOT_ICONS: Record<EquipSlot, any> = {
  weapon: icons.sword,
  armor: icons.shield,
  amulet: icons.relic,
};

interface EquipmentPanelProps {
  visible: boolean;
  onClose: () => void;
}

function ItemCard({ item, onPress, compact }: { item: LootItem; onPress?: () => void; compact?: boolean }) {
  const rarityColor = RARITY_COLORS[item.rarity];
  return (
    <Pressable
      style={[styles.itemCard, { borderColor: rarityColor + '60' }]}
      onPress={onPress}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.itemName, { color: rarityColor }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.itemRarity, { color: rarityColor }]}>{RARITY_LABELS[item.rarity]}</Text>
      </View>
      {!compact && (
        <Text style={styles.itemSlot}>{SLOT_LABELS[item.slot]}</Text>
      )}
      <View style={styles.statsRow}>
        {item.attackBonus > 0 && (
          <Text style={styles.stat}>ATK +{item.attackBonus}</Text>
        )}
        {item.defenseBonus > 0 && (
          <Text style={styles.stat}>DEF +{item.defenseBonus}</Text>
        )}
        {item.tapBonus > 0 && (
          <Text style={styles.stat}>TAP +{item.tapBonus}</Text>
        )}
      </View>
      {!compact && item.description ? (
        <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
      ) : null}
    </Pressable>
  );
}

export function EquipmentPanel({ visible, onClose }: EquipmentPanelProps) {
  const insets = useSafeAreaInsets();
  const { items, equipment, keys, fetchItems, fetchKeys, equipItem, unequipItem } = useEquipmentStore();

  useEffect(() => {
    if (visible) {
      fetchItems();
      fetchKeys();
    }
  }, [visible]);

  const unequippedItems = items.filter((item) => {
    // Check if item is currently equipped
    const equippedInSlot = equipment[item.slot as EquipSlot];
    return !equippedInSlot || equippedInSlot.id !== item.id;
  });

  const slots: EquipSlot[] = ['weapon', 'armor', 'amulet'];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.panel, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Ausrüstung</Text>
            <View style={styles.keyBadge}>
              <Text style={styles.keyText}>{keys}</Text>
              <Text style={styles.keyIcon}>🔑</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Equipped slots */}
          <Text style={styles.sectionTitle}>Angelegt</Text>
          <View style={styles.slotsRow}>
            {slots.map((slot) => {
              const equipped = equipment[slot];
              return (
                <Pressable
                  key={slot}
                  style={[
                    styles.slotBox,
                    equipped && { borderColor: RARITY_COLORS[equipped.rarity] + '60' },
                  ]}
                  onPress={() => equipped && unequipItem(slot)}
                >
                  <Image source={SLOT_ICONS[slot]} style={styles.slotIcon} />
                  <Text style={styles.slotLabel}>{SLOT_LABELS[slot]}</Text>
                  {equipped ? (
                    <Text
                      style={[styles.slotItemName, { color: RARITY_COLORS[equipped.rarity] }]}
                      numberOfLines={1}
                    >
                      {equipped.name}
                    </Text>
                  ) : (
                    <Text style={styles.slotEmpty}>Leer</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Inventory */}
          <Text style={styles.sectionTitle}>Inventar ({unequippedItems.length})</Text>
          <ScrollView style={styles.inventoryScroll} showsVerticalScrollIndicator={false}>
            {unequippedItems.length === 0 ? (
              <Text style={styles.emptyText}>Keine Gegenstände. Öffne Truhen!</Text>
            ) : (
              unequippedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onPress={() => equipItem(item.id)}
                />
              ))
            )}
          </ScrollView>

          <View style={styles.divider} />

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Schlie{'\u00df'}en</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    flex: 1,
    backgroundColor: colors.parchment,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.gold + '50',
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold + '40',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamily.heading,
  },
  keyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.parchmentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  keyText: {
    color: colors.gold,
    fontSize: 20,
    fontFamily: fontFamily.body,
    fontWeight: '700',
  },
  keyIcon: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gold + '40',
    marginVertical: 10,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 18,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    marginBottom: 8,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotBox: {
    flex: 1,
    backgroundColor: colors.parchmentLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold + '20',
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  slotIcon: {
    width: 24,
    height: 24,
  },
  slotLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
  slotItemName: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  slotEmpty: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
  },
  inventoryScroll: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: colors.parchmentLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold + '20',
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 18,
    fontFamily: fontFamily.body,
    fontWeight: '700',
    flex: 1,
  },
  itemRarity: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  itemSlot: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
  itemDesc: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 18,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    paddingVertical: 32,
  },
  closeBtn: {
    backgroundColor: colors.parchmentLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  closeBtnText: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fontFamily.body,
    fontWeight: '600',
  },
});
