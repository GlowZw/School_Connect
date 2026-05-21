import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { read, utils } from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  batchUploadStudents,
  findExistingStudentIds,
  type ExcelStudentRecord,
  type StudentImportResult,
} from '@/features/students/excel-import-service';
import { theme } from '@/theme';
import type { UserRole } from '@/types/auth';

type ExcelStudentImportProps = {
  schoolId: string | null | undefined;
  role: UserRole | null | undefined;
};

type PreviewRow = ExcelStudentRecord & {
  rowNumber: number;
  errors: string[];
  duplicateInFile: boolean;
  duplicateInFirestore: boolean;
};

const requiredColumns = ['studentId', 'firstName', 'lastName', 'class', 'gender', 'dob'] as const;

function getValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return '';
}

function normalizeRow(row: Record<string, unknown>, schoolId: string, rowNumber: number): PreviewRow {
  const studentId = getValue(row, ['studentId', 'Student ID', 'StudentId', 'student_id']);
  const firstName = getValue(row, ['firstName', 'First Name', 'firstname', 'first_name']);
  const lastName = getValue(row, ['lastName', 'Last Name', 'lastname', 'last_name']);
  const className = getValue(row, ['class', 'Class', 'className', 'Class Name']);
  const gender = getValue(row, ['gender', 'Gender']);
  const dob = getValue(row, ['dob', 'DOB', 'Date of Birth', 'dateOfBirth']);
  const errors = requiredColumns
    .filter((column) => {
      const valueByColumn = {
        studentId,
        firstName,
        lastName,
        class: className,
        gender,
        dob,
      }[column];

      return !valueByColumn;
    })
    .map((column) => `${column} is required`);

  return {
    rowNumber,
    studentId,
    firstName,
    lastName,
    class: className,
    gender,
    dob,
    schoolId,
    errors,
    duplicateInFile: false,
    duplicateInFirestore: false,
  };
}

async function parseWorkbook(uri: string, schoolId: string) {
  const response = await fetch(uri);
  const data = await response.arrayBuffer();
  const workbook = read(data, { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error('The workbook does not contain any sheets.');
  }

  const rows = utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: '',
    raw: false,
  });

  const seen = new Map<string, number>();
  const normalizedRows = rows.map((row, index) => normalizeRow(row, schoolId, index + 2));

  normalizedRows.forEach((row) => {
    if (!row.studentId) {
      return;
    }

    const previousRow = seen.get(row.studentId);
    if (previousRow) {
      row.duplicateInFile = true;
      row.errors.push(`Duplicate studentId also appears on row ${previousRow}`);
    } else {
      seen.set(row.studentId, row.rowNumber);
    }
  });

  const existingIds = await findExistingStudentIds(
    schoolId,
    normalizedRows.map((row) => row.studentId),
  );

  return normalizedRows.map((row) => ({
    ...row,
    duplicateInFirestore: existingIds.has(row.studentId),
  }));
}

