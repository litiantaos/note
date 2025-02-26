export const contentType = {
  image: { icon: 'ri-image-line', color: 'text-teal-500' },
  video: { icon: 'ri-movie-line', color: 'text-cyan-500' },
  file: { icon: 'ri-folder-line', color: 'text-indigo-500' },
  table: { icon: 'ri-table-line', color: 'text-blue-500' },
  code: { icon: 'ri-terminal-box-line', color: 'text-slate-500' },
  note: { icon: 'ri-layout-top-2-line', color: 'text-orange-500' },
  link: { icon: 'ri-link', color: 'text-sky-500' },
}

// 内容类型
export const getContentType = (type) => {
  if (type.startsWith('image/')) return 'image'
  else if (type.startsWith('video/')) return 'video'
  else if (type.includes('/')) return 'file'
  else return type
}

// 将全部 <content> 内部清空
export const cleanHTMLString = (htmlString) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')

  // 查找所有的content标签
  const contentElements = doc.querySelectorAll(
    'content[contenteditable="false"]',
  )

  contentElements.forEach((element) => {
    // 清空内部内容
    element.innerHTML = ''
    // 删除contenteditable属性
    element.removeAttribute('contenteditable')
  })

  // 返回处理后的HTML字符串
  return doc.body.innerHTML
}
