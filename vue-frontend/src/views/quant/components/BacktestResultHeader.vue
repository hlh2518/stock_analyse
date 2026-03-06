<template>
  <div class="page-header">
    <el-button type="primary" class="back-button" @click="$emit('back')">
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>
    <div class="header-content">
      <h1>回测结果详情</h1>
      <p v-if="taskInfo">{{ taskInfo.strategy_name }} - {{ taskInfo.stock_name }}({{ taskInfo.stock_code }})</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件功能：
 * - 展示回测结果页头部信息与返回按钮
 * 参数：
 * - taskInfo: 任务基础信息（策略名、股票名、股票代码等）
 * 返回值：
 * - 无
 * 事件：
 * - back: 点击返回按钮时触发
 */
import { ArrowLeft } from '@element-plus/icons-vue'
import type { BacktestResult } from '@/services/quantBacktestApi'

defineProps<{
  taskInfo: BacktestResult['task_info'] | null
}>()

defineEmits<{
  (e: 'back'): void
}>()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-button {
  margin-right: 20px;
}

.header-content h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.header-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .back-button {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>
