<template>
  <el-table :data="trades" stripe style="width: 100%" :default-sort="{ prop: 'datetime', order: 'descending' }" class="trades-table">
    <el-table-column type="index" label="#" min-width="60" />
    <el-table-column prop="datetime" label="交易日期" min-width="120" sortable>
      <template #default="scope">
        <span class="date-value">{{ formatDate(scope.row.datetime) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" min-width="80" align="center">
      <template #default="scope">
        <el-tag :type="scope.row.type === 'buy' ? 'success' : 'danger'" size="small" effect="dark">
          {{ scope.row.type === 'buy' ? '买入' : '卖出' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="price" label="价格" min-width="100" sortable align="right">
      <template #default="scope">
        <span class="price-value">¥{{ Number(scope.row.price ?? 0).toFixed(2) }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="size" label="数量" min-width="100" align="right">
      <template #default="scope">
        <span class="quantity-value">{{ Number(scope.row.size ?? 0).toLocaleString() }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="value" label="成本" min-width="120" sortable align="right">
      <template #default="scope">
        <span class="amount-value">¥{{ Number(scope.row.value ?? 0).toLocaleString() }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="pnl" label="盈亏" min-width="120" sortable align="right">
      <template #default="scope">
        <span v-if="scope.row.type === 'sell'" :class="getReturnClass(scope.row.pnl || 0)">
          {{ formatMoney(scope.row.pnl) }}
        </span>
        <span v-else class="text-muted">-</span>
      </template>
    </el-table-column>
    <el-table-column label="收益率" min-width="100" align="right">
      <template #default="scope">
        <span v-if="scope.row.type === 'sell'" :class="getReturnClass(scope.row.pnl_pct || 0)">
          {{ formatPercent(scope.row.pnl_pct || 0) }}
        </span>
        <span v-else class="text-muted">-</span>
      </template>
    </el-table-column>
    <el-table-column label="手续费" min-width="100" align="right">
      <template #default="scope">
        <span class="commission-value">¥{{ formatMoney(Number(scope.row.commission ?? 0)) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="备注" min-width="120">
      <template #default="scope">
        <span class="remark-text">
          {{ scope.row.type === 'buy' ? '策略买入信号' : '策略卖出信号' }}
        </span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
/**
 * 组件功能：
 * - 展示回测交易明细表格
 * 参数：
 * - trades: 交易记录列表
 * - formatDate/formatMoney/formatPercent/getReturnClass: 页面格式化与样式函数
 * 返回值：
 * - 无
 * 事件：
 * - 无
 */
import type { TradeRecord } from '../composables/useBacktestResult'

defineProps<{
  trades: TradeRecord[]
  formatDate: (dateStr: string | null | undefined) => string
  formatMoney: (value: number | null | undefined) => string
  formatPercent: (value: number | null | undefined) => string
  getReturnClass: (value: number) => string
}>()
</script>

<style scoped>
.trades-table {
  border-radius: 8px;
  overflow: hidden;
}

.trades-table .el-table__header {
  background-color: #fafafa;
}

.trades-table .el-table__row:hover {
  background-color: #f8f9fa;
}

.date-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}

.price-value,
.amount-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
}

.commission-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
}
</style>
