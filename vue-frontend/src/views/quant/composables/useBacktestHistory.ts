import { ref, reactive, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  getBacktestTasks,
  runBacktestTask,
  getBacktestStatus,
  getStrategies,
  type BacktestTask,
  type Strategy
} from '@/services/quantBacktestApi'
import type { FilterForm, Pagination } from '../types'

export function useBacktestHistory() {
  const router = useRouter()

  // 筛选表单
  const filterForm = reactive<FilterForm>({
    strategyName: '',
    symbol: '',
    status: ''
  })

  // 分页信息
  const pagination = reactive<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 数据状态
  const taskList = ref<BacktestTask[]>([])
  const strategyList = ref<Strategy[]>([])
  const selectedTask = ref<BacktestTask | null>(null)
  const loading = ref(false)
  const detailDialogVisible = ref(false)
  const resultDialogVisible = ref(false)
  const selectedTaskId = ref<string>('')
  const runningTasks = ref(new Set<string>())
  const checkingTasks = ref(new Set<string>())

  // 使用 reactive 管理表格数据
  const tableData = reactive<{ tasks: BacktestTask[] }>({
    tasks: [] as BacktestTask[]
  })

  // 根据策略名获取策略描述
  const getStrategyDescription = (strategyName: string): string => {
    const strategy = strategyList.value.find(s => s.name === strategyName)
    return strategy ? strategy.description : strategyName
  }

  // 加载任务列表
  const loadTaskList = async () => {
    loading.value = true
    
    try {
      const params = {
        offset: (pagination.page - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...(filterForm.strategyName && { strategy_name: filterForm.strategyName }),
        ...(filterForm.symbol && { stock_code: filterForm.symbol }),
        ...(filterForm.status && { status: filterForm.status })
      }
      
      const result = await getBacktestTasks(params)
      
      // 更新表格数据
      tableData.tasks = result.tasks || []
      taskList.value = result.tasks || []
      await nextTick()
      
      pagination.total = result.total
    } catch (error) {
      console.error('加载任务列表失败:', error)
      ElMessage.error('加载任务列表失败')
    } finally {
      loading.value = false
    }
  }

  // 加载策略列表
  const loadStrategyList = async () => {
    try {
      const strategies = await getStrategies()
      strategyList.value = strategies
    } catch (error) {
      console.error('加载策略列表失败:', error)
    }
  }

  // 搜索任务
  const searchTasks = () => {
    pagination.page = 1
    loadTaskList()
  }

  // 重置筛选条件
  const resetFilter = () => {
    filterForm.strategyName = ''
    filterForm.symbol = ''
    filterForm.status = ''
    pagination.page = 1
    loadTaskList()
  }

  // 刷新数据
  const refreshData = () => {
    loadTaskList()
  }

  // 运行任务
  const runTask = async (taskId: string) => {
    runningTasks.value.add(taskId)
    
    try {
      await runBacktestTask(taskId)
      ElMessage.success('回测任务已启动')
      
      // 刷新任务列表
      await loadTaskList()
      
      // 如果详情对话框打开，更新选中的任务
      if (selectedTask.value && selectedTask.value.task_id === taskId) {
        const updatedTask = tableData.tasks.find(task => task.task_id === taskId)
        if (updatedTask) {
          selectedTask.value = updatedTask
        }
      }
      
    } catch (error) {
      console.error('运行回测任务失败:', error)
      ElMessage.error('运行回测任务失败')
    } finally {
      runningTasks.value.delete(taskId)
    }
  }

  // 查询状态
  const checkStatus = async (taskId: string) => {
    checkingTasks.value.add(taskId)
    
    try {
      const status = await getBacktestStatus(taskId)
      
      // 更新任务列表中的状态
      const taskIndex = tableData.tasks.findIndex(task => task.task_id === taskId)
      if (taskIndex !== -1) {
        tableData.tasks[taskIndex].status = status.status
        if (status.completed_at) {
          tableData.tasks[taskIndex].completed_at = status.completed_at
        }
      }
      
      // 同步更新 taskList
      const taskListIndex = taskList.value.findIndex(task => task.task_id === taskId)
      if (taskListIndex !== -1) {
        taskList.value[taskListIndex].status = status.status
        if (status.completed_at) {
          taskList.value[taskListIndex].completed_at = status.completed_at
        }
      }
      
      // 如果详情对话框打开，更新选中的任务
      if (selectedTask.value && selectedTask.value.task_id === taskId) {
        selectedTask.value.status = status.status
        if (status.completed_at) {
          selectedTask.value.completed_at = status.completed_at
        }
      }
      
      ElMessage.success('状态已更新')
      
    } catch (error) {
      console.error('查询任务状态失败:', error)
      ElMessage.error('查询任务状态失败')
    } finally {
      checkingTasks.value.delete(taskId)
    }
  }

  // 查看结果
  const viewResult = (taskId: string) => {
    router.push(`/backtest-result/${taskId}`)
  }

  // 处理行点击
  const handleRowClick = (row: BacktestTask) => {
    selectedTask.value = row
    detailDialogVisible.value = true
  }

  // 处理页面大小变化
  const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    pagination.page = 1
    loadTaskList()
  }

  // 处理当前页变化
  const handleCurrentChange = (page: number) => {
    pagination.page = page
    loadTaskList()
  }

  // 复制配置
  const copyConfig = (task: BacktestTask) => {
    try {
      const inferDataSource = (code: string): 'stock' | 'etf' => {
        return code?.includes('.') ? 'etf' : 'stock'
      }

      const query: Record<string, any> = {
        strategy: task.strategy_name,
        symbol: task.stock_code,
        stock_name: task.stock_name || '',
        start_date: task.start_date,
        end_date: task.end_date,
        initial_cash: task.initial_cash,
        data_source: inferDataSource(task.stock_code),
      }
      if (task.frequency) {
        query.frequency = task.frequency
      }
      if (task.strategy_params) {
        query.strategy_params = encodeURIComponent(JSON.stringify(task.strategy_params))
      }

      router.push({ path: '/backtest-strategy', query })
    } catch (error) {
      console.error('复制配置失败:', error)
      ElMessage.error('复制配置失败')
    }
  }

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

  // 监听器
  watch(taskList, (newList) => {
    console.log('taskList 发生变化，新长度:', newList.length)
  }, { deep: true })

  watch(() => tableData.tasks, (newTasks) => {
    console.log('tableData.tasks 发生变化，新长度:', newTasks.length)
  }, { deep: true })

  return {
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
    tableData,
    getStrategyDescription,
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
    copyConfig,
    getStatusTagType,
    getStatusText,
    getReturnClass,
    formatPercent,
    formatDateTime
  }
}
