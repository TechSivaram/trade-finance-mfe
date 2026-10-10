/**
 * Mock implementation of GET /api/payments/:paymentId.
 * Replace this module with a real HTTP client when the Spring Boot API exists.
 */
export interface PaymentDetails {
  paymentId: string;
  beneficiary: string;
  invoice: string;
  amount: string;
  currency: string;
  method: string;
  status: 'Completed' | 'Processing' | 'Awaiting approval';
  valueDate: string;
  reference: string;
}

const payments: Record<string, PaymentDetails> = {
  'PAY-2026-0821': {
    paymentId: 'PAY-2026-0821', beneficiary: 'Meridian Logistics', invoice: 'INV-8831',
    amount: '$84,250.00', currency: 'USD', method: 'SWIFT', status: 'Completed',
    valueDate: '10 Oct 2026', reference: 'SWF-93810482',
  },
  'PAY-2026-0820': {
    paymentId: 'PAY-2026-0820', beneficiary: 'Pacific Components', invoice: 'INV-8827',
    amount: '$126,000.00', currency: 'USD', method: 'SEPA', status: 'Processing',
    valueDate: '11 Oct 2026', reference: 'SEP-48290115',
  },
  'PAY-2026-0819': {
    paymentId: 'PAY-2026-0819', beneficiary: 'Atlas Manufacturing', invoice: 'INV-8819',
    amount: '$42,800.00', currency: 'USD', method: 'SWIFT', status: 'Awaiting approval',
    valueDate: '12 Oct 2026', reference: 'SWF-77531028',
  },
  'PAY-2026-0818': {
    paymentId: 'PAY-2026-0818', beneficiary: 'Northstar Imports', invoice: 'INV-8812',
    amount: '$19,500.00', currency: 'USD', method: 'ACH', status: 'Completed',
    valueDate: '09 Oct 2026', reference: 'ACH-21874019',
  },
  'PAY-2026-0817': {
    paymentId: 'PAY-2026-0817', beneficiary: 'Bluewater Trading', invoice: 'INV-8805',
    amount: '$73,100.00', currency: 'USD', method: 'SWIFT', status: 'Processing',
    valueDate: '13 Oct 2026', reference: 'SWF-60198234',
  },
};

const wait = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds));

export async function getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
  // Simulate network latency so the UI's loading state can be observed.
  await wait(350);
  const payment = payments[paymentId];
  if (!payment) {
    throw new Error(`Payment ${paymentId} was not found (mock HTTP 404).`);
  }
  // Return a copy, as a real API response would be independent data.
  return { ...payment };
}
