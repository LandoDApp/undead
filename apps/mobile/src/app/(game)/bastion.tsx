import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BastionInterior } from '@/components/bastion/BastionInterior';
import { colors } from '@/theme';

export default function BastionScreen() {
  return (
    <View style={styles.container}>
      <BastionInterior />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
