import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const Button = ({ title, onPress, style, textStyle, icon, disabled = false }) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && <Icon name={icon} size={20} color={textStyle?.color || '#ffffff'} style={styles.icon} />}
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Button;