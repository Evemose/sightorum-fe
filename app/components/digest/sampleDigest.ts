/**
 * Sample payload used as the starter JSON in the playground editor.
 * Mirrors the spec format from `app/components/viz/BACKEND_SPEC.md`.
 * Tokens may be uppercase (BASE, SEVERITY_AMBER, Y, DASHED) — the renderer
 * normalizes them to the lowercase kebab-case form the components expect.
 */
export const sampleDigestJson = JSON.stringify({
  id: 'digest-excursion-analysis-2015-2024',
  title: 'Cold-Chain Excursion Rate Analysis — 2015–2024',
  punchline: {
    text: 'HUB_SW (Phoenix) contributes 32% of all excursions at a 13.9% rate, hospital sites run 10× above pharmacies (12.1% vs 1.2%), and a dominant annual summer cycle peaks at 22–28% in July every year — with no structural improvement observed over ten years.',
  },
  generatedAt: '2025-01-15T00:00:00Z',
  pages: [
    {
      id: 'page-composition',
      header: {
        title: 'Excursion Rate Composition — by Hub & Site Type',
        tag: 'COMPOSITION',
      },
      headline: {
        text: 'The fleet-wide excursion rate is **6.5%** (N = 563,028), but individual cold nodes span an **85×** range, and site type splits hospitals (**12.1%**) from pharmacies (**1.2%**) by nearly 10×.',
      },
      primaryChart: {
        kind: 'influence-curtain',
        scaffold: {
          title: 'Hub Contribution to Total Excursion Volume',
          subtitle: 'Cumulative share of all 36,589 excursion events',
          colorRole: 'BASE',
          height: 400,
          referenceLines: [
            { axis: 'Y', value: 80, label: '80% threshold', style: 'DASHED' },
          ],
        },
        data: {
          items: [
            { key: 'HUB_SW (Phoenix)', contribution: 32.20, cumulative: 32.20, color: 'FOCAL' },
            { key: 'HUB_SE (Atlanta)', contribution: 20.42, cumulative: 52.62, color: 'FOCAL' },
            { key: 'HUB_NE (Edison NJ)', contribution: 16.43, cumulative: 69.05, color: 'BASE' },
            { key: 'HUB_SC (Dallas)', contribution: 12.97, cumulative: 82.02, color: 'BASE' },
            { key: 'HUB_MT (Denver)', contribution: 8.86, cumulative: 90.88, color: 'BASE_MUTED' },
            { key: 'HUB_MW (Indianapolis)', contribution: 6.47, cumulative: 97.35, color: 'BASE_MUTED' },
            { key: 'HUB_PNW (Portland)', contribution: 2.64, cumulative: 99.99, color: 'BASE_MUTED' },
          ],
        },
      },
      caption: {
        text: 'HUB_SW and HUB_SE together account for 52.6% of all excursion events while operating in hot-desert and humid-subtropical climates respectively.',
      },
      firedChecks: [
        {
          code: 'C1',
          severity: 'HIGH',
          text: 'The aggregate masks strong heterogeneity on at least 6 axes; the broadest spread is across cold nodes (85× from 0.24% to 20.8%).',
        },
        {
          code: 'C2',
          severity: 'MED',
          text: 'Distribution is highly right-skewed (skew = 4.69, excess kurtosis = 19.99); the fleet mean is pulled upward by a small set of high-rate nodes.',
        },
      ],
      receipts: [
        { label: 'window', value: '2015-01-01 → 2025-01-01' },
        { label: 'population', value: 'all shipments, no filter (N = 563,028)' },
        { label: 'archetype', value: 'summaryStatistic' },
      ],
    },
    {
      id: 'page-ranking',
      header: {
        title: 'Excursion Rate by Hub — All 7 Hubs Ranked',
        tag: 'RANK',
      },
      headline: {
        text: 'HUB_SW (Phoenix) has the highest excursion rate at **13.9%** — nearly **10×** the rate at HUB_PNW (Portland) at **1.4%**.',
      },
      primaryChart: {
        kind: 'horizontal-bar',
        scaffold: {
          title: 'Excursion Rate by Hub (All Shipments, 2015–2024)',
          subtitle: 'N per hub shown in label',
          colorRole: 'BASE',
          height: 350,
          referenceLines: [
            { axis: 'X', value: 0.065, label: 'Fleet avg 6.5%', style: 'DASHED' },
          ],
        },
        data: {
          items: [
            { key: 'HUB_SW (Phoenix AZ)', value: 0.13874, label: 'N=84,924', color: 'SEVERITY_AMBER' },
            { key: 'HUB_SE (Atlanta GA)', value: 0.08233, label: 'N=90,773', color: 'SEVERITY_AMBER' },
            { key: 'HUB_NE (Edison NJ)', value: 0.05973, label: 'N=100,672', color: 'BASE' },
            { key: 'HUB_SC (Dallas TX)', value: 0.05421, label: 'N=87,550', color: 'BASE' },
            { key: 'HUB_MT (Denver CO)', value: 0.05231, label: 'N=62,000', color: 'BASE' },
            { key: 'HUB_MW (Indianapolis IN)', value: 0.03386, label: 'N=69,866', color: 'BASE_MUTED' },
            { key: 'HUB_PNW (Portland OR)', value: 0.01437, label: 'N=67,243', color: 'DELTA_NEGATIVE' },
          ],
        },
      },
      caption: {
        text: 'The hub ordering closely tracks climate zone heat intensity — hot-desert and humid-subtropical hubs lead, while the oceanic-climate PNW hub trails the fleet average.',
      },
      receipts: [
        { label: 'window', value: '2015-01-01 → 2025-01-01' },
        { label: 'archetype', value: 'rankedList (k = 7)' },
      ],
    },
  ],
}, null, 2)
