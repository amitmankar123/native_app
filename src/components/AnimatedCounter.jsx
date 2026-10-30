import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { formatINR } from '../utils/formatters';

export default function AnimatedCounter({
  value = 0,
  style,
  options = { showDecimals: false },
}) {
  const animatedVal = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(0);

  useEffect(() => {
    Animated.timing(animatedVal, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start(() => {
      prevValue.current = value;
      animatedVal.setValue(0);
    });
  }, [value, animatedVal]);

  return (
    <Text style={[styles.text, style]}>
      {formatINR(value, options)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

