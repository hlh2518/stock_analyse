<template>
  <div class="filter-panel">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>筛选条件</span>
          <el-button type="primary" @click="$emit('refresh')">刷新</el-button>
        </div>
      </template>
      
      <el-form :model="filterForm" inline class="filter-form">
        <el-form-item label="策略名称">
          <el-select
            v-model="filterForm.strategyName"
            placeholder="全部策略"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in strategyList"
              :key="item.name"
              :label="item.description"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="股票代码">
          <el-input
            v-model="filterForm.symbol"
            placeholder="请输入股票代码"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="已创建" value="created" />
            <el-option label="运行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="执行失败" value="failed" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="$emit('search')">查询</el-button>
          <el-button @click="$emit('reset')">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { Strategy } from '@/services/quantBacktestApi'
import type { FilterForm } from '../types'

defineProps<{
  filterForm: FilterForm
  strategyList: Strategy[]
}>()

defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'refresh'): void
}>()
</script>

<style scoped>
.filter-panel {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin: 0;
}
</style>
