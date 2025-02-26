let db = null

const DB_NAME = 'noteDB'
const DB_VERSION = 2
const STORES = {
  files: 'files',
  notes: 'notes',
}

// 通用数据库操作函数
const dbOperation = async (storeName, operation, mode = 'readonly') => {
  try {
    const db = await connectDB()
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    return await operation(store)
  } catch (error) {
    throw new Error(`操作 ${storeName} 失败: ${error.message}`)
  }
}

// 版本升级处理函数集合
const upgradeHandlers = new Map([
  [
    1,
    (db) => {
      // 初始版本：创建基础存储
      db.createObjectStore(STORES.files, { keyPath: 'id' })
      const notesStore = db.createObjectStore(STORES.notes, { keyPath: 'id' })
      notesStore.createIndex('createAt', 'createAt')
    },
  ],
  [
    2,
    (db, transaction) => {
      // 版本2的升级操作
      const notesStore = transaction.objectStore(STORES.notes)
      if (!notesStore.indexNames.contains('createAt')) {
        notesStore.createIndex('createAt', 'createAt')
      }
    },
  ],
])

// 版本升级处理函数
const handleUpgrade = (event) => {
  const db = event.target.result
  const oldVersion = event.oldVersion
  const transaction = event.target.transaction

  for (let version = oldVersion + 1; version <= DB_VERSION; version++) {
    const handler = upgradeHandlers.get(version)
    if (handler) {
      console.log(`升级到版本 ${version}`)
      handler(db, transaction)
    }
  }
}

// 连接数据库
const connectDB = () => {
  if (db && db.objectStoreNames.length > 0) return Promise.resolve(db)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      db = request.result
      db.onclose = () => {
        db = null
      } // 监听关闭事件
      resolve(db)
    }

    request.onupgradeneeded = handleUpgrade

    request.onblocked = () => {
      console.warn('数据库被其他标签页阻塞，请关闭其他标签页')
    }
  })
}

// 通用保存函数
const save = (storeName) => async (item) => {
  return dbOperation(storeName, (store) => store.put(item), 'readwrite')
}

// 通用获取函数
const get = (storeName) => async (id) => {
  return dbOperation(
    storeName,
    (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get(id)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    },
    'readonly',
  )
}

// 导出具体操作函数
export const saveFile = save(STORES.files)
export const getFile = get(STORES.files)
export const saveNote = save(STORES.notes)
export const getNote = get(STORES.notes)

// 获取全部笔记
export const getAllNotes = async () => {
  return dbOperation(
    STORES.notes,
    (store) => {
      const index = store.index('createAt')
      const request = index.openCursor(null, 'prev')
      const results = []
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            results.push(cursor.value)
            cursor.continue()
          } else {
            resolve(results)
          }
        }
        request.onerror = () => reject(request.error)
      })
    },
    'readonly',
  )
}

// 删除笔记
export const deleteNote = async (id) => {
  return dbOperation(STORES.notes, (store) => store.delete(id), 'readwrite')
}

// 搜索笔记
export const searchNotes = async (keyword) => {
  if (!keyword || !keyword.trim()) {
    throw new Error('请输入搜索关键词')
  }

  return dbOperation(
    STORES.notes,
    (store) => {
      return new Promise((resolve, reject) => {
        const request = store.openCursor()
        const results = []
        const searchTerm = keyword.toLowerCase()

        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            const { title, content } = cursor.value
            const parser = new DOMParser()
            const doc = parser.parseFromString(content || '', 'text/html')
            const plainText = doc.body.textContent.toLowerCase()

            if (
              title?.toLowerCase().includes(searchTerm) ||
              plainText.includes(searchTerm)
            ) {
              results.push({ ...cursor.value })
            }
            cursor.continue()
          } else {
            resolve(results)
          }
        }
        request.onerror = () => reject(request.error)
      })
    },
    'readonly',
  )
}
