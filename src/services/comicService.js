import turso from './db.js'

/**
 * 工具函数：将 Turso 响应（columns + rows）格式化为对象数组
 * @param {Object} response - Turso 执行结果
 * @returns {Array} 格式化后的对象数组
 */
const formatResponse = (response) => {
  if (!response?.columns || !response?.rows) return []
  return response.rows.map((row) => {
    return response.columns.reduce((obj, col, index) => {
      obj[col] = row[index]
      return obj
    }, {})
  })
}

/**
 * 工具函数：将 Turso 响应格式化为单个对象（适用于查询单条数据）
 * @param {Object} response - Turso 执行结果
 * @returns {Object|null} 格式化后的单个对象（无结果返回 null）
 */
const formatSingleResponse = (response) => {
  const formatted = formatResponse(response)
  return formatted.length > 0 ? formatted[0] : null
}

// ---------------------- 核心业务方法 ----------------------
/**
 * 1. 获取所有漫画（首页用）
 */
export const getAllComics = async () => {
  try {
    const response = await turso.execute('SELECT * FROM comics')
    return formatResponse(response)
  } catch (error) {
    console.error('获取漫画列表失败：', error)
    throw new Error('加载漫画失败，请稍后再试')
  }
}

/**
 * 2. 根据漫画ID获取漫画详情
 * @param {string|number} comicId - 漫画ID
 */
export const getComicById = async (comicId) => {
  try {
    const response = await turso.execute({
      sql: 'SELECT * FROM comics WHERE id = ?',
      args: [comicId],
    })
    const comic = formatSingleResponse(response)
    if (!comic) throw new Error(`漫画ID ${comicId} 不存在`)
    return comic
  } catch (error) {
    console.error('获取漫画详情失败：', error)
    throw new Error(error.message || '加载漫画详情失败，请稍后再试')
  }
}

/**
 * 3. 根据漫画ID获取章节列表（按章节号升序）
 * @param {string|number} comicId - 漫画ID
 */
export const getChaptersByComicId = async (comicId) => {
  try {
    const response = await turso.execute({
      sql: 'SELECT * FROM chapters WHERE comic_id = ? ORDER BY number ASC',
      args: [comicId],
    })
    return formatResponse(response)
  } catch (error) {
    console.error('获取章节列表失败：', error)
    throw new Error('加载章节列表失败，请稍后再试')
  }
}

/**
 * 4. 根据章节ID获取章节信息
 * @param {string|number} chapterId - 章节ID
 */
export const getChapterById = async (chapterId) => {
  try {
    const response = await turso.execute({
      sql: 'SELECT id, comic_id, number, title FROM chapters WHERE id = ?',
      args: [chapterId],
    })
    const chapter = formatSingleResponse(response)
    if (!chapter) throw new Error(`章节ID ${chapterId} 不存在`)
    return chapter
  } catch (error) {
    console.error('获取章节信息失败：', error)
    throw new Error(error.message || '加载章节信息失败，请稍后再试')
  }
}

/**
 * 5. 根据章节ID获取页面列表（按页码升序，过滤无效图片）
 * @param {string|number} chapterId - 章节ID
 */
export const getPagesByChapterId = async (chapterId) => {
  try {
    const response = await turso.execute({
      sql: 'SELECT id, image, number FROM pages WHERE chapter_id = ? ORDER BY number ASC',
      args: [chapterId],
    })
    let pages = formatResponse(response)
    // 过滤无效图片（必须是http/https链接）
    pages = pages.filter(
      (page) =>
        page.image &&
        typeof page.image === 'string' &&
        page.image.trim() &&
        (page.image.startsWith('http://') || page.image.startsWith('https://')),
    )
    return pages
  } catch (error) {
    console.error('获取章节图片失败：', error)
    throw new Error('加载漫画图片失败，请稍后再试')
  }
}

/**
 * 6. 获取相邻章节（上一章/下一章）
 * @param {string|number} comicId - 漫画ID
 * @param {number} chapterNumber - 当前章节号
 */
export const getAdjacentChapters = async (comicId, chapterNumber) => {
  try {
    // 并行查询上一章和下一章（提升效率）
    const [prevRes, nextRes] = await Promise.all([
      turso.execute({
        sql: 'SELECT id, number FROM chapters WHERE comic_id = ? AND number = ?',
        args: [comicId, chapterNumber - 1],
      }),
      turso.execute({
        sql: 'SELECT id, number FROM chapters WHERE comic_id = ? AND number = ?',
        args: [comicId, chapterNumber + 1],
      }),
    ])
    return {
      prev: formatSingleResponse(prevRes),
      next: formatSingleResponse(nextRes),
    }
  } catch (error) {
    console.error('获取相邻章节失败：', error)
    // 相邻章节获取失败不阻断主流程，返回空对象
    return { prev: null, next: null }
  }
}

/**
 * 7. 根据漫画标题搜索漫画
 * @param {string} keyword - 搜索关键词
 */
export const searchComicsByTitle = async (keyword) => {
  try {
    const lowerKeyword = keyword.trim().toLowerCase()
    if (!lowerKeyword) return getAllComics() // 无关键词则返回所有漫画
    const response = await turso.execute({
      sql: 'SELECT * FROM comics WHERE LOWER(title) LIKE ?',
      args: [`%${lowerKeyword}%`], // 模糊查询（包含关键词）
    })
    return formatResponse(response)
  } catch (error) {
    console.error('搜索漫画失败：', error)
    throw new Error('搜索失败，请稍后再试')
  }
}
