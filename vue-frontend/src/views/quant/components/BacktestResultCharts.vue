<template>
  <div class="charts-section">
    <el-card class="chart-card main-chart">
      <template #header>
        <div class="card-header">
          <span class="card-title">价格走势与交易信号</span>
        </div>
      </template>

      <div class="chart-container">
        <div ref="klineChartRef" class="chart main-chart-content"></div>
        <div class="observer-charts-container">
          <div class="observer-panel">
            <span class="observer-panel-title">资金曲线</span>
            <div ref="brokerChartRef" class="chart observer-chart"></div>
          </div>
          <div class="observer-panel">
            <span class="observer-panel-title">收益率曲线</span>
            <div ref="returnChartRef" class="chart observer-chart"></div>
          </div>
          <div class="observer-panel">
            <span class="observer-panel-title">回撤曲线</span>
            <div ref="drawdownChartRef" class="chart observer-chart"></div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件功能：
 * - 渲染价格与技术指标主图，以及资金/收益率/回撤观测器子图
 * 参数：
 * - observerData: 观测器数据
 * - rawIndicatorData: 原始K线与指标数据
 * 返回值：
 * - 无
 * 事件：
 * - 无
 */
import { nextTick, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ObserverData, RawIndicatorData } from '../composables/useBacktestResult'

const props = defineProps<{
  observerData: ObserverData | null
  rawIndicatorData: RawIndicatorData | null
}>()

const brokerChartRef = ref<HTMLElement>()
const returnChartRef = ref<HTMLElement>()
const drawdownChartRef = ref<HTMLElement>()
const klineChartRef = ref<HTMLElement>()

let brokerChart: echarts.ECharts | null = null
let returnChart: echarts.ECharts | null = null
let drawdownChart: echarts.ECharts | null = null
let klineChart: echarts.ECharts | null = null

const formatMoneyAxisLabel = (value: number): string => {
  const absoluteValue = Math.abs(value)
  if (absoluteValue >= 100000000) return `¥${(value / 100000000).toFixed(1)}亿`
  if (absoluteValue >= 10000) return `¥${(value / 10000).toFixed(1)}万`
  return `¥${value.toFixed(0)}`
}

const getValueRange = (rawValues: Array<number | null | undefined>, paddingRatio = 0.12, forceUpperZero = false): { min: number; max: number } => {
  const values = rawValues.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (!values.length) return forceUpperZero ? { min: -1, max: 0 } : { min: -1, max: 1 }

  const baseMin = Math.min(...values)
  const baseMax = Math.max(...values)
  const span = Math.max(baseMax - baseMin, Math.abs(baseMax) * 0.02, 1e-6)
  const padding = span * paddingRatio
  const min = baseMin - padding
  const max = forceUpperZero ? 0 : baseMax + padding

  if (max <= min) return forceUpperZero ? { min: min - 1, max: 0 } : { min: min - 1, max: min + 1 }
  return { min, max }
}

const cleanup = () => {
  brokerChart?.dispose()
  returnChart?.dispose()
  drawdownChart?.dispose()
  klineChart?.dispose()
  brokerChart = null
  returnChart = null
  drawdownChart = null
  klineChart = null
}

