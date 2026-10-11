import React from 'react';
import { Tabs } from 'expo-router';
import { Colors, Typography } from '../../src/constants/theme';
import {
  LayoutDashboard,
  Pill,
  AlertTriangle,
  Calculator,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/store/cartStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const cartItemCount = useCartStore((state) => state.getItemCount());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: insets.bottom > 0 ? 56 + insets.bottom : 60,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs - 1,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size - 2} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="medicines"
        options={{
          title: 'Medicines',
          tabBarIcon: ({ color, size }) => <Pill size={size - 2} color={color} />,
        }}
      />

      <Tabs.Screen
        name="low-stock"
        options={{
          title: 'Low Stock',
          tabBarIcon: ({ color, size }) => (
            <AlertTriangle size={size - 2} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Calculator',
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            fontSize: 10,
            fontWeight: 'bold',
          },
          tabBarIcon: ({ color, size }) => (
            <Calculator size={size - 2} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
