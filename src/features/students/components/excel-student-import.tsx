import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { read, utils } from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SuccessModal } from '@/components/ui/status-modal';
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

type ColumnMapping = Record<SupportedColumn, string>;

const supportedColumns = [
  'studentName',
  'surname',
  'grade',
  'dob',
  'parentName',
  'parentEmail',
  'parentPhone',
  'studentNumber',
] as const;

type SupportedColumn = (typeof supportedColumns)[number];

const columnLabels: Record<SupportedColumn, string> = {
  studentName: 'Student Name',
  surname: 'Surname',
  grade: 'Grade',
  dob: 'DOB',
  parentName: 'Parent',
  parentEmail: 'Email',
  parentPhone: 'Phone',
  studentNumber: 'Student Number',
};

const headerAliases: Record<SupportedColumn, string[]> = {
  studentName: ['student name', 'first name', 'firstname', 'name', 'student'],
  surname: ['surname', 'last name', 'lastname', 'family name'],
  grade: ['grade', 'grade year', 'year'],
  dob: ['dob', 'date of birth', 'birth date', 'dateofbirth'],
  parentName: ['parent', 'parent name', 'guardian', 'guardian name'],
  parentEmail: ['email', 'parent email', 'guardian email'],
  parentPhone: ['phone', 'parent phone', 'mobile', 'cell'],
  studentNumber: ['student number', 'student no', 'student id', 'studentid', 'student_id'],
};

function detectMapping(headers: string[]) {
  return supportedColumns.reduce<ColumnMapping>((mapping, column) => {
    const match = headers.find((header) => headerAliases[column].includes(normalizeHeader(header)));
    mapping[column] = match ?? '';
    return mapping;
  }, {} as ColumnMapping);
}

function getValue(row: Record<string, unknown>, keys: string[]) {
  const normalizedEntries = Object.entries(row).map(
    ([key, value]) => [normalizeHeader(key), value] as const,
  );
  for (const key of keys) {
    const normalizedKey = normalizeHeader(key);
    const value =
      row[key] ?? normalizedEntries.find(([entryKey]) => entryKey === normalizedKey)?.[1];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return '';
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) {
    return trimmed;
  }

  const [, day, month, rawYear] = match;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(date.getTime()) ? trimmed : date.toISOString().slice(0, 10);
}

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? '', surname: '' };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    surname: parts[parts.length - 1],
  };
}

function applyColumnMapping(row: Record<string, unknown>, mapping: ColumnMapping) {
  return supportedColumns.reduce<Record<string, unknown>>((mappedRow, column) => {
    const sourceHeader = mapping[column];
    mappedRow[columnLabels[column]] = sourceHeader ? row[sourceHeader] : '';
    return mappedRow;
  }, {});
}

