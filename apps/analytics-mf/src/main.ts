import { defineCustomElement } from "vue";
import TradeAnalytics from "./TradeAnalytics.ce.vue";
const TradeAnalyticsElement = defineCustomElement(TradeAnalytics);
if (!customElements.get("trade-analytics"))
  customElements.define("trade-analytics", TradeAnalyticsElement);
