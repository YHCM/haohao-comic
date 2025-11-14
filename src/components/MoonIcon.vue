<template>
  <!-- 月亮图标：适配浅色/暗色模式的颜色自动继承 -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="moon-icon"
  >
    <!-- 月亮主体 -->
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
</template>

<style scoped>
/* 图标颜色继承父元素（自动适配主题） */
.moon-icon {
  color: inherit;
  transition: transform 0.2s ease;
}

/* hover 时轻微缩放效果，提升交互感 */
.moon-icon:hover {
  transform: scale(1.1);
}
</style>
