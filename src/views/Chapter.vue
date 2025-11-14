<script setup>
import { ref, onMounted, computed, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorIcon from '@/components/ErrorIcon.vue'
import EmptyIcon from '@/components/EmptyIcon.vue'
import ChevronLeftIcon from '@/components/ChevronLeftIcon.vue'
import ChevronRightIcon from '@/components/ChevronRightIcon.vue'
import HomeIcon from '@/components/HomeIcon.vue'
import BookIcon from '@/components/BookIcon.vue'
import MoonIcon from '@/components/MoonIcon.vue'
import SunIcon from '@/components/SunIcon.vue'
// 导入 Service 方法
import {
  getChapterById,
  getComicById,
  getPagesByChapterId,
  getAdjacentChapters,
} from '@/services/comicService'

// 路由相关：保持不变
const route = useRoute()
const router = useRouter()
const chapterId = computed(() => {
  const id = route.params.chapterId
  return id ? String(id).trim() : ''
})

// 状态管理
const pages = ref([])
const loading = ref(true)
const error = ref(null)
const toolbarVisible = ref(false) // 默认隐藏
const chapterInfo = ref(null)
const comicInfo = ref(null)
const adjacentChapters = ref({ prev: null, next: null })
const themeMode = ref(localStorage.getItem('comicThemeMode') || 'light')

// 计算属性：保持不变
const hasPrevChapter = computed(() => !!adjacentChapters.value.prev)
const hasNextChapter = computed(() => !!adjacentChapters.value.next)
const isDarkMode = computed(() => themeMode.value === 'dark')

// 主题切换、点击控制、键盘导航
const toggleThemeMode = () => {
  const newMode = themeMode.value === 'light' ? 'dark' : 'light'
  themeMode.value = newMode
  localStorage.setItem('comicThemeMode', newMode)
  nextTick(() => {
    document.documentElement.classList.toggle('dark-mode', newMode === 'dark')
  })
}

const handleContentClick = () => {
  toolbarVisible.value = !toolbarVisible.value
}

const handleKeydown = (e) => {
  const scrollContainer = document.querySelector('.scroll-container')
  if (!scrollContainer || pages.value.length === 0) return

  switch (e.key) {
    case 'ArrowLeft':
      goToPrevChapter()
      break
    case 'ArrowRight':
      goToNextChapter()
      break
    case 'Home':
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
      break
    case 'End':
      scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })
      break
    case 'Escape':
      toolbarVisible.value = !toolbarVisible.value
      break
  }
}

// 数据加载函数，调用 Service
const fetchData = async () => {
  loading.value = true
  error.value = null
  chapterInfo.value = null
  comicInfo.value = null
  adjacentChapters.value = { prev: null, next: null }

  try {
    // 1. 获取章节基本信息
    const chapterData = await getChapterById(chapterId.value)
    chapterInfo.value = chapterData

    // 2. 并行获取：漫画信息、章节图片、相邻章节
    const [comicData, pagesData, adjacentData] = await Promise.all([
      getComicById(chapterData.comic_id),
      getPagesByChapterId(chapterData.id),
      getAdjacentChapters(chapterData.comic_id, chapterData.number),
    ])

    comicInfo.value = comicData
    pages.value = pagesData
    adjacentChapters.value = adjacentData

    // 检查图片是否为空
    if (pages.value.length === 0) error.value = '该章节暂无有效图片内容'
  } catch (err) {
    error.value = err.message // Service 抛出的错误信息
  } finally {
    loading.value = false
  }
}

// 导航功能、监听、生命周期：保持不变
const goToPrevChapter = () => {
  try {
    const { prev } = adjacentChapters.value
    const comicId = chapterInfo.value?.comic_id
    if (prev && comicId) {
      router.push({ path: `/comic/${comicId}/chapter/${prev.id}`, replace: true })
    }
  } catch (err) {}
}

const goToNextChapter = () => {
  try {
    const { next } = adjacentChapters.value
    const comicId = chapterInfo.value?.comic_id
    if (next && comicId) {
      router.push({ path: `/comic/${comicId}/chapter/${next.id}`, replace: true })
    }
  } catch (err) {}
}

const goToChapterList = () => {
  try {
    const comicId = chapterInfo.value?.comic_id
    if (comicId) router.push(`/comic/${comicId}`)
  } catch (err) {}
}

const goToHome = () => {
  try {
    router.push('/')
  } catch (err) {}
}

