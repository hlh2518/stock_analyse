<template>
  <el-dialog
    :model-value="visible"
    title="任务详情"
    width="800px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-if="task" class="task-detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务ID">{{ task.task_id }}</el-descriptions-item>
        <el-descriptions-item label="策略名称">{{ task.strategy_name }}</el-descriptions-item>
        <el-descriptions-item label="股票代码">{{ task.stock_code }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(task.status)">{{ getStatusText(task.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(task.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ task.completed_at ? formatDateTime(task.completed_at) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="总收益率" v-if="task.result_summary?.total_return !== undefined">
          <span :class="getReturnClass(task.result_summary?.total_return)">{{ formatPercent(task.result_summary?.total_return) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="最大回撤" v-if="task.result_summary?.max_drawdown !== undefined">
          <span class="negative">{{ formatPercent(task.result_summary?.max_drawdown ?? 0) }}</span>
        </el-descriptions-item>
      </el-descriptions>
      
      <!-- 任务操作 -->
      <div class="task-actions" style="margin-top: 20px;">
        <el-button 
          type="primary" 
          @click="$emit('run-task', task.task_id)"
          :loading="runningTasks.has(task.task_id)"
        >
          运行任务
        </el-button>
        <el-button 
          type="info" 
          @click="$emit('check-status', task.task_id)"
          :loading="checkingTasks.has(task.task_id)"
        >
          刷新状态
        </el-button>
        <el-button 
          type="success" 
          @click="$emit('view-result', task.task_id)"
        >
          查看结果
        </el-button>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { BacktestTask } from '@/services/quantBacktestApi'

defineProps<{
  visible: boolean
  task: BacktestTask | null
  runningTasks: Set<string>
  checkingTasks: Set<string>
}>()

defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'run-task', taskId: string): void
  (e: 'check-status', taskId: string): void
  (e: 'view-result', taskId: string): void
}>()

// 辅助函数
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

const formatDateTime = (dateTime: string): string => {
  return new Date(dateTime).toLocaleString('zh-CN')
}
</script>

<style scoped>
.task-detail {
  padding: 10px 0;
}

.task-actions {
  display: flex;
  gap: 10px;
}

.positive {
  color: #e20725;
  font-weight: bold;
}

.negative {
  color: #0a11dd;
  font-weight: bold;
}
</style>
