<template>
  <div class="table-summary">
    <div class="summary-stats-grid">
      <div class="summary-stat-card">
        <div class="stat-icon-wrapper total"><el-icon class="stat-icon"><DataLine /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ filteredTradesTotal }}</div>
          <div class="stat-label">总交易数</div>
          <div class="stat-description">回测区间内成交笔数</div>
        </div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-icon-wrapper buy"><el-icon class="stat-icon"><TopRight /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ buyTradesCount }}</div>
          <div class="stat-label">买入笔数</div>
          <div class="stat-description">策略触发买入信号次数</div>
        </div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-icon-wrapper sell"><el-icon class="stat-icon"><BottomRight /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ sellTradesCount }}</div>
          <div class="stat-label">卖出笔数</div>
          <div class="stat-description">策略触发卖出信号次数</div>
        </div>
      </div>
      <div class="summary-stat-card">
        <div class="stat-icon-wrapper amount"><el-icon class="stat-icon"><Coin /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatMoney(totalTradeAmount) }}</div>
          <div class="stat-label">累计成交金额</div>
          <div class="stat-description">按交易记录汇总的资金规模</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件功能：
 * - 展示交易汇总指标卡片（总笔数、买卖笔数、累计成交金额）
 * 参数：
 * - filteredTradesTotal/buyTradesCount/sellTradesCount/totalTradeAmount: 汇总数值
 * - formatMoney: 金额格式化函数
 * 返回值：
 * - 无
 * 事件：
 * - 无
 */
import { BottomRight, Coin, DataLine, TopRight } from '@element-plus/icons-vue'

defineProps<{
  filteredTradesTotal: number
  buyTradesCount: number
  sellTradesCount: number
  totalTradeAmount: number
  formatMoney: (value: number | null | undefined) => string
}>()
</script>

<style scoped lang="scss" src="./styles/backtest-result-summary.scss"></style>
