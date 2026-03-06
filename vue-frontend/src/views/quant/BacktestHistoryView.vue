<template>
  <div class="backtest-history-view">
    <div class="page-header">
      <h1>回测历史</h1>
      <p>查看历史回测任务，监控状态和查看结果</p>
    </div>
    
    <!-- 筛选条件 -->
    <BacktestFilter 
      :filter-form="filterForm"
      :strategy-list="strategyList"
      @search="searchTasks"
      @reset="resetFilter"
      @refresh="refreshData"
    />
    
    <!-- 任务列表 -->
    <BacktestTable 
      :tasks="taskList"
      :pagination="pagination"
      :loading="loading"
      :running-tasks="runningTasks"
      :checking-tasks="checkingTasks"
      :strategy-list="strategyList"
      @row-click="handleRowClick"
      @run-task="runTask"
      @copy-config="copyConfig"
      @check-status="checkStatus"
      @view-result="viewResult"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
    
    <!-- 任务详情对话框 -->
    <BacktestDetailDialog
      v-model:visible="detailDialogVisible"
      :task="selectedTask"
      :running-tasks="runningTasks"
      :checking-tasks="checkingTasks"
      @run-task="runTask"
      @check-status="checkStatus"
      @view-result="viewResult"
    />
    
    <!-- 回测结果对话框 -->
    <BacktestResultDialog 
      v-model:visible="resultDialogVisible" 
      :task-id="selectedTaskId" 
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 回测历史页面
 * 功能：
 * 1. 显示历史回测任务列表
 * 2. 支持按策略、股票、状态筛选
 * 3. 支持状态查询和结果查看
 * 4. 支持运行已创建的任务
 * 
 * 重构说明：
 * - 逻辑抽离至 composables/useBacktestHistory.ts
 * - UI 拆分为 components/BacktestFilter.vue, BacktestTable.vue, BacktestDetailDialog.vue
 */
import { onMounted } from 'vue'
import BacktestResultDialog from '@/components/BacktestResultDialog.vue'
import BacktestFilter from './components/BacktestFilter.vue'
import BacktestTable from './components/BacktestTable.vue'
import BacktestDetailDialog from './components/BacktestDetailDialog.vue'
import { useBacktestHistory } from './composables/useBacktestHistory'

const {
  filterForm,
  pagination,
  taskList,
  strategyList,
  selectedTask,
  loading,
  detailDialogVisible,
  resultDialogVisible,
  selectedTaskId,
  runningTasks,
  checkingTasks,
  loadTaskList,
  loadStrategyList,
  searchTasks,
  resetFilter,
  refreshData,
  runTask,
  checkStatus,
  viewResult,
  handleRowClick,
  handleSizeChange,
  handleCurrentChange,
  copyConfig
} = useBacktestHistory()

// 页面初始化
onMounted(async () => {
  await Promise.all([
    loadStrategyList(),
    loadTaskList()
  ])
})
</script>

<style scoped>
.backtest-history-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
}
</style>
