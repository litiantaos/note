// 保存光标位置
export function saveSelection(containerEl) {
  const selection = window.getSelection()
  if (!selection.rangeCount || !isSelectionInContainer(containerEl)) {
    return null
  }

  const range = selection.getRangeAt(0)
  const startOffset = getNodeOffset(
    containerEl,
    range.startContainer,
    range.startOffset,
  )
  const endOffset = getNodeOffset(
    containerEl,
    range.endContainer,
    range.endOffset,
  )

  return { start: startOffset, end: endOffset }
}

// 恢复光标位置
export function restoreSelection(containerEl, savedSel) {
  if (!savedSel) return

  const selection = window.getSelection()
  const range = document.createRange()
  const [startNode, startOffset] = getNodeAndOffset(containerEl, savedSel.start)
  const [endNode, endOffset] = getNodeAndOffset(containerEl, savedSel.end)

  if (startNode && endNode) {
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

// 将光标设置到指定节点后面
export function setCaretAfterNode(node) {
  const selection = window.getSelection()
  const range = document.createRange()

  range.setStartAfter(node)
  range.collapse(true)

  // 插入空格并设置光标
  const space = document.createTextNode('\u200B') // 使用零宽空格
  range.insertNode(space)
  range.selectNode(space)
  range.collapse(false)

  selection.removeAllRanges()
  selection.addRange(range)
}

// 获取节点在容器中的偏移量
function getNodeOffset(container, node, offset) {
  let charCount = 0
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const currentNode = walker.currentNode
    if (currentNode === node) {
      return charCount + offset
    }
    charCount += currentNode.length
  }
  return charCount
}

// 根据偏移量获取节点和位置
function getNodeAndOffset(container, targetOffset) {
  let charCount = 0
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const node = walker.currentNode
    const nextCount = charCount + node.length

    if (targetOffset <= nextCount) {
      return [node, targetOffset - charCount]
    }
    charCount = nextCount
  }
  return [null, 0]
}

// 检查光标是否在容器内
function isSelectionInContainer(containerEl) {
  const selection = window.getSelection()
  return (
    selection.rangeCount > 0 &&
    containerEl.contains(selection.getRangeAt(0).commonAncestorContainer)
  )
}

// 检查光标是否在标记内
export function isCaretInContentTag() {
  const selection = window.getSelection()
  if (!selection.rangeCount) return false

  let node = selection.getRangeAt(0).commonAncestorContainer
  while (node && node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode
  }

  return node?.tagName?.toLowerCase() === 'content'
}

// 移动光标到最近的标记外部
export function moveCaretOutsideContent() {
  const selection = window.getSelection()
  if (!selection.rangeCount) return

  let node = selection.getRangeAt(0).commonAncestorContainer
  while (node && node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode
  }

  if (node?.tagName?.toLowerCase() === 'content') {
    setCaretAfterNode(node)
    return true
  }
  return false
}
