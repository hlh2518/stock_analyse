<template>
  <div class="strategy-list-view">
    <div class="page-header">
      <h1>回测策略列表</h1>
      <p>查看所有可用的回测策略及其参数</p>
    </div>
    
    <!-- 策略列表 -->
    <div class="strategy-list-panel">
      <el-card v-loading="loading">
        <template #header>
          <div class="card-header">
            <span>可用策略</span>
            <el-button type="primary" @click="goToCreateBacktest">创建回测任务</el-button>
          </div>
        </template>
        
        <div v-if="strategyList.length === 0 && !loading" class="empty-data">
          <el-empty description="暂无可用策略" />
        </div>
        
        <div v-else class="strategy-cards">
          <el-collapse v-model="activeStrategy" accordion>
            <el-collapse-item 
              v-for="strategy in strategyList" 
              :key="strategy.name"
              :title="strategy.description"
              :name="strategy.name"
              @mouseenter="activeStrategy = strategy.name"
            >
              <div class="strategy-detail">
                <div class="strategy-info">
                  <h3>策略名称: {{ strategy.name }}</h3>
                  <p>{{ strategy.description }}</p>
                </div>
                
                <div v-if="strategy.params" class="strategy-params">
                  <h4>参数列表:</h4>
                  <el-table :data="formatStrategyParams(strategy.params)" border stripe>
                    <el-table-column prop="name" label="参数名称" width="180" />
                    <el-table-column prop="description" label="参数说明" width="250" />
                    <el-table-column prop="type" label="类型" width="100" />
                    <el-table-column prop="default" label="默认值" />
                  </el-table>
                </div>
                
                <div class="strategy-actions">
                  <el-button type="primary" @click="goToCreateBacktestWithStrategy(strategy.name)">
                    使用此策略创建回测
                  </el-button>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 回测策略列表页面
 * 功能：
 * 1. 展示所有可用的回测策略
 * 2. 显示策略的详细参数
 * 3. 提供快速创建回测任务的入口
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStrategies, type Strategy } from '@/services/quantBacktestApi'

const router = useRouter()

// 数据状态
/** 策略列表数据 */
const strategyList = ref<Strategy[]>([])
/** 加载状态 */
const loading = ref(false)
/** 当前展开的策略名称 */
const activeStrategy = ref('')

/**
 * 格式化策略参数为表格数据
 * @param params 策略参数对象
 * @returns 格式化后的表格数据数组
 */
const formatStrategyParams = (params: Record<string, any>) => {
  return Object.entries(params).map(([key, value]) => ({
    name: key,
    description: value.description,
    type: value.type,
    default: typeof value.default === 'object' ? JSON.stringify(value.default) : value.default
  }))
}

/**
 * 跳转到创建回测页面
 */
const goToCreateBacktest = () => {
  router.push('/backtest-strategy')
}

/**
 * 跳转到创建回测页面并预选策略
 * @param strategyName 策略名称
 */
const goToCreateBacktestWithStrategy = (strategyName: string) => {
  router.push({
    path: '/backtest-strategy',
    query: { strategy: strategyName }
  })
}

/**
 * 加载策略列表
 * @returns Promise<void>
 */
const loadStrategyList = async () => {
  loading.value = true
  try {
    const strategies = await getStrategies()
    strategyList.value = strategies
  } catch (error) {
    console.error('加载策略列表失败:', error)
    ElMessage.error('加载策略列表失败')
  } finally {
    loading.value = false
  }
}

// 页面初始化
onMounted(() => {
  loadStrategyList()
})
</script>

<style scoped>
.strategy-list-view {
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

.strategy-list-panel {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-data {
  padding: 40px 0;
}

.strategy-cards {
  margin-top: 10px;
}

.strategy-detail {
  padding: 10px 0;
}

.strategy-info {
  margin-bottom: 20px;
}

.strategy-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.strategy-info p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.strategy-params {
  margin-bottom: 20px;
}

.strategy-params h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.strategy-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>