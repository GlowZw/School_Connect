import { CloudFunctionPaymentProvider } from '@/services/payments/provider';
import type { PaymentProvider, PaymentProviderKey } from '@/services/payments/types';

const providerRegistry: Record<PaymentProviderKey, PaymentProvider> = {
  mock: new CloudFunctionPaymentProvider('mock'),
  paynow: new CloudFunctionPaymentProvider('paynow'),
  stripe: new CloudFunctionPaymentProvider('stripe'),
  paypal: new CloudFunctionPaymentProvider('paypal'),
  ecocash: new CloudFunctionPaymentProvider('ecocash'),
  onemoney: new CloudFunctionPaymentProvider('onemoney'),
  bank: new CloudFunctionPaymentProvider('bank'),
};

export function getPaymentProvider(provider: PaymentProviderKey) {
  return providerRegistry[provider];
}
