<script setup>
// 保持原有脚本不变
import { createClient } from '@libsql/client/web'
import { ref, onMounted, computed } from 'vue'
import SearchIcon from '@/components/SearchIcon.vue'
import ErrorIcon from '@/components/ErrorIcon.vue'
import EmptyIcon from '@/components/EmptyIcon.vue'
// import LoadingIcon from '@/components/LoadingIcon.vue'

const turso = createClient({
  url: 'libsql://test-super-hao.aws-ap-northeast-1.turso.io',
  authToken:
    'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3NjMwMDE0OTYsImlkIjoiOTQ0ZjQxMWEtMTkzNy00OTYxLWIwZjgtMTZmNDE5ZTIyYTk4IiwicmlkIjoiOGNkMzg2NDMtNzUxNy00MzQ1LWI3N2UtNDlmMjY5NDI3NTFmIn0.9QuHdkavaE6-9-pKqM33zJHGkO6S5tYwNzQdXAyLpy3GYWVj8AacsbTRmX14RSLmH7QLYnalRFZLBc-_1cnBCA',
})

const rawData = ref(null)
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')

const comics = computed(() => {
  if (!rawData.value?.rows || !rawData.value?.columns) return []
  return rawData.value.rows.map((row) => {
    return rawData.value.columns.reduce((obj, col, index) => {
      obj[col] = row[index]
      return obj
    }, {})
  })
})

const filteredComics = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return comics.value
  return comics.value.filter((comic) => comic.title.toLowerCase().includes(query))
})

const fetchComics = async () => {
  try {
    loading.value = true
    const response = await turso.execute('SELECT * FROM comics')
    rawData.value = response
  } catch (err) {
    error.value = '加载漫画失败，请稍后再试'
    console.error('数据库查询错误:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchComics()
})

// 跳转到主页
const goToHome = () => {
  router.push('/')
}

const handleSearch = (e) => {
  e.preventDefault()
}
</script>

<template>
  <div class="comic-app">
    <!-- 顶部导航栏：全屏宽度，内容居中 -->
    <header class="app-header">
      <!-- 内容容器：控制最大宽度，与漫画容器一致 -->
      <div class="header-content">
        <!-- <h1 class="app-title">好好漫画</h1> -->
        <h1 class="app-title" @click="goToHome" style="cursor: pointer">好好漫画</h1>

        <!-- 搜索框 -->
        <form @submit="handleSearch" class="search-form">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索漫画名称..."
            class="search-input"
          />
          <button type="submit" class="search-btn">
            <searchIcon />
          </button>
        </form>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="comic-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <!-- <LoadingIcon class="loading-icon" /> -->
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
            <!-- @error="(e) => e.target.src = 'https://via.placeholder.com/200x300?text=封面缺失'" -->
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

/* 头部样式：关键修改部分 */
.app-header {
  background-color: #fff;
  padding: 1rem 0; /* 上下内边距，左右不设（由内容容器控制） */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%; /* 确保占据全屏宽度 */
  position: sticky; /* 可选：滚动时固定头部 */
  top: 0;
  z-index: 100; /* 确保在内容上方 */
}

/* 头部内容容器：控制最大宽度，与漫画容器一致 */
.header-content {
  max-width: 1400px; /* 和下面的 comic-container 保持一致 */
  width: 100%;
  margin: 0 auto; /* 水平居中 */
  padding: 0 2rem; /* 左右留白，和漫画容器的 padding 一致 */
  display: flex;
  align-items: center; /* 垂直居中对齐 */
  justify-content: space-between; /* 两端对齐，logo 在左，搜索框在右 */
  gap: 1rem; /* 元素之间的最小间距，防止挤在一起 */
}

.app-title {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
  white-space: nowrap; /* 防止标题换行 */
}

/* 搜索框：适配同行布局 */
.search-form {
  display: flex;
  flex: 1; /* 让搜索框容器占据剩余空间 */
  max-width: 600px; /* 限制搜索框最大宽度，避免太宽 */
  gap: 0.5rem;
  min-width: 150px; /* 最小宽度，防止手机上太窄 */
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

/* 加载状态 */
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

/* 错误状态 */
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

/* 空状态 */
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

/* 漫画网格 */
.comic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

/* 漫画卡片 */
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
  padding-top: 133%; /* 3:4 比例 */
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

/* 响应式调整：优化手机端显示 */
@media (max-width: 768px) {
  .comic-container {
    padding: 1rem;
  }

  .comic-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  /* 头部响应式：标题缩小，搜索框适配 */
  .app-title {
    font-size: 1.5rem;
  }

  .header-content {
    padding: 0 1rem; /* 手机端左右留白减小 */
  }

  .search-input {
    padding: 0.7rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .comic-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .comic-title {
    font-size: 1rem;
  }

  /* 手机端：标题和搜索框换行显示，确保不拥挤 */
  .header-content {
    flex-direction: column; /* 垂直排列 */
    align-items: center; /* 居中对齐 */
    gap: 0.8rem;
  }

  .search-form {
    max-width: 100%; /* 搜索框占满宽度 */
    width: 100%;
  }

  .app-title {
    font-size: 1.4rem;
  }
}
</style>
