import React, {FunctionComponent} from 'react';
import {useStyle} from '../../styles';
import {StyleSheet, Text, TextStyle, View, ViewStyle} from 'react-native';

export const Chip: FunctionComponent<{
  color?: 'success' | 'danger';
  mode?: 'fill' | 'light' | 'outline';
  text: string | React.ReactNode;
  backgroundStyle?: ViewStyle;
  textStyle?: TextStyle;
}> = ({color, mode = 'fill', text, backgroundStyle, textStyle}) => {
  const style = useStyle();

  const baseColor = color === 'success' ? 'green' : 'red';

  const backgroundColorDefinition = (() => {
    switch (mode) {
      case 'fill':
        return ['background-color-gray-500'];
      case 'light':
        return ['background-color-gray-400'];
      case 'outline':
        return ['background-color-transparent'];
    }
  })();

  const textColorDefinition = (() => {
    if (!color) {
      return mode === 'light' ? ['color-text-high'] : ['color-text-low'];
    }

    switch (color) {
      case 'success':
        return [`color-${baseColor}-400`];
      case 'danger':
        return [`color-${baseColor}-400`];
    }
  })();

  return (
    <View
      style={StyleSheet.flatten([
        style.flatten(
          [
            ...(backgroundColorDefinition as any),
            'padding-x-8',
            'padding-y-2',
            'border-radius-32',
            'justify-center',
            'items-center',
          ],
          [
            mode === 'outline' && 'border-width-1',
            mode === 'outline' && (`border-color-${baseColor}-400` as any),
          ],
        ),
        backgroundStyle,
      ])}>
      {typeof text === 'string' ? (
        <Text
          style={StyleSheet.flatten([
            style.flatten([
              'text-overline',
              'text-center',
              'text-caption1',
              ...(textColorDefinition as any),
            ]),
            textStyle,
          ])}>
          {text}
        </Text>
      ) : (
        text
      )}
    </View>
  );
};
