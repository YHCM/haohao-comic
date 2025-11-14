import { createClient } from '@libsql/client/web'

// 初始化 Turso 客户端（单例模式，确保全局只创建一个连接）
const turso = createClient({
  url: 'libsql://test-super-hao.aws-ap-northeast-1.turso.io',
  authToken:
    'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3NjMwMDE0OTYsImlkIjoiOTQ0ZjQxMWEtMTkzNy00OTYxLWIwZjgtMTZmNDE5ZTIyYTk4IiwicmlkIjoiOGNkMzg2NDMtNzUxNy00MzQ1LWI3N2UtNDlmMjY5NDI3NTFmIn0.9QuHdkavaE6-9-pKqM33zJHGkO6S5tYwNzQdXAyLpy3GYWVj8AacsbTRmX14RSLmH7QLYnalRFZLBc-_1cnBCA',
})
// cloudflare pages 不能用 .env，之后再用
// const turso = createClient({
//   url: import.meta.env.VITE_URL,
//   authToken: import.meta.env.VITE_AUTH_TOKEN,
// })

// 导出客户端
export default turso
