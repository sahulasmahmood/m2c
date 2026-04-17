import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Bell, X } from 'lucide-react-native';

interface NotificationBannerProps {
  visible: boolean;
  title: string;
  body: string;
  onPress?: () => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function NotificationBanner({
  visible,
  title,
  body,
  onPress,
  onDismiss,
  autoDismissMs = 5000,
}: NotificationBannerProps) {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        dismiss();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          onPress?.();
          dismiss();
        }}
        style={{
          marginHorizontal: 12,
          marginTop: 50,
          backgroundColor: '#0f172a',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'flex-start',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#2563eb',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Bell size={20} color="#ffffff" />
        </View>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '800',
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              color: '#94a3b8',
              fontSize: 13,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {body}
          </Text>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={10}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={14} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
