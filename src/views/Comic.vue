<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorIcon from '@/components/ErrorIcon.vue'
import EmptyIcon from '@/components/EmptyIcon.vue'
import SearchIcon from '@/components/SearchIcon.vue'
import Logo from '@/components/Logo.vue'
// 导入 Service 方法
import { getComicById, getChaptersByComicId } from '@/services/comicService'

// 路由相关：保持不变
const route = useRoute()
const router = useRouter()
const comicId = computed(() => route.params.comicId)
const searchQuery = ref('')

// 状态管理
const comic = ref(null)
const chapters = ref([])
const loading = ref(true)
const error = ref(null)

// 日期格式化工具：保持不变
const formatDate = (dateString) => {
  return dateString.split(' ')[0]
}

// 调用 Service
const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    // 并行调用 Service 方法
    const [comicData, chaptersData] = await Promise.all([
      getComicById(comicId.value),
      getChaptersByComicId(comicId.value),
    ])
    comic.value = comicData
    chapters.value = chaptersData
  } catch (err) {
    error.value = err.message // Service 抛出的错误信息
    console.error('加载数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 章节点击、搜索提交
const handleChapterClick = (chapterId) => {
  router.push(`/comic/${comicId.value}/chapter/${chapterId}`)
}

const handleSearch = (e) => {
  e.preventDefault()
  const query = searchQuery.value.trim()
  if (query) {
    router.push({ path: '/', query: { search: query } })
  } else {
    router.push('/')
  }
}

// 页面挂载：保持不变
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
              <div class="chapter-title">{{ chapter.title }}</div>
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

.chapter-title {
  flex: 1;
  color: #333;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 1rem;
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
