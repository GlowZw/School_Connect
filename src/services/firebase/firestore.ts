import { getFirestore } from 'firebase/firestore';

import { firebaseApp } from '@/services/firebase/config';

export const firestore = getFirestore(firebaseApp);