export function ExcelStudentImport({ schoolId, role }: ExcelStudentImportProps) {
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<StudentImportResult | null>(null);

  const validRows = useMemo(
    () =>
      rows.filter(
        (row) => row.errors.length === 0 && !row.duplicateInFile && !row.duplicateInFirestore,
      ),
    [rows],
  );
  const blockedRows = rows.length - validRows.length;

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || role !== 'admin') {
        throw new Error('Admin school context is required.');
      }

      return batchUploadStudents(schoolId, validRows, {
        onProgress: setProgress,
      });
    },
    onSuccess: (nextResult) => {
      setResult(nextResult);
      queryClient.invalidateQueries({ queryKey: ['students', schoolId] });
    },
  });

  if (role !== 'admin') {
    return null;
  }

  const chooseFile = async () => {
    if (!schoolId) {
      setParseError('Missing school context.');
      return;
    }

    setParseError(null);
    setResult(null);
    setProgress(0);

    const pickedFile = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (pickedFile.canceled) {
      return;
    }

    const asset = pickedFile.assets[0];
    setFileName(asset.name);
    setIsParsing(true);

    try {
      const parsedRows = await parseWorkbook(asset.uri, schoolId);
      setRows(parsedRows);
    } catch (error) {
      setRows([]);
      setParseError(error instanceof Error ? error.message : 'Unable to parse Excel file.');
    } finally {
      setIsParsing(false);
    }
  };

  const resetImport = () => {
    setFileName(null);
    setRows([]);
    setParseError(null);
    setProgress(0);
    setResult(null);
  };

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Excel student import</Text>
          <Text style={styles.helperText}>Upload .xlsx or .xls files into this school only.</Text>
        </View>
        <Pressable onPress={chooseFile} style={styles.iconAction}>
          <AppIcon color={theme.colors.primary} name="upload" size={20} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          disabled={isParsing || uploadMutation.isPending || !schoolId}
          label={fileName ? 'Choose another file' : 'Choose Excel file'}
          loading={isParsing}
          onPress={chooseFile}
        />
        {rows.length > 0 ? (
          <Pressable onPress={resetImport} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Cancel</Text>
          </Pressable>
        ) : null}
      </View>

      {fileName ? <Text style={styles.fileName}>{fileName}</Text> : null}
      {parseError ? <Text style={styles.error}>{parseError}</Text> : null}

      {rows.length > 0 ? (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{validRows.length} ready</Text>
            <Text style={styles.summaryText}>{blockedRows} skipped</Text>
            <Text style={styles.summaryText}>{rows.length} total</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                {['Student ID', 'First name', 'Last name', 'Class', 'Gender', 'DOB', 'Status'].map(
                  (heading) => (
                    <Text key={heading} style={[styles.cell, styles.headingCell]}>
                      {heading}
                    </Text>
                  ),
                )}
              </View>
              {rows.slice(0, 30).map((row) => (
                <View key={`${row.studentId}-${row.rowNumber}`} style={styles.tableRow}>
                  <Text style={styles.cell}>{row.studentId || '-'}</Text>
                  <Text style={styles.cell}>{row.firstName || '-'}</Text>
                  <Text style={styles.cell}>{row.lastName || '-'}</Text>
                  <Text style={styles.cell}>{row.class || '-'}</Text>
                  <Text style={styles.cell}>{row.gender || '-'}</Text>
                  <Text style={styles.cell}>{row.dob || '-'}</Text>
                  <Text style={[styles.cell, row.errors.length ? styles.error : styles.ok]}>
                    {row.errors.length
                      ? row.errors.join(', ')
                      : row.duplicateInFirestore
                        ? 'Duplicate'
                        : 'Ready'}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {rows.length > 30 ? (
            <Text style={styles.helperText}>Showing the first 30 rows for preview.</Text>
          ) : null}

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <PrimaryButton
            disabled={validRows.length === 0 || uploadMutation.isPending}
            label="Confirm upload"
            loading={uploadMutation.isPending}
            onPress={() => uploadMutation.mutate()}
          />

          {uploadMutation.isPending ? (
            <View style={styles.inlineStatus}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.helperText}>{progress}% uploaded</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.ok}>{result.created} students uploaded.</Text>
          {result.skippedDuplicates.length ? (
            <Text style={styles.helperText}>
              {result.skippedDuplicates.length} duplicates skipped.
            </Text>
          ) : null}
          {result.errors.map((error) => (
            <Text key={`${error.studentId}-${error.message}`} style={styles.error}>
              {error.studentId}: {error.message}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  helperText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  iconAction: {
    alignItems: 'center',
    backgroundColor: '#EFF3F8',
    borderRadius: theme.radius.sm,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  secondaryActionText: {
    color: theme.colors.secondary,
    fontWeight: '800',
  },
  fileName: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  error: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  ok: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  summaryText: {
    backgroundColor: '#EFF3F8',
    borderRadius: theme.radius.sm,
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  table: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#EFF3F8',
  },
  cell: {
    borderColor: theme.colors.border,
    borderRightWidth: 1,
    color: theme.colors.text,
    fontSize: 12,
    minHeight: 40,
    padding: theme.spacing.sm,
    width: 132,
  },
  headingCell: {
    fontWeight: '800',
  },
  progressTrack: {
    backgroundColor: '#E5EAF1',
    borderRadius: theme.radius.sm,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: theme.colors.primary,
    height: '100%',
  },
  inlineStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  resultBox: {
    backgroundColor: '#F8FAFC',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
});
