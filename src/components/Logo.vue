<template>
  <!-- 好好漫画艺术字 SVG，可直接点击跳转首页 -->
  <svg
    class="logo-svg"
    viewBox="0 0 200 40"
    xmlns="http://www.w3.org/2000/svg"
    @click="$router.push('/')"
  >
    <!-- 渐变背景（可选，增加质感） -->
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#42b983" />
        <stop offset="100%" stop-color="#359469" />
      </linearGradient>
    </defs>

    <!-- 艺术字路径（「好好漫画」手写风格变体） -->
    <text
      x="0"
      y="28"
      font-family="'Segoe UI', 'Microsoft YaHei', sans-serif"
      font-size="24"
      font-weight="600"
      fill="url(#logoGradient)"
    >
      好好漫画
    </text>

    <!-- 底部装饰线（增加设计感） -->
    <path
      d="M0 32 L200 32"
      stroke="url(#logoGradient)"
      stroke-width="2"
      stroke-linecap="round"
      opacity="0.6"
    />
  </svg>
</template>

<style scoped>
.logo-svg {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo-svg:hover {
  transform: scale(1.05); /* hover 轻微放大，增加交互感 */
}
</style>
