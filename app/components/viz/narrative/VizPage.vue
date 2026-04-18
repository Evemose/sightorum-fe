<template>
  <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
    <slot name="header" />
    <slot name="headline" />
    <slot name="primary-chart" />
    <slot name="punchline-chart" />
    <slot name="fired-checks" />
    <slot name="receipts" />
    <slot />
  </section>
</template>
