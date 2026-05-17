import { httpsCallable } from 'firebase/functions';

import { getFirebaseFunctions } from '@/services/firebase/functions';
import type {
  PaymentIntentPayload,
  PaymentIntentResult,
  PaymentProvider,
  PaymentVerificationResult,
} from '@/services/payments/types';

export class CloudFunctionPaymentProvider implements PaymentProvider {
  constructor(private readonly provider: PaymentIntentResult['provider']) {}

  async createIntent(payload: PaymentIntentPayload) {
    const callable = httpsCallable<
      PaymentIntentPayload & { provider: PaymentIntentResult['provider'] },
      PaymentIntentResult
    >(getFirebaseFunctions(), 'createPaymentIntent');

    const response = await callable({
      ...payload,
      provider: this.provider,
    });

    return response.data;
  }

  async verifyTransaction(reference: string): Promise<PaymentVerificationResult> {
    const callable = httpsCallable<
      { provider: PaymentIntentResult['provider']; reference: string },
      PaymentVerificationResult
    >(getFirebaseFunctions(), 'verifyPaymentTransaction');

    const response = await callable({
      provider: this.provider,
      reference,
    });

    return response.data;
  }
}
