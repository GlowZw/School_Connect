import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { TextInputProps } from 'react-native';

import { theme } from '@/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  contextMenuHidden = false,
  selectTextOnFocus = false,
  spellCheck = true,
  autoCorrect = true,
  ...props
}: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        contextMenuHidden={contextMenuHidden}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={theme.colors.mutedText}
        selectTextOnFocus={selectTextOnFocus}
        selectionColor={theme.colors.primary}
        secureTextEntry={secureTextEntry}
        spellCheck={spellCheck}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 12,
  },
});
