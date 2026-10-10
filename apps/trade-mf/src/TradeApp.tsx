import { useEffect, useState } from 'react';
import { emitMfEvent } from '@trade-finance/mf-contracts';
import type { PaymentSelectedDetail } from '@trade-finance/mf-contracts';
import { getPaymentDetails } from './api/mockPayments';
import type { PaymentDetails } from './api/mockPayments';

const initial = [
  { id: 'TR-2026-1048', name: 'Northstar Imports', instrument: 'Letter of Credit', amount: '$248,500', status: 'In review', date: '10 Oct 2026' },
  { id: 'TR-2026-1047', name: 'Meridian Global', instrument: 'Documentary Collection', amount: '$96,200', status: 'Approved', date: '09 Oct 2026' },
  { id: 'TR-2026-1046', name: 'Atlas Components', instrument: 'Letter of Credit', amount: '$512,000', status: 'Pending docs', date: '09 Oct 2026' },
  { id: 'TR-2026-1045', name: 'BluePeak Trading', instrument: 'Bank Guarantee', amount: '$74,800', status: 'Approved', date: '08 Oct 2026' },
  { id: 'TR-2026-1044', name: 'Crestline Exports', instrument: 'Standby LC', amount: '$188,000', status: 'In review', date: '07 Oct 2026' },
];

export default function TradeApp() {
  const [filter, setFilter] = useState('All statuses');
  const [showForm, setShowForm] = useState(false);
  const [trades, setTrades] = useState(initial);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const shown = trades.filter(t => filter === 'All statuses' || t.status === filter);

  useEffect(() => {
    let requestVersion = 0;

    const onPaymentSelected = (event: Event) => {
      const detail = (event as CustomEvent<PaymentSelectedDetail>).detail;
      if (!detail?.paymentId) return;

      const currentRequest = ++requestVersion;
      setSelectedPaymentId(detail.paymentId);
      setPayment(null);
      setPaymentError('');
      setPaymentLoading(true);

      getPaymentDetails(detail.paymentId)
        .then(result => {
          if (currentRequest === requestVersion) setPayment(result);
        })
        .catch(error => {
          if (currentRequest === requestVersion) {
            setPaymentError(error instanceof Error ? error.message : 'Unable to load payment details.');
          }
        })
        .finally(() => {
          if (currentRequest === requestVersion) setPaymentLoading(false);
        });
    };

    window.addEventListener('payment:selected', onPaymentSelected);
    // If a payment was selected before the user opened Trade MF, ask the Shell
    // to replay its current selection through the documented event contract.
    emitMfEvent('payment:context-requested', { consumer: 'trade' });

    return () => {
      requestVersion++;
      window.removeEventListener('payment:selected', onPaymentSelected);
    };
  }, []);

  function addTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !amount.trim()) return;
    setTrades([{ id: `TR-2026-${1049 + trades.length - initial.length}`, name, instrument: 'Letter of Credit', amount: amount.startsWith('$') ? amount : `$${amount}`, status: 'Pending docs', date: '10 Oct 2026' }, ...trades]);
    setName('');
    setAmount('');
    setShowForm(false);
  }

  return (
    <section className="content">
      <div className="remote-banner">REMOTE MODULE <b>• TRADE-MF</b></div>
      <div className="page-heading">
        <div><h2>Trade finance</h2><p className="muted">Manage trade instruments, counterparties and documentation.</p></div>
        <button className="primary-btn" onClick={() => setShowForm(!showForm)}>＋ New trade</button>
      </div>
      <div className="notice">ⓘ This screen is independently loaded from the Trade microfrontend on port 5002.</div>

      <section className="panel payment-detail-panel" aria-live="polite">
        <div className="panel-header">
          <div><h3>Selected payment details</h3><p>Payment MF event → mock Payments API</p></div>
          {payment && <span className={`pill ${payment.status === 'Completed' ? 'green' : payment.status === 'Processing' ? 'blue' : 'amber'}`}>{payment.status}</span>}
        </div>
        {!selectedPaymentId && <p className="payment-state">Select a payment from the Payments page to load its details here.</p>}
        {paymentLoading && <p className="payment-state">Loading payment details for {selectedPaymentId}…</p>}
        {paymentError && <p className="payment-state payment-error" role="alert">{paymentError}</p>}
        {payment && !paymentLoading && (
          <div className="payment-details-grid">
            <div><span>Payment ID</span><strong>{payment.paymentId}</strong></div>
            <div><span>Beneficiary</span><strong>{payment.beneficiary}</strong></div>
            <div><span>Invoice</span><strong>{payment.invoice}</strong></div>
            <div><span>Amount</span><strong>{payment.amount} {payment.currency}</strong></div>
            <div><span>Payment method</span><strong>{payment.method}</strong></div>
            <div><span>Value date</span><strong>{payment.valueDate}</strong></div>
            <div><span>Bank reference</span><strong>{payment.reference}</strong></div>
          </div>
        )}
        <p className="mock-note">Mock API only: details are returned by local TypeScript data with simulated network latency. No HTTP request or backend is running.</p>
      </section>

      {showForm && <form className="panel" style={{ padding: 20, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }} onSubmit={addTrade}>
        <input className="filter" placeholder="Counterparty name" value={name} onChange={e => setName(e.target.value)} required />
        <input className="filter" placeholder="Amount (e.g. 125000)" value={amount} onChange={e => setAmount(e.target.value)} required />
        <button className="primary-btn" type="submit">Create trade</button>
      </form>}

      <section className="panel">
        <div className="panel-header"><div><h3>Trade register</h3><p>{shown.length} trade instruments</p></div>
          <select className="filter" value={filter} onChange={e => setFilter(e.target.value)}><option>All statuses</option><option>Approved</option><option>In review</option><option>Pending docs</option></select>
        </div>
        <div className="table-wrap"><table><thead><tr><th>Trade ID</th><th>Counterparty</th><th>Instrument</th><th>Amount</th><th>Opened</th><th>Status</th></tr></thead>
          <tbody>{shown.map(t => <tr key={t.id}><td className="id">{t.id}</td><td><strong>{t.name}</strong></td><td>{t.instrument}</td><td><strong>{t.amount}</strong></td><td>{t.date}</td><td><span className={`pill ${t.status === 'Approved' ? 'green' : t.status === 'In review' ? 'blue' : 'amber'}`}>{t.status}</span></td></tr>)}</tbody>
        </table></div>
      </section>
    </section>
  );
}