const initKlineChart = () => {
  if (!klineChartRef.value || !props.rawIndicatorData?.raw_data) return
  klineChart = echarts.init(klineChartRef.value)
  const { raw_data: rawData, indicator_data: indicatorData = {} } = props.rawIndicatorData
  const dates = (rawData.datetime || []).map((date) => date.split(' ')[0].split('T')[0])
  const closeData = dates.map((_, index) => rawData.close[index])
  const buySignals: Array<[number, number]> = []
  const sellSignals: Array<[number, number]> = []

  const buysell = props.observerData?.observer_data?.buysell ?? []
  buysell.forEach((trade) => {
    const tradeDate = trade.datetime.split(' ')[0].split('T')[0]
    const dateIndex = dates.findIndex((date) => date === tradeDate)
    if (dateIndex === -1) return
    if (trade.size > 0) buySignals.push([dateIndex, trade.price])
    else sellSignals.push([dateIndex, trade.price])
  })

  const series: echarts.SeriesOption[] = [
    { name: '收盘价', type: 'line', data: closeData, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#5470c6' } },
    { name: '买入', type: 'scatter', data: buySignals, symbolSize: 8, itemStyle: { color: '#F20505' }, symbol: 'triangle' },
    { name: '卖出', type: 'scatter', data: sellSignals, symbolSize: 8, itemStyle: { color: '#030008' }, symbol: 'triangle', symbolRotate: 180 }
  ]

  const indicatorColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#2f4554']
  const closeMaxValue = Math.max(...closeData, 1)
  let colorIndex = 0

  Object.keys(indicatorData).forEach((key) => {
    const indicatorValues = (indicatorData[key] ?? []).filter((value) => value !== null && value !== undefined)
    if (!indicatorValues.length) return
    const indicatorMaxValue = Math.max(...indicatorValues)
    const ratio = indicatorMaxValue / closeMaxValue
    const isCrossover = key.toLowerCase().includes('crossover')
    const isSignal = key.toLowerCase().includes('signal')
    const yAxisIndex = ratio < 0.5 || isCrossover || isSignal ? 1 : 0

    series.push({
      name: key,
      type: 'line',
      data: indicatorData[key],
      smooth: true,
      showSymbol: false,
      yAxisIndex,
      lineStyle: { width: 1.5, color: indicatorColors[colorIndex++ % indicatorColors.length] }
    })
  })

  klineChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: {
      data: ['收盘价', '买入', '卖出', ...Object.keys(indicatorData)],
      selected: Object.keys(indicatorData).reduce(
        (selectedMap, key) => ({ ...selectedMap, [key]: false }),
        { 收盘价: true, 买入: true, 卖出: true } as Record<string, boolean>
      ),
      type: 'scroll',
      orient: 'horizontal',
      top: 0,
      textStyle: { fontSize: 11 },
      pageButtonItemGap: 5,
      pageButtonGap: 5
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '60px', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      axisLabel: {
        rotate: 45,
        interval: 'auto',
        formatter: (value: string) => value.substring(5, 10),
        hideOverlap: true
      }
    },
    yAxis: [
      { name: '价格', type: 'value', scale: true, position: 'left', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#909399', fontSize: 10 }, splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ebeef5' } } },
      { name: '指标值', type: 'value', scale: true, position: 'right', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#909399', fontSize: 10 }, splitLine: { show: false } }
    ],
    dataZoom: [{ type: 'inside', start: 0, end: 100 }, { show: true, type: 'slider', bottom: 0, start: 0, end: 100 }],
    series
  })
}

const initBrokerChart = () => {
  if (!brokerChartRef.value || !props.observerData?.observer_data?.broker) return
  const brokerData = props.observerData.observer_data.broker
  const brokerDates = brokerData.map((item) => item.datetime.split(' ')[0].split('T')[0])
  const brokerValueData = brokerData.map((item) => item.value)
  const brokerCashData = brokerData.map((item) => item.cash)
  const brokerRange = getValueRange([...brokerValueData, ...brokerCashData], 0.16)
  brokerChart = echarts.init(brokerChartRef.value)
  brokerChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any[]) => `${params[0].axisValue}<br/>${params.map((p) => `${p.seriesName}: ¥${Number(p.value).toLocaleString()}`).join('<br/>')}`
    },
    grid: { left: '4%', right: '3%', bottom: '8%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: brokerDates,
      axisLabel: { show: false },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: brokerRange.min,
      max: brokerRange.max,
      axisLine: { show: false },
      axisTick: { show: false },
      splitNumber: 3,
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ebeef5' } },
      axisLabel: { color: '#909399', fontSize: 10, formatter: (value: number) => formatMoneyAxisLabel(value) }
    },
    series: [
      {
        name: '总资产',
        type: 'line',
        data: brokerValueData,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#5470c6', width: 2.4 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(84, 112, 198, 0.35)' },
              { offset: 1, color: 'rgba(84, 112, 198, 0.06)' }
            ]
          }
        }
      },
      {
        name: '现金',
        type: 'line',
        data: brokerCashData,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#67C23A', width: 2 }
      }
    ]
  })
}