function normalizeRow(
  row: Record<string, unknown>,
  schoolId: string,
  rowNumber: number,
  mapping?: ColumnMapping,
): PreviewRow {
  const sourceRow = mapping ? applyColumnMapping(row, mapping) : row;
  const studentNumber = getValue(sourceRow, headerAliases.studentNumber);
  const rawStudentName = getValue(sourceRow, headerAliases.studentName);
  const explicitSurname = getValue(sourceRow, headerAliases.surname);
  const split = splitName(rawStudentName);
  const firstName = split.firstName;
  const surname = explicitSurname || split.surname;
  const grade = getValue(sourceRow, headerAliases.grade);
  const dob = normalizeDate(getValue(sourceRow, headerAliases.dob));
  const parentName = getValue(sourceRow, headerAliases.parentName);
  const parentEmail = getValue(sourceRow, headerAliases.parentEmail);
  const parentPhone = getValue(sourceRow, headerAliases.parentPhone);
  const studentId =
    studentNumber || `${firstName}-${surname}-${dob}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const errors = [
    !firstName ? 'Student Name is required' : '',
    !surname ? 'Surname is required' : '',
    !grade ? 'Grade is required' : '',
    !dob ? 'DOB is required' : '',
    dob && Number.isNaN(new Date(dob).getTime()) ? 'DOB is invalid' : '',
  ].filter(Boolean);

  return {
    rowNumber,
    studentId,
    studentNumber,
    firstName,
    surname,
    grade,
    dob,
    parentName,
    parentEmail,
    parentPhone,
    schoolId,
    errors,
    duplicateInFile: false,
    duplicateInFirestore: false,
  };
}

async function buildPreviewRows(
  rows: Array<Record<string, unknown>>,
  schoolId: string,
  mapping: ColumnMapping,
) {
  const seen = new Map<string, number>();
  const normalizedRows = rows.map((row, index) => normalizeRow(row, schoolId, index + 2, mapping));

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

async function parseWorkbook(uri: string, schoolId: string) {
  const response = await fetch(uri);
  const data = await response.arrayBuffer();
  const workbook = read(data, { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error('The workbook does not contain any sheets.');
  }

  const rows = utils
    .sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: '',
      raw: false,
    })
    .filter((row) => Object.values(row).some((value) => String(value).trim()));
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const mapping = detectMapping(headers);
  const previewRows = await buildPreviewRows(rows, schoolId, mapping);

  return { headers, mapping, previewRows, rows };
}

export function ExcelStudentImport({ schoolId, role }: ExcelStudentImportProps) {
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [rawRows, setRawRows] = useState<Array<Record<string, unknown>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<StudentImportResult | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

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
      setSuccessVisible(true);
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
      const parsedWorkbook = await parseWorkbook(asset.uri, schoolId);
      setRows(parsedWorkbook.previewRows);
      setRawRows(parsedWorkbook.rows);
      setHeaders(parsedWorkbook.headers);
      setColumnMapping(parsedWorkbook.mapping);
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
    setRawRows([]);
    setHeaders([]);
    setColumnMapping(null);
    setParseError(null);
    setProgress(0);
    setResult(null);
  };

  const remapColumn = async (column: SupportedColumn) => {
    if (!schoolId || headers.length === 0 || !columnMapping) {
      return;
    }

    const currentIndex = Math.max(headers.indexOf(columnMapping[column]), -1);
    const nextMapping = {
      ...columnMapping,
      [column]: headers[(currentIndex + 1) % headers.length],
    };

    setColumnMapping(nextMapping);
    setIsParsing(true);
    try {
      setRows(await buildPreviewRows(rawRows, schoolId, nextMapping));
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Excel student import</Text>
          <Text style={styles.helperText}>Upload .xlsx or .xls files into this school only.</Text>
          <Text style={styles.helperText}>
            Supported columns: {supportedColumns.map((column) => columnLabels[column]).join(', ')}
          </Text>
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

          {columnMapping ? (
            <View style={styles.mappingGrid}>
              {supportedColumns.map((column) => (
                <Pressable
                  key={column}
                  onPress={() => remapColumn(column)}
                  style={styles.mappingChip}
                >
                  <Text style={styles.mappingLabel}>{columnLabels[column]}</Text>
                  <Text style={styles.mappingValue}>{columnMapping[column] || 'Unmapped'}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                {[
                  'Student Number',
                  'Student Name',
                  'Surname',
                  'Grade',
                  'DOB',
                  'Parent',
                  'Email',
                  'Phone',
                  'Status',
                ].map((heading) => (
                  <Text key={heading} style={[styles.cell, styles.headingCell]}>
                    {heading}
                  </Text>
                ))}
              </View>
              {rows.slice(0, 30).map((row) => (
                <View key={`${row.studentId}-${row.rowNumber}`} style={styles.tableRow}>
                  <Text style={styles.cell}>{row.studentNumber || row.studentId || '-'}</Text>
                  <Text style={styles.cell}>{row.firstName || '-'}</Text>
                  <Text style={styles.cell}>{row.surname || '-'}</Text>
                  <Text style={styles.cell}>{row.grade || '-'}</Text>
                  <Text style={styles.cell}>{row.dob || '-'}</Text>
                  <Text style={styles.cell}>{row.parentName || '-'}</Text>
                  <Text style={styles.cell}>{row.parentEmail || '-'}</Text>
                  <Text style={styles.cell}>{row.parentPhone || '-'}</Text>
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
      <SuccessModal
        message="Student import has been processed."
        onClose={() => setSuccessVisible(false)}
        title="Creation Successful"
        visible={successVisible}
      />
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
  mappingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  mappingChip: {
    backgroundColor: '#F8FAFC',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    width: 160,
  },
  mappingLabel: {
    color: theme.colors.mutedText,
    fontSize: 11,
    fontWeight: '700',
  },
  mappingValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
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
