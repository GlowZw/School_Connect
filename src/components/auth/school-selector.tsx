import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { getSchoolsDirectory } from '@/services/tenant/school-service';
import type { SchoolDirectoryEntry } from '@/services/tenant/school-service';
import { theme } from '@/theme';

type SchoolSelectorProps = {
  selectedSchoolId: string;
  selectedSchool?: SchoolDirectoryEntry | null;
  onSelect: (school: SchoolDirectoryEntry) => void;
  error?: string;
  customPrimaryColor?: string;
};

export function SchoolSelector({
  selectedSchoolId,
  selectedSchool: selectedSchoolOverride,
  onSelect,
  error,
  customPrimaryColor = theme.colors.primary,
}: SchoolSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [schools, setSchools] = useState<SchoolDirectoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSchools = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSchoolsDirectory();
      setSchools(data);
    } catch (err) {
      console.error('Failed to load schools directory:', err);
      setLoadError('Failed to load schools. Tap to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchSchools();
    }
  }, [modalVisible]);

  const selectedSchool = selectedSchoolOverride ?? schools.find((s) => s.id === selectedSchoolId);

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>School Selection</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={[
          styles.selectorButton,
          { borderColor: theme.colors.border },
          error ? styles.inputError : null,
        ]}
      >
        <View style={styles.selectorContent}>
          {selectedSchool?.logoUrl ? (
            <Image source={{ uri: selectedSchool.logoUrl }} style={styles.selectorLogo} />
          ) : (
            <AppIcon color={theme.colors.mutedText} name="map-pin" size={18} />
          )}
          <View style={styles.selectorCopy}>
            <Text
              numberOfLines={1}
              style={[
                styles.selectorText,
                selectedSchool ? styles.selectedText : styles.placeholderText,
              ]}
            >
              {selectedSchool ? selectedSchool.name : 'Select your school...'}
            </Text>
            {selectedSchool ? <Text style={styles.selectorSchoolId}>{selectedSchool.id}</Text> : null}
          </View>
        </View>
        <AppIcon color={theme.colors.mutedText} name="chevron-down" size={18} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent={false}
        visible={modalVisible}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select School</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSearchQuery('');
                setModalVisible(false);
              }}
              style={styles.closeButton}
            >
              <AppIcon color={theme.colors.text} name="x" size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <AppIcon color={theme.colors.mutedText} name="search" size={18} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              placeholder="Search school name or ID (e.g. SCH-001)"
              placeholderTextColor={theme.colors.mutedText}
              style={styles.searchInput}
              value={searchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <AppIcon color={theme.colors.mutedText} name="x-circle" size={18} />
              </TouchableOpacity>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={styles.loadingText}>Fetching available schools...</Text>
            </View>
          ) : loadError ? (
            <TouchableOpacity onPress={fetchSchools} style={styles.centerContainer}>
              <AppIcon color={theme.colors.danger} name="alert-triangle" size={32} />
              <Text style={[styles.errorText, styles.centerErrorText]}>{loadError}</Text>
            </TouchableOpacity>
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={filteredSchools}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <AppIcon color={theme.colors.mutedText} name="info" size={24} />
                  <Text style={styles.emptyText}>No schools match your search.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.id === selectedSchoolId;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelect(item);
                      setModalVisible(false);
                    }}
                    style={[
                      styles.schoolCard,
                      isSelected && {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <View style={styles.schoolInfoContainer}>
                      <View
                        style={[
                          styles.colorIndicator,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                      <View style={styles.schoolTextContainer}>
                        <Text
                          style={[
                          styles.schoolNameText,
                            isSelected && { fontWeight: '700', color: customPrimaryColor },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.schoolIdText}>{item.id}</Text>
                      </View>
                    </View>
                    {isSelected ? (
                        <AppIcon color={customPrimaryColor} name="check" size={20} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  selectorLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectorCopy: {
    flex: 1,
    minWidth: 0,
  },
  selectorText: {
    fontSize: 15,
  },
  selectorSchoolId: {
    color: theme.colors.mutedText,
    fontSize: 12,
    marginTop: 1,
  },
  placeholderText: {
    color: theme.colors.mutedText,
  },
  selectedText: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
  },
  schoolInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  colorIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
  },
  schoolTextContainer: {
    flex: 1,
    gap: 2,
  },
  schoolNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  schoolIdText: {
    fontSize: 13,
    color: theme.colors.mutedText,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.mutedText,
  },
  centerErrorText: {
    textAlign: 'center',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.mutedText,
    textAlign: 'center',
  },
});