watch(
  chapterId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchData()
    }
  },
  { immediate: false },
)

watch(
  themeMode,
  (newMode) => {
    document.documentElement.classList.toggle('dark-mode', newMode === 'dark')
  },
  { immediate: true },
)

onMounted(() => {
  nextTick(() => {
    if (!chapterId.value) {
      goToHome()
    } else {
      fetchData()
    }
  })

  window.addEventListener('keydown', handleKeydown)
  document.documentElement.classList.toggle('dark-mode', themeMode.value === 'dark')
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="comic-reader" :class="isDarkMode ? 'dark-mode' : 'light-mode'">
    <!-- 顶部工具栏：默认显示 -->
    <header class="reader-header" :class="{ visible: toolbarVisible }" v-if="chapterInfo">
      <div class="header-content">
        <div class="header-left">
          <button @click="goToHome" class="nav-btn" title="返回首页">
            <HomeIcon />
          </button>
          <button @click="goToChapterList" class="nav-btn" title="章节列表">
            <BookIcon />
          </button>
        </div>

        <!-- 漫画标题：修改响应式逻辑，移动端也显示 -->
        <div class="header-title">
          <h3 class="comic-name">{{ comicInfo?.title || '未知漫画' }}</h3>
          <p class="chapter-name">{{ chapterInfo?.title || '未知章节' }}</p>
        </div>

        <div class="header-right">
          <!-- 主题切换按钮 -->
          <button
            @click="toggleThemeMode"
            class="theme-toggle-btn"
            :title="isDarkMode ? '切换浅色模式' : '切换暗色模式'"
          >
            <template v-if="isDarkMode">
              <SunIcon />
            </template>
            <template v-else>
              <MoonIcon />
            </template>
          </button>
        </div>
      </div>
    </header>

    <!-- 主阅读区：滚动模式 -->
    <main class="reader-content" @click="handleContentClick">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载漫画中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <ErrorIcon />
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">重试</button>
        <button @click="goToChapterList" class="back-btn" v-if="chapterInfo?.comic_id">
          返回章节列表
        </button>
        <button @click="goToHome" class="back-btn" v-else>返回首页</button>
      </div>

      <div v-else-if="pages.length === 0" class="empty-state">
        <EmptyIcon />
        <p>该章节暂无有效图片内容</p>
        <button @click="goToChapterList" class="back-btn" v-if="chapterInfo?.comic_id">
          返回章节列表
        </button>
        <button @click="goToHome" class="back-btn" v-else>返回首页</button>
      </div>

      <!-- 滚动式漫画阅读区 -->
      <div v-else class="scroll-container">
        <div class="comic-scroll-content">
          <!-- 遍历所有漫画页，纵向排列 -->
          <div v-for="(page, index) in pages" :key="page.id || index" class="comic-page-item">
            <img
              :src="
                isDarkMode
                  ? `https://placehold.co/800x1200/333333/FFFFFF?text=${index + 1} page loading`
                  : `https://placehold.co/800x1200/F8F9FA/666666?text=${index + 1} page loading`
              "
              @load="(e) => (e.target.src = page.image)"
              @error="
                (e) => {
                  e.target.src = isDarkMode
                    ? `https://placehold.co/800x1200/333333/FFFFFF?text=${index + 1} page error`
                    : `https://placehold.co/800x1200/F8F9FA/666666?text=${index + 1} page error`
                }
              "
              :alt="`第 ${index + 1} 页`"
              class="comic-image"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- 底部工具栏 -->
    <footer class="reader-toolbar" :class="{ visible: toolbarVisible }" v-if="chapterInfo">
      <div class="toolbar-content">
        <button
          @click="goToPrevChapter"
          class="chapter-btn prev-chapter"
          :disabled="!hasPrevChapter"
          :title="hasPrevChapter ? '上一章' : '没有上一章'"
        >
          <ChevronLeftIcon />
          <span>上一章</span>
        </button>

        <button
          @click="goToNextChapter"
          class="chapter-btn next-chapter"
          :disabled="!hasNextChapter"
          :title="hasNextChapter ? '下一章' : '没有下一章'"
        >
          <span>下一章</span>
          <ChevronRightIcon />
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 全局样式：使用CSS变量实现主题切换 */
.comic-reader {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  position: relative;
  transition: background-color 0.3s ease;
}

/* 顶部工具栏：默认显示，滚动时隐藏 */
.reader-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-toolbar);
  backdrop-filter: blur(8px);
  padding: 0.6rem 0;
  z-index: 100;
  transform: translateY(0);
  transition:
    transform 0.3s ease,
    background-color 0.3s ease;
  border-bottom: 1px solid var(--border-color);
}

