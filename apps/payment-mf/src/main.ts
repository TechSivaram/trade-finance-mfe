import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { PaymentComponent } from './app/payment.component';

(async () => {
  const app = await createApplication({ providers: [] });
  const paymentElement = createCustomElement(PaymentComponent, { injector: app.injector });
  if (!customElements.get('payment-app')) {
    customElements.define('payment-app', paymentElement);
  }
})();
