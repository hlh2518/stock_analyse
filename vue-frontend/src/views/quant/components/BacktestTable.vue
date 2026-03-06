<template>
  <div class="task-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>回测任务列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="$router.push('/backtest-strategy')">创建新任务</el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="tasks" 
        stripe 
        style="width: 100%"
        v-loading="loading"
        @row-click="$emit('row-click', $event)"
        class="full-width-table"
      >
        <el-table-column prop="stock_code" label="代码" width="100" align="center" />
        <el-table-column prop="stock_name" label="名称" min-width="100" align="center" />
        <el-table-column label="策略" min-width="120" align="center">
          <template #default="scope">
            {{ getStrategyDescription(scope.row.strategy_name) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间范围" min-width="110" align="center">
          <template #default="scope">
            <div>{{ scope.row.start_date }}</div>
            <div>{{ scope.row.end_date }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="frequency" label="频率" width="80" align="center" />
        <el-table-column label="策略参数" width="100" align="center">
          <template #default="scope">
            <el-popover
              placement="left"
              title="策略参数"
              :width="300"
              trigger="click"
            >
              <template #reference>
                <el-button link type="primary" @click.stop>查看</el-button>
              </template>
              <JsonPreview :value="scope.row.strategy_params" :max-inline-length="1000" />
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="总收益率" min-width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.result_summary?.total_return !== undefined" :class="getReturnClass(scope.row.result_summary?.total_return)">
              {{ formatPercent(scope.row.result_summary?.total_return) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="最大回撤" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.result_summary?.max_drawdown !== undefined" class="negative">
              {{ formatPercent(scope.row.result_summary?.max_drawdown) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="夏普比率" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.result_summary?.sharpe_ratio !== undefined" class="positive">
              {{ scope.row.result_summary?.sharpe_ratio}}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button 
                link
                type="primary" 
                size="small" 
                @click.stop="$emit('run-task', scope.row.task_id)"
                :loading="runningTasks.has(scope.row.task_id)"
              >
                运行
              </el-button>
              <el-button 
                link
                type="warning" 
                size="small" 
                @click.stop="$emit('copy-config', scope.row)"
              >
                复制配置
              </el-button>
              <el-button 
                link
                type="info" 
                size="small" 
                @click.stop="$emit('check-status', scope.row.task_id)"
                :loading="checkingTasks.has(scope.row.task_id)"
              >
                 查询状态
              </el-button>
              <el-button 
                link
                type="success" 
                size="small" 
                @click.stop="$emit('view-result', scope.row.task_id)"
              >
                查看结果
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @update:current-page="$emit('current-change', $event)"
          @update:page-size="$emit('size-change', $event)"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import JsonPreview from '@/components/JsonPreview.vue'
import type { BacktestTask, Strategy } from '@/services/quantBacktestApi'
import type { Pagination } from '../types'

const props = defineProps<{
  tasks: BacktestTask[]
  pagination: Pagination
  loading: boolean
  runningTasks: Set<string>
  checkingTasks: Set<string>
  strategyList: Strategy[]
}>()

defineEmits<{
  (e: 'row-click', row: BacktestTask): void
  (e: 'run-task', taskId: string): void
  (e: 'copy-config', task: BacktestTask): void
  (e: 'check-status', taskId: string): void
  (e: 'view-result', taskId: string): void
  (e: 'size-change', size: number): void
  (e: 'current-change', page: number): void
}>()

// 辅助函数
const getStrategyDescription = (strategyName: string): string => {
  const strategy = props.strategyList.find(s => s.name === strategyName)
  return strategy ? strategy.description : strategyName
}

const getStatusTagType = (status: string): string => {
  switch (status) {
    case 'created': return 'info'
    case 'running': return 'warning'
    case 'completed': return 'success'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'created': return '已创建'
    case 'running': return '运行中'
    case 'completed': return '已完成'
    case 'failed': return '执行失败'
    default: return '未知状态'
  }
}

const getReturnClass = (value: number): string => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return ''
}

const formatPercent = (value: number | undefined | null): string => {
  if (value === null || value === undefined) return '-'
  return `${value.toFixed(2)}%`
}
</script>

<style scoped>
.task-list {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.positive {
  color: #e20725;
  font-weight: bold;
}

.negative {
  color: #0a11dd;
  font-weight: bold;
}

.full-width-table {
  width: 100% !important;
}

:deep(.el-table) {
  width: 100% !important;
}

:deep(.el-table__body-wrapper) {
  width: 100% !important;
}

:deep(.el-table__header-wrapper) {
  width: 100% !important;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
</style>
