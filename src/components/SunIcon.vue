<template>
  <!-- 太阳图标：适配浅色/暗色模式的颜色自动继承 -->
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
    class="sun-icon"
  >
    <!-- 太阳主体 -->
    <circle cx="12" cy="12" r="5" />
    <!-- 太阳光芒（8个方向） -->
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
</template>

<style scoped>
/* 图标颜色继承父元素（自动适配主题） */
.sun-icon {
  color: inherit;
  transition: transform 0.2s ease;
}

/*  hover 时轻微旋转效果，提升交互感 */
.sun-icon:hover {
  transform: rotate(15deg);
}
</style>
