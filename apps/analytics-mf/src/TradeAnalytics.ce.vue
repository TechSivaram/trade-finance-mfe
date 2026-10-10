<script setup lang="ts">
import { computed, ref } from 'vue';
const period = ref('Last 30 days');
const volume = computed(() => period.value === 'Last 7 days' ? '$1.26M' : period.value === 'Last 90 days' ? '$11.72M' : '$4.82M');
const instruments = computed(() => {
    const factor = period.value === 'Last 7 days' ? 0.45 : period.value === 'Last 90 days' ? 1.5 : 1;
    return [
        { name: 'Letters of credit', amount: `$${(2.1 * factor).toFixed(2)}M`, width: '86%' },
        { name: 'Documentary collections', amount: `$${(1.35 * factor).toFixed(2)}M`, width: '61%' },
        { name: 'Open account', amount: `$${(0.92 * factor).toFixed(2)}M`, width: '43%' },
        { name: 'Guarantees', amount: `$${(0.45 * factor).toFixed(2)}M`, width: '25%' }
    ];
});
</script>
<template>
    <section class="analytics">
        <div class="heading">
            <div>
                <p class="eyebrow">TRADE INTELLIGENCE · TRADE ANALYTICS MICROFRONTEND</p>
                <h2>Trade analytics</h2>
                <p class="subtitle">Portfolio trends and operational performance.</p>
            </div><label class="range-label">Period<select v-model="period" aria-label="Analytics period">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                </select></label>
        </div>
        <div class="metrics">
            <article class="metric"><span>Trade volume</span><strong>{{ volume }}</strong><small class="good">↑ 8.4% vs
                    prior period</small></article>
            <article class="metric"><span>On-time settlement</span><strong>96.8%</strong><small class="good">↑ 1.2
                    percentage points</small></article>
            <article class="metric"><span>Average processing</span><strong>2.4 days</strong><small>Across active
                    instruments</small></article>
        </div>
        <section class="card">
            <div class="card-head">
                <div>
                    <h3>Volume by instrument</h3>
                    <p>Illustrative values for {{ period.toLowerCase() }}</p>
                </div><span class="tag">DEMO DATA</span>
            </div>
            <div class="chart">
                <div v-for="item in instruments" :key="item.name" class="bar-row">
                    <div class="bar-label"><span>{{ item.name }}</span><strong>{{ item.amount }}</strong></div>
                    <div class="track">
                        <div class="bar" :style="{ width: item.width }"></div>
                    </div>
                </div>
            </div>
        </section>
        <p class="footnote">Trade Analytics is loaded as an independent microfrontend.</p>
    </section>
</template>
<style>
:host {
    display: block;
    color: #17233b;
    font-family: 'DM Sans', Arial, sans-serif
}

* {
    box-sizing: border-box
}

.analytics {
    padding: 2px 0 12px
}

.heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 24px
}

.eyebrow {
    color: #47718f;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.2px;
    margin: 0 0 8px
}

h2 {
    font-size: 27px;
    letter-spacing: -.8px;
    margin: 0;
    color: #15283b
}

.subtitle {
    margin: 7px 0 0;
    color: #7a8997;
    font-size: 13px
}

.range-label {
    color: #748393;
    font-size: 11px;
    display: grid;
    gap: 6px
}

select {
    border: 1px solid #dfe6ed;
    border-radius: 7px;
    padding: 9px 10px;
    background: white;
    color: #536477;
    font-size: 12px
}

.metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 22px
}

.metric {
    border: 1px solid #e6ebf0;
    border-radius: 12px;
    padding: 18px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 9px
}

.metric span {
    color: #748393;
    font-size: 12px;
    font-weight: 600
}

.metric strong {
    color: #1c2e40;
    font-size: 27px;
    letter-spacing: -.6px
}

.metric small {
    color: #8492a0;
    font-size: 11px
}

.metric .good {
    color: #21835b
}

.card {
    border: 1px solid #e6ebf0;
    border-radius: 12px;
    overflow: hidden;
    background: white
}

.card-head {
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid #edf1f5
}

h3 {
    font-size: 15px;
    margin: 0;
    color: #233649
}

.card-head p {
    margin: 5px 0 0;
    color: #8794a1;
    font-size: 11px
}

.tag {
    color: #5470c9;
    background: #edf1ff;
    border-radius: 5px;
    padding: 5px 7px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .6px
}

.chart {
    padding: 22px;
    display: grid;
    gap: 20px
}

.bar-row {
    display: grid;
    gap: 9px
}

.bar-label {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    color: #617185
}

.bar-label strong {
    color: #2b3e52
}

.track {
    height: 10px;
    background: #edf1f7;
    border-radius: 10px;
    overflow: hidden
}

.bar {
    height: 100%;
    border-radius: 10px;
    background: linear-gradient(90deg, #526ce0, #49b6a3);
    transition: width .25s ease
}

.footnote {
    margin: 12px 0 0;
    font-size: 10px;
    color: #9aa5af
}

@media(max-width:700px) {
    .heading {
        align-items: flex-start;
        flex-direction: column
    }

    .metrics {
        grid-template-columns: 1fr
    }
}
</style>
