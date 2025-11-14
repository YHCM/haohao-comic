<script setup>
// 导入依赖：数据库客户端、Vue核心API、路由、自定义图标组件
import { createClient } from '@libsql/client/web'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorIcon from '@/components/ErrorIcon.vue'
import EmptyIcon from '@/components/EmptyIcon.vue'
import SearchIcon from '@/components/SearchIcon.vue'
import Logo from '@/components/Logo.vue' // 导入 Logo 组件

// 初始化Turso数据库客户端（连接配置）
const turso = createClient({
  url: 'libsql://test-super-hao.aws-ap-northeast-1.turso.io',
  authToken:
    'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3NjMwMDE0OTYsImlkIjoiOTQ0ZjQxMWEtMTkzNy00OTYxLWIwZjgtMTZmNDE5ZTIyYTk4IiwicmlkIjoiOGNkMzg2NDMtNzUxNy00MzQ1LWI3N2UtNDlmMjY5NDI3NTFmIn0.9QuHdkavaE6-9-pKqM33zJHGkO6S5tYwNzQdXAyLpy3GYWVj8AacsbTRmX14RSLmH7QLYnalRFZLBc-_1cnBCA',
})

// 路由相关：获取当前路由参数、路由跳转实例
const route = useRoute()
const router = useRouter()
const comicId = computed(() => route.params.comicId) // 漫画ID（从路由参数中获取）
const searchQuery = ref('') // 搜索输入框绑定值

// 状态管理：页面核心数据和状态
const comic = ref(null) // 漫画详情数据
const chapters = ref([]) // 漫画章节列表
const loading = ref(true) // 加载状态（true=加载中）
const error = ref(null) // 错误信息（null=无错误）

/**
 * 日期格式化工具函数
 * @param {string} dateString - 原始日期字符串（如："2025-11-13 12:00:00"）
 * @returns {string} 格式化后的日期（只保留年月日，如："2025-11-13"）
 */
const formatDate = (dateString) => {
  return dateString.split(' ')[0]
}

/**
 * 异步查询漫画详情
 * 从数据库中获取当前漫画ID对应的漫画信息
 */
const fetchComicDetail = async () => {
  try {
    const response = await turso.execute({
      sql: 'SELECT * FROM comics WHERE id = ?',
      args: [comicId.value],
    })

    // 无查询结果时设置错误信息
    if (response.rows.length === 0) {
      error.value = '该漫画不存在或已被删除'
      return
    }

    // 格式化查询结果（列名+行数据映射为对象）
    comic.value = response.columns.reduce((obj, col, index) => {
      obj[col] = response.rows[0][index]
      return obj
    }, {})
  } catch (err) {
    error.value = '加载漫画详情失败，请稍后再试'
    console.error('漫画查询错误:', err)
  }
}

/**
 * 异步查询漫画章节列表
 * 按章节编号升序获取当前漫画的所有章节
 */
const fetchChapters = async () => {
  try {
    const response = await turso.execute({
      sql: 'SELECT * FROM chapters WHERE comic_id = ? ORDER BY number ASC',
      args: [comicId.value],
    })

    // 格式化查询结果（多行数据映射为对象数组）
    chapters.value = response.rows.map((row) => {
      return response.columns.reduce((obj, col, index) => {
        obj[col] = row[index]
        return obj
      }, {})
    })
  } catch (err) {
    error.value = '加载章节列表失败，请稍后再试'
    console.error('章节查询错误:', err)
  }
}

/**
 * 统一数据加载入口
 * 同时加载漫画详情和章节，控制加载状态
 */
const fetchData = async () => {
  loading.value = true
  error.value = null // 重置错误信息
  try {
    await Promise.all([fetchComicDetail(), fetchChapters()]) // 并行请求提升效率
  } finally {
    loading.value = false // 无论成功失败，都结束加载状态
  }
}

/**
 * 章节点击事件处理
 * 跳转到对应章节的阅读页面
 * @param {number} chapterId - 章节ID
 */
const handleChapterClick = (chapterId) => {
  router.push(`/comic/${comicId.value}/chapter/${chapterId}`)
}

/**
 * 搜索表单提交处理
 * 带搜索参数跳转到首页，无参数则直接跳首页
 * @param {Event} e - 表单提交事件
 */
const handleSearch = (e) => {
  e.preventDefault() // 阻止表单默认提交行为
  const query = searchQuery.value.trim()
  if (query) {
    router.push({
      path: '/',
      query: { search: query },
    })
  } else {
    router.push('/')
  }
}

// 页面挂载时初始化：加载数据 + 回显搜索参数
onMounted(() => {
  fetchData()
  if (route.query.search) {
    searchQuery.value = route.query.search
  }
})
</script>

