import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  isSub?: boolean;
}

export const Checkbox = ({ checked, onToggle, isSub = false }: CheckboxProps) => {
  const { colors } = useTheme();

  const size = isSub ? 18 : 22;
  const iconSize = isSub ? 13 : 16;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(checked ? 1 : 0.95) }],
      backgroundColor: withTiming(checked ? colors.checkboxChecked : 'transparent', { duration: 150 }),
      borderColor: withTiming(checked ? colors.checkboxChecked : colors.checkboxUnchecked, { duration: 150 }),
    };
  });

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onToggle} style={styles.touchable}>
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedStyle,
        ]}
      >
        {checked && <MaterialCommunityIcons name="check" size={iconSize} color="#FFFFFF" />}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
