export type MfName = 'dashboard' | 'trade' | 'payment' | 'analytics';

export interface PaymentSelectedDetail {
  paymentId: string;
  beneficiary: string;
  amount: string;
  status: 'Completed' | 'Processing' | 'Awaiting approval';
}

export type MfEventMap = {
  'mf:ready': { mf: MfName };
  'mf:error': { mf: MfName; message: string };
  'mf:navigate': { path: string };
  'payment:selected': PaymentSelectedDetail;
  'payment:context-requested': { consumer: 'trade' };
};

export type MfEventName = keyof MfEventMap;

export declare function emitMfEvent<K extends MfEventName>(
  name: K,
  detail: MfEventMap[K],
): void;
