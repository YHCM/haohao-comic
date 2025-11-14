<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router' // 新增：导入路由钩子
import SearchIcon from '@/components/SearchIcon.vue'
import ErrorIcon from '@/components/ErrorIcon.vue'
import EmptyIcon from '@/components/EmptyIcon.vue'
import Logo from '@/components/Logo.vue'
import { getAllComics, searchComicsByTitle } from '@/services/comicService'

const route = useRoute() // 获取当前路由实例
const comics = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')

const filteredComics = computed(() => {
  return comics.value
})

// 搜索核心逻辑
const fetchComics = async (keyword = '') => {
  const trimmedKeyword = keyword.trim()
  try {
    loading.value = true
    error.value = null
    const data = await (trimmedKeyword ? searchComicsByTitle(keyword) : getAllComics())
    comics.value = data
  } catch (err) {
    error.value = err.message
    console.error('加载漫画失败:', err)
  } finally {
    loading.value = false
  }
}

// 新增：监听路由search参数变化，自动触发搜索
watch(
  () => route.query.search, // 监听路由上的search参数
  (newSearchVal) => {
    const keyword = newSearchVal?.trim() || ''
    searchQuery.value = keyword // 同步参数到搜索输入框
    fetchComics(keyword) // 触发搜索
  },
  { immediate: true } // 初始挂载时就执行一次（处理页面刷新时的参数）
)

// 表单提交搜索
const handleSearch = (e) => {
  e.preventDefault()
  fetchComics(searchQuery.value)
}
</script>

<template>
  <div class="comic-app">
    <!-- 顶部导航栏：全屏宽度，内容居中 -->
    <header class="app-header">
      <!-- 内容容器：控制最大宽度，与漫画容器一致 -->
      <div class="header-content">
        <Logo class="app-logo" />

        <!-- 搜索框 -->
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

    <!-- 主内容区 -->
    <main class="comic-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <ErrorIcon />
        <p>{{ error }}</p>
      </div>

      <div v-else-if="filteredComics.length === 0" class="empty-state">
        <EmptyIcon />
        <p>没有找到相关漫画</p>
      </div>

      <div class="comic-grid">
        <div
          v-for="comic in filteredComics"
          :key="comic.id"
          class="comic-card"
          @click="$router.push(`/comic/${comic.id}`)"
        >
          <div class="comic-cover">
            <img :src="comic.cover" :alt="comic.title" class="cover-image" loading="lazy" />
          </div>
          <div class="comic-info">
            <h3 class="comic-title">{{ comic.title }}</h3>
            <p class="comic-date">{{ comic.created_at.split(' ')[0] }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <p>© 2025 haohao-comic.pages.dev 好好漫画</p>
    </footer>
  </div>
</template>

<style scoped>
/* 全局样式 */
.comic-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  color: #333;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 头部样式：添加 Logo 相关样式 */
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

/* Logo 样式：根据实际 Logo 大小调整，确保适配布局 */
.app-logo {
  /* 可根据 Logo 实际尺寸调整，这里提供默认适配 */
  width: auto;
  height: 40px; /* 控制 Logo 高度，避免过大 */
  cursor: pointer; /* 保持指针样式，提示可点击 */
}

/* 搜索框样式（保持不变） */
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
.comic-container {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40vh;
  gap: 1rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-icon {
  width: 50px;
  height: 50px;
  color: #42b983;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40vh;
  gap: 1rem;
  color: #dc3545;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40vh;
  gap: 1rem;
  color: #666;
  text-align: center;
}

.comic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

.comic-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.comic-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.comic-cover {
  position: relative;
  padding-top: 133%;
  overflow: hidden;
  background-color: #f0f0f0;
}

.cover-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.comic-card:hover .cover-image {
  transform: scale(1.05);
}

.comic-info {
  padding: 0.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.comic-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comic-date {
  margin: 0;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: auto;
}

/* 页脚样式 */
.app-footer {
  background-color: #2c3e50;
  color: #ecf0f1;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}

/* 响应式调整：优化 Logo 在手机端的显示 */
@media (max-width: 768px) {
  .comic-container {
    padding: 1rem;
  }

  .comic-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
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
  .comic-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .comic-title {
    font-size: 1rem;
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
</style>