const initReturnChart = () => {
  if (!returnChartRef.value || !props.observerData?.observer_data?.timereturn) return
  const returnData = props.observerData.observer_data.timereturn
  const returnDates = returnData.map((item) => item.datetime.split(' ')[0].split('T')[0])
  const returnSeriesData = returnData.map((item) => item.return)
  const returnRange = getValueRange(returnSeriesData, 0.2)
  returnChart = echarts.init(returnChartRef.value)
  returnChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any[]) => `${params[0].axisValue}<br/>收益率: ${Number(params[0].value).toFixed(2)}%`
    },
    grid: { left: '4%', right: '3%', bottom: '8%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: returnDates,
      axisLabel: { show: false },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: returnRange.min,
      max: returnRange.max,
      axisLine: { show: false },
      axisTick: { show: false },
      splitNumber: 3,
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ebeef5' } },
      axisLabel: { color: '#909399', fontSize: 10, formatter: (value: number) => `${value.toFixed(1)}%` }
    },
    series: [
      {
        name: '收益率',
        type: 'line',
        data: returnSeriesData,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#91cc75', width: 2.4 },
        markLine: { symbol: 'none', label: { show: false }, lineStyle: { color: '#c0c4cc', type: 'dashed' }, data: [{ yAxis: 0 }] },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(145, 204, 117, 0.3)' },
              { offset: 1, color: 'rgba(145, 204, 117, 0.08)' }
            ]
          }
        }
      }
    ]
  })
}

const initDrawdownChart = () => {
  if (!drawdownChartRef.value || !props.observerData?.observer_data?.drawdown) return
  const drawdownData = props.observerData.observer_data.drawdown
  const drawdownDates = drawdownData.map((item) => item.datetime.split(' ')[0].split('T')[0])
  const drawdownSeriesData = drawdownData.map((item) => -Math.abs(item.drawdown) )
  const drawdownRange = getValueRange(drawdownSeriesData, 0.15, true)
  drawdownChart = echarts.init(drawdownChartRef.value)
  drawdownChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any[]) => `${params[0].axisValue}<br/>回撤: ${Math.abs(Number(params[0].value)).toFixed(2)}%`
    },
    grid: { left: '4%', right: '3%', bottom: '18%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: drawdownDates,
      axisLabel: {
        rotate: 45,
        color: '#909399',
        fontSize: 10,
        formatter: (value: string) => value.substring(5, 10),
        hideOverlap: true
      },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: drawdownRange.min,
      max: drawdownRange.max,
      axisLine: { show: false },
      axisTick: { show: false },
      splitNumber: 3,
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ebeef5' } },
      axisLabel: { color: '#909399', fontSize: 10, formatter: (value: number) => `${value.toFixed(1)}%` }
    },
    dataZoom: [{ type: 'inside', xAxisIndex: 0, start: 0, end: 100 }, { show: true, xAxisIndex: 0, type: 'slider', bottom: 0, start: 0, end: 100, height: 14 }],
    series: [
      {
        name: '回撤',
        type: 'line',
        data: drawdownSeriesData,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#ee6666', width: 2 },
        markLine: { symbol: 'none', label: { show: false }, lineStyle: { color: '#c0c4cc', type: 'dashed' }, data: [{ yAxis: 0 }] },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(238, 102, 102, 0.3)' },
              { offset: 1, color: 'rgba(238, 102, 102, 0.1)' }
            ]
          }
        }
      }
    ]
  })
}

const initializeCharts = async () => {
  cleanup()
  await nextTick()
  initKlineChart()
  initBrokerChart()
  initReturnChart()
  initDrawdownChart()
}

watch(() => [props.observerData, props.rawIndicatorData], initializeCharts, { deep: true, immediate: true })
watch(() => [brokerChartRef.value, returnChartRef.value, drawdownChartRef.value, klineChartRef.value], initializeCharts)

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss" src="./styles/backtest-result-charts.scss"></style>
