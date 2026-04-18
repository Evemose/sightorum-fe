import * as echartsCore from 'echarts/core'
import * as echartsFull from 'echarts'
import violinCustomSeriesInstaller from '@echarts-x/custom-violin'

let installed = false

export default defineNuxtPlugin(() => {
  if (!installed) {
    // nuxt-echarts wires charts from echarts/core; register there first.
    echartsCore.use(violinCustomSeriesInstaller)
    // Fallback registration for any full-instance usage.
    echartsFull.use(violinCustomSeriesInstaller)
    installed = true
  }
})


