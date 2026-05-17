import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/services/firebase/storage';

const maxFileSizeBytes = 5 * 1024 * 1024;
const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

export type UploadMediaInput = {
  schoolId: string;
  folder: string;
  fileName: string;
  blob: Blob;
  contentType: string;
};

export function validateMediaUpload(contentType: string, size: number) {
  if (!allowedMimeTypes.includes(contentType)) {
    throw new Error('Unsupported file type.');
  }

  if (size > maxFileSizeBytes) {
    throw new Error('File exceeds the 5MB upload limit.');
  }
}

export async function uploadSchoolMedia({
  schoolId,
  folder,
  fileName,
  blob,
  contentType,
}: UploadMediaInput) {
  validateMediaUpload(contentType, blob.size);

  const mediaRef = ref(storage, `schools/${schoolId}/${folder}/${fileName}`);
  await uploadBytes(mediaRef, blob, {
    contentType,
    cacheControl: 'public,max-age=3600',
  });

  return getDownloadURL(mediaRef);
}