.reader-header:not(.visible) {
  transform: translateY(-100%);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* 左侧导航按钮 */
.header-left {
  display: flex;
  gap: 1rem;
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.nav-btn:hover {
  background-color: var(--btn-bg-hover);
}

/* 中间标题区域：修改响应式，移动端不隐藏 */
.header-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1; /* 让标题区域占据中间剩余空间 */
}

.comic-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
  color: var(--text-primary);
}

.chapter-name {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* 右侧区域：主题切换按钮 */
.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 主题切换按钮样式 */
.theme-toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.theme-toggle-btn:hover {
  background-color: var(--btn-bg-hover);
}

/* 主阅读区：滚动容器 */
.reader-content {
  width: 100%;
  height: 100vh;
  position: relative;
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
  box-sizing: border-box;
}

/* 滚动条美化（使用CSS变量） */
.scroll-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scroll-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.scroll-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* 漫画滚动内容：居中显示 */
.comic-scroll-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 0;
}

/* 单页漫画样式 */
.comic-page-item {
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: var(--bg-primary);
}

.comic-image {
  width: 800px;
  height: auto;
  max-width: 100%;
  object-fit: contain;
}

/* 加载状态 */
.loading-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 错误状态 */
.error-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  color: #dc3545;
  padding: 0 2rem;
  text-align: center;
}

/* 空状态 */
.empty-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  color: var(--text-secondary);
  padding: 0 2rem;
  text-align: center;
}

/* 按钮样式 */
.retry-btn,
.back-btn {
  background-color: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 0 0.5rem;
}

.back-btn {
  background-color: var(--btn-bg);
  color: var(--btn-text);
}

.retry-btn:hover {
  background-color: #359469;
}

.back-btn:hover {
  background-color: var(--btn-bg-hover);
}

/* 底部工具栏 */
.reader-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-toolbar);
  backdrop-filter: blur(8px);
  padding: 0.8rem 0;
  z-index: 100;
  transform: translateY(0);
  transition:
    transform 0.3s ease,
    background-color 0.3s ease;
  border-top: 1px solid var(--border-color);
}

.reader-toolbar:not(.visible) {
  transform: translateY(100%);
}

.toolbar-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* 章节切换按钮：优化样式，适应精简布局 */
.chapter-btn {
  background-color: var(--btn-bg);
  color: var(--btn-text);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  flex: 1; /* 让按钮自适应宽度 */
  max-width: 45%; /* 限制最大宽度，避免按钮过宽 */
}

.chapter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--border-color);
  border-color: var(--border-color);
}

.chapter-btn:not(:disabled):hover {
  background-color: var(--btn-bg-hover);
  border-color: var(--accent-color);
}

.prev-chapter {
  justify-content: center; /* 上一章按钮居中显示 */
}

.next-chapter {
  justify-content: center; /* 下一章按钮居中显示 */
}

/* 加载动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式调整：优化移动端标题显示 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }

  .comic-name {
    max-width: 180px; /* 移动端缩小最大宽度，避免溢出 */
    font-size: 1rem;
  }

  .chapter-name {
    font-size: 0.85rem;
  }

  .toolbar-content {
    padding: 0 1rem;
    gap: 0.8rem;
  }

  .comic-scroll-content {
    padding: 0 0;
  }

  .chapter-btn {
    padding: 0.7rem 1rem;
    font-size: 0.95rem;
  }

  .scroll-container {
    /* padding: 60px 0 70px 0; */
    padding: 0 0 0 0;
  }
}

@media (max-width: 480px) {
  /* 移动端保持标题显示，不隐藏 */
  .header-title {
    display: flex;
    flex: 1;
  }

  .toolbar-content {
    flex-direction: row; /* 保持横向布局，避免按钮占满整行 */
    gap: 0.5rem;
  }

  .chapter-btn {
    max-width: 48%; /* 移动端调整按钮宽度，适应屏幕 */
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .comic-page-item {
    margin-bottom: 0;
    padding: 0 0;
  }

  .scroll-container {
    /* padding: 55px 0 65px 0; */
    padding: 0 0 0 0;
  }
}
</style>
