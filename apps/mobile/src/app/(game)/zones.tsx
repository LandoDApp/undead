import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useZoneStore } from '@/stores/zone';
import { SafeZoneCard } from '@/components/safe-zone/SafeZoneCard';
import { colors, spacing, fontSize } from '@/theme';

export default function ZonesScreen() {
  const { zones, isLoading, fetchZones } = useZoneStore();

  useEffect(() => {
    fetchZones();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safe Zones</Text>
      <FlatList
        data={zones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SafeZoneCard zone={item} />}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={fetchZones}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    padding: spacing.lg,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
});
