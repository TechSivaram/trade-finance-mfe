import { Component, OnInit } from '@angular/core';
import { emitMfEvent } from '@trade-finance/mf-contracts';

interface PaymentRecord {
  id: string;
  beneficiary: string;
  invoice: string;
  amount: string;
  method: string;
  status: 'Completed' | 'Processing' | 'Awaiting approval';
}

@Component({
  selector: 'app-payment',
  standalone: true,
  template: `
    <section class="payments">
      <div class="page-heading">
        <div><p class="eyebrow">PAYMENT OPERATIONS · ANGULAR MICROFRONTEND</p><h2>Payments</h2><p class="subheading">Track outgoing payments across your trade portfolio.</p></div>
        <button class="primary" (click)="showNotice = true">＋ Initiate payment</button>
      </div>
      <div class="metrics">
        <article class="metric"><span>Payments today</span><strong>128</strong><small class="positive">↑ 12% vs yesterday</small></article>
        <article class="metric"><span>Total value</span><strong>$2.84M</strong><small>Across all payment rails</small></article>
        <article class="metric"><span>Awaiting approval</span><strong>7</strong><small class="warning">Needs attention</small></article>
      </div>
      @if (showNotice) {
        <div class="notice" role="status"><strong>Demo only.</strong> Payment initiation would call a secured Payments API. <button class="dismiss" (click)="showNotice = false" aria-label="Dismiss">×</button></div>
      }
      <section class="table-card">
        <div class="table-heading"><div><h3>Payment register</h3><p>Recent payment instructions and settlement status</p></div>
          <select aria-label="Filter payments" [value]="filter" (change)="onFilterChange($event)"><option>All payments</option><option>Completed</option><option>Processing</option><option>Awaiting approval</option></select>
        </div>
        <div class="table-wrap"><table><thead><tr><th>PAYMENT ID</th><th>BENEFICIARY</th><th>INVOICE</th><th>AMOUNT</th><th>METHOD</th><th>STATUS</th><th>ACTION</th></tr></thead>
          <tbody>@for (payment of filteredPayments; track payment.id) {
            <tr><td class="id">{{ payment.id }}</td><td><strong>{{ payment.beneficiary }}</strong></td><td>{{ payment.invoice }}</td><td class="amount">{{ payment.amount }}</td><td>{{ payment.method }}</td><td><span class="pill" [class.completed]="payment.status === 'Completed'" [class.processing]="payment.status === 'Processing'" [class.awaiting]="payment.status === 'Awaiting approval'">{{ payment.status }}</span></td><td><button class="select-payment" type="button" (click)="selectPayment(payment)">Select</button></td></tr>
          }</tbody></table></div>
      </section>
      <p class="footnote">Payments is an independent microfrontend.</p>
    </section>
  `,
  styles: [`
    :host { display:block; color:#1d2b3a; }
    * { box-sizing:border-box; }
    .payments { padding: 2px 0 12px; }
    .page-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:24px; }
    .eyebrow { color:#47718f; font-size:10px; font-weight:800; letter-spacing:1.2px; margin:0 0 8px; }
    h2 { font-size:27px; letter-spacing:-.8px; margin:0; color:#15283b; }
    .subheading { margin:7px 0 0; color:#7a8997; font-size:13px; }
    .primary { border:0; border-radius:8px; padding:11px 15px; background:#1769aa; color:white; font-weight:700; cursor:pointer; white-space:nowrap; }
    .metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:22px; }
    .metric { border:1px solid #e6ebf0; border-radius:12px; padding:18px; background:#fff; display:flex; flex-direction:column; gap:9px; }
    .metric span { color:#748393; font-size:12px; font-weight:600; }
    .metric strong { color:#1c2e40; font-size:27px; letter-spacing:-.6px; }
    .metric small { color:#8492a0; font-size:11px; }
    .metric .positive { color:#21835b; } .metric .warning { color:#b77820; }
    .table-card { border:1px solid #e6ebf0; border-radius:12px; overflow:hidden; background:white; }
    .table-heading { padding:18px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
    h3 { font-size:15px; margin:0; color:#233649; } .table-heading p { margin:5px 0 0; color:#8794a1; font-size:11px; }
    select { border:1px solid #dfe6ed; border-radius:7px; padding:9px 10px; background:white; color:#536477; font-size:11px; }
    .table-wrap { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; font-size:11px; text-align:left; white-space:nowrap; }
    th { background:#f8fafc; padding:12px 16px; color:#81909f; font-size:9px; letter-spacing:.65px; font-weight:800; }
    td { padding:15px 16px; border-top:1px solid #edf1f5; color:#68798a; }
    td strong { color:#34475a; font-weight:650; } .id { color:#2475b5; font-weight:700; } .amount { color:#263b4e; font-weight:750; }
    .pill { display:inline-block; border-radius:20px; padding:5px 8px; font-size:10px; font-weight:700; }
    .completed { color:#18825b; background:#e7f7ef; } .processing { color:#226ab1; background:#e8f2fc; } .awaiting { color:#a76b19; background:#fff3dc; }
    .notice { position:relative; margin:-5px 0 18px; padding:13px 42px 13px 14px; border:1px solid #cfe4f5; border-radius:8px; background:#f0f8ff; color:#31566f; font-size:12px; }
    .dismiss { position:absolute; right:10px; top:7px; border:0; background:transparent; font-size:20px; cursor:pointer; color:#31566f; }
    .select-payment { border:1px solid #cbdced; border-radius:6px; padding:6px 10px; background:#f2f8fd; color:#1769aa; font-size:11px; font-weight:700; cursor:pointer; }
    .select-payment:hover { background:#e4f1fc; }
    .footnote { margin:12px 0 0; font-size:10px; color:#9aa5af; }
    @media (max-width:700px) { .page-heading { align-items:flex-start; flex-direction:column; } .metrics { grid-template-columns:1fr; } }
  `]
})
export class PaymentComponent implements OnInit {
  ngOnInit(): void {
    emitMfEvent('mf:ready', { mf: 'payment' });
  }

  filter = 'All payments';
  showNotice = false;
  readonly payments: PaymentRecord[] = [
    { id: 'PAY-2026-0821', beneficiary: 'Meridian Logistics', invoice: 'INV-8831', amount: '$84,250.00', method: 'SWIFT', status: 'Completed' },
    { id: 'PAY-2026-0820', beneficiary: 'Pacific Components', invoice: 'INV-8827', amount: '$126,000.00', method: 'SEPA', status: 'Processing' },
    { id: 'PAY-2026-0819', beneficiary: 'Atlas Manufacturing', invoice: 'INV-8819', amount: '$42,800.00', method: 'SWIFT', status: 'Awaiting approval' },
    { id: 'PAY-2026-0818', beneficiary: 'Northstar Imports', invoice: 'INV-8812', amount: '$19,500.00', method: 'ACH', status: 'Completed' },
    { id: 'PAY-2026-0817', beneficiary: 'Bluewater Trading', invoice: 'INV-8805', amount: '$73,100.00', method: 'SWIFT', status: 'Processing' }
  ];

  get filteredPayments(): PaymentRecord[] {
    return this.filter === 'All payments' ? this.payments : this.payments.filter(payment => payment.status === this.filter);
  }

  onFilterChange(event: Event): void {
    this.filter = (event.target as HTMLSelectElement).value;
  }

  selectPayment(payment: PaymentRecord): void {
    emitMfEvent('payment:selected', {
      paymentId: payment.id,
      beneficiary: payment.beneficiary,
      amount: payment.amount,
      status: payment.status,
    });
  }
}
