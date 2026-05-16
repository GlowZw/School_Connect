import { getStorage } from 'firebase/storage';

import { firebaseApp } from '@/services/firebase/config';

export const storage = getStorage(firebaseApp);