<template>
  <div class="comic-app">
    <!-- 顶部导航栏：包含logo和搜索框 -->
    <header class="app-header">
      <div class="header-content">
        <Logo class="app-logo" />
        
        <form @submit="handleSearch" class="search-form">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索漫画名称..."
            class="search-input"
          />
          <button type="submit" class="search-btn">
            <SearchIcon />
          </button>
        </form>
      </div>
    </header>

    <!-- 主内容区：根据状态展示加载/错误/详情页面 -->
    <main class="detail-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <ErrorIcon />
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">重试</button>
      </div>

      <!-- 正常内容：漫画详情 + 章节列表 -->
      <div v-else class="detail-content">
        <section class="comic-info-section">
          <div class="comic-cover-wrapper">
            <img :src="comic.cover" :alt="comic.title" class="comic-cover" loading="lazy" />
          </div>

          <div class="comic-meta">
            <h2 class="comic-title">{{ comic.title }}</h2>
            <div class="meta-item">
              <span class="meta-label">收录日期：</span>
              <span class="meta-value">{{ formatDate(comic.created_at) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">总章节数：</span>
              <span class="meta-value">{{ chapters.length }} 话</span>
            </div>
          </div>
        </section>

        <section class="chapters-section">
          <h3 class="section-title">章节列表</h3>

          <!-- 无章节数据 -->
          <div v-if="chapters.length === 0" class="empty-chapters">
            <EmptyIcon />
            <p>暂无章节数据</p>
          </div>

          <!-- 章节列表 -->
          <div class="chapters-list" v-else>
            <div
              v-for="chapter in chapters"
              :key="chapter.id"
              class="chapter-item"
              @click="handleChapterClick(chapter.id)"
            >
              <div class="chapter-number">第 {{ chapter.number }} 话</div>
              <div class="chapter-title">{{ chapter.title }}</div>
              <div class="chapter-arrow">→</div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <p>© 2025 haohao-comic.pages.dev 好好漫画</p>
    </footer>
  </div>
</template>

<style scoped>
/* 全局容器样式：页面整体布局 */
.comic-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  color: #333;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 顶部导航栏样式 */
.app-header {
  background-color: #fff;
  padding: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Logo 样式 */
.app-logo {
  width: auto;
  height: 40px;
  cursor: pointer;
}

.search-form {
  display: flex;
  flex: 1;
  max-width: 600px;
  gap: 0.5rem;
  min-width: 150px;
}

.search-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.search-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover {
  background-color: #359469;
}

/* 主内容区样式 */
.detail-container {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 1.5rem;
  color: #666;
}

/* 加载动画容器 */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 错误状态样式 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 1.5rem;
  color: #dc3545;
  text-align: center;
}

.retry-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: #359469;
}

/* 详情内容样式 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* 漫画信息区域 */
.comic-info-section {
  display: flex;
  gap: 2rem;
  background-color: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  align-items: flex-start;
}

.comic-cover-wrapper {
  flex-shrink: 0;
}

.comic-cover {
  width: 240px;
  height: 320px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comic-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 0.5rem;
}

.comic-title {
  margin: 0;
  font-size: 2rem;
  color: #2c3e50;
  line-height: 1.2;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.1rem;
}

.meta-label {
  color: #7f8c8d;
  font-weight: 500;
}

.meta-value {
  color: #333;
}

/* 章节列表区域 */
.chapters-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 无章节数据样式 */
.empty-chapters {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 30vh;
  gap: 1rem;
  color: #666;
}

/* 章节列表样式 */
.chapters-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.chapter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.chapter-item:hover {
  background-color: #f0f7f3;
  border-color: #e1f5ea;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.03);
}

.chapter-number {
  font-weight: 600;
  color: #42b983;
  font-size: 1.1rem;
  min-width: 80px;
}

.chapter-title {
  flex: 1;
  color: #333;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 1rem;
}

.chapter-arrow {
  color: #7f8c8d;
  font-size: 1.2rem;
}

/* 页脚样式 */
.app-footer {
  background-color: #2c3e50;
  color: #ecf0f1;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}

/* 响应式样式：适配不同屏幕尺寸 */
@media (max-width: 768px) {
  .detail-container {
    padding: 1rem;
  }

  .comic-cover {
    width: 250px;
    height: 375px;
  }

  .chapters-list {
    grid-template-columns: 1fr;
  }

  .header-content {
    padding: 0 1rem;
  }

  .search-input {
    padding: 0.7rem;
    font-size: 0.9rem;
  }

  /* 调整手机端 Logo 大小 */
  .app-logo {
    height: 35px;
  }
}

@media (max-width: 480px) {
  .comic-info-section {
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .comic-cover {
    width: 200px;
    height: 300px;
  }

  .comic-title {
    font-size: 1.8rem;
  }

  .meta-item {
    font-size: 1rem;
  }

  .chapters-section {
    padding: 1.5rem;
  }

  .chapter-item {
    padding: 1rem;
  }

  .chapter-number {
    min-width: 60px;
    font-size: 1rem;
  }

  .chapter-title {
    font-size: 0.95rem;
  }

  .header-content {
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }

  .search-form {
    max-width: 100%;
    width: 100%;
  }

  /* 手机端 Logo 进一步缩小 */
  .app-logo {
    height: 30px;
  }
}

/* 加载动画：旋转效果 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>