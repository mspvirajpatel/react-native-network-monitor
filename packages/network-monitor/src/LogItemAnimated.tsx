import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * LogItemAnimated
 *
 * Wraps children with a fade + slide-up animation on mount.
 * Used by FlatList items and other log entry views.
 */
const LogItemAnimated = ({
  children,
  index,
}: {
  children: React.ReactNode;
  index?: number;
}): React.ReactElement => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

export default LogItemAnimated;
