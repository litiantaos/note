<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EditorToolbar from './EditorToolbar.vue'
import Contents from './Contents.vue'
import {
  saveSelection,
  restoreSelection,
  setCaretAfterNode,
  isCaretInContentTag,
  moveCaretOutsideContent,
} from '../../utils/caret'
import { getContentType, cleanHTMLString } from '../../utils/note'
import { saveFile, saveNote } from '../../utils/db'
import { createMarker, findContentIndex } from '../../utils/marker'

const title = ref('')
const content = ref('')
const contents = ref([])

const router = useRouter()

// 修改内容标记名称
const onContentNameChange = (id, name) => {
  if (!editorRef.value) return
  const el = editorRef.value.querySelector(`content[data-id="${id}"]`)

  if (!el) return
  const span = el.querySelector('span')

  if (!span) return
  span.textContent = name
}

// 存储文件到 IndexedDB
const saveFileToIndexedDB = async (content) => {
  const type = getContentType(content.type)

  if (type === 'image' || type === 'video' || type === 'file') {
    // 获取文件内容
    const response = await fetch(content.url)
    const blob = await response.blob()

    const file = {
      id: crypto.randomUUID(),
      name: content.name,
      type: content.type,
      size: content.size,
      data: blob,
    }

    await saveFile(file)

    return file.id
  }

  return content.id
}

// 更新标记标签的 data-id
const updateContentMarker = (oldId, newId) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content.value, 'text/html')
  const marker = doc.querySelector(`content[data-id="${oldId}"]`)

  if (marker) {
    marker.setAttribute('data-id', newId)
  }

  content.value = doc.body.innerHTML
}

// 保存笔记
const handleSaveNote = async () => {
  if (!content.value) return

  try {
    const cleanedContents = []

    for (const item of contents.value) {
      const newId = await saveFileToIndexedDB(item)

      updateContentMarker(item.id, newId)

      // 保留除文件外的内容
      const type = getContentType(item.type)

      if (type !== 'image' && type !== 'video' && type !== 'file') {
        cleanedContents.push(item)
      }
    }

    // 清除 <content> 内部元素
    const cleanedContent = cleanHTMLString(content.value)

    // 笔记数据
    const note = {
      id: crypto.randomUUID(),
      title: title.value,
      content: cleanedContent,
      contents: cleanedContents,
      createAt: Date.now(),
      updateAt: Date.now(),
    }

    // 确保数据可以被序列化
    const serializedNote = JSON.parse(JSON.stringify(note))

    // 保存笔记到数据库
    await saveNote(serializedNote)

    // 清空编辑器
    title.value = ''
    content.value = ''
    contents.value = []
    editorRef.value.innerHTML = ''

    router.push('/')
  } catch (error) {
    console.error('保存笔记失败:', error)
  }
}

// 保存光标位置
let savedSelection = null

const saveCaretPosition = () => {
  if (editorRef.value) {
    savedSelection = saveSelection(editorRef.value)
    // console.log('cursor saved', savedSelection)
  }
}

// 插入标记
const insertMarker = ({ id, type, name }) => {
  if (!editorRef.value) return

  // 检查光标是否在标记内
  if (isCaretInContentTag()) return

  let selection = window.getSelection()
  let range = document.createRange()

  // 如果没有保存的光标位置，将标记插入到编辑器末尾
  if (!savedSelection) {
    range.selectNodeContents(editorRef.value)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  } else {
    // 有保存的光标位置则恢复
    restoreSelection(editorRef.value, savedSelection)
  }

  // 确保光标不在任何标记内
  moveCaretOutsideContent()

  // 重新获取选区
  selection = window.getSelection()
  if (selection.rangeCount) {
    range = selection.getRangeAt(0)

    const marker = createMarker({
      id,
      type,
      name,
      onClick: () => {
        const index = findContentIndex(contents.value, id)
        if (index > -1) {
          contentRef.value.setCurrentIndex(index)
        }
      },
      onRemove: () => {
        removeContent(id)
      },
    })

    range.insertNode(marker)
    setCaretAfterNode(marker)
  }

  saveCaretPosition()
}

// 删除文件
const removeContent = (id) => {
  // 删除标记
  if (id) {
    const marker = editorRef.value.querySelector(`content[data-id="${id}"]`)
    marker?.remove()
  }

  const index = findContentIndex(contents.value, id)

  // 如果删除的是最后一个，将索引减一
  if (index === contents.value.length - 1) {
    contentRef.value.setCurrentIndex(index - 1)
  } else {
    contentRef.value.setCurrentIndex(index)
  }

  // 如果是文件则释放 URL 对象
  if (contents.value[index]?.url) {
    URL.revokeObjectURL(contents.value[index].url)
  }

  // 删除内容
  contents.value.splice(index, 1)
}

// 根据编辑器中的标记顺序对内容进行排序
const sortContentsByMarkers = () => {
  const markers = [...editorRef.value.querySelectorAll('content')]
  const markerIds = markers.map((marker) => marker.getAttribute('data-id'))

  contents.value = markerIds
    .map((id) => contents.value.find((content) => content.id === id))
    .filter(Boolean)
}

// 处理内容变化
const handleContentsChange = (items) => {
  const newContents = Array.from(items).map((item) => {
    let obj = {
      id: crypto.randomUUID(),
      name: item.name,
      type: item.type,
    }

    if (
      getContentType(item.type) === 'image' ||
      getContentType(item.type) === 'video' ||
      getContentType(item.type) === 'file'
    ) {
      obj = {
        ...obj,
        size: item.size,
        url: URL.createObjectURL(item),
      }
    } else {
      obj = {
        ...obj,
        data: item.data,
      }
    }

    insertMarker(obj)

    return obj
  })

  // 先将新内容添加到 contents 中
  contents.value = [...contents.value, ...newContents]

  // 然后根据编辑器中标记的顺序重新排序
  sortContentsByMarkers()

  // 将 Contents 组件跳转到新插入的内容
  if (newContents.length > 0) {
    const lastInsertedId = newContents[newContents.length - 1].id
    const newIndex = contents.value.findIndex(
      (content) => content.id === lastInsertedId,
    )
    if (newIndex !== -1) {
      contentRef.value?.setCurrentIndex(newIndex)
    }
  }
}

// 编辑器相关
const editorRef = ref(null)
const contentRef = ref(null)

// 监听编辑器输入
const handleEditorInput = (e) => {
  if (editorRef.value.innerHTML === '<br>') {
    editorRef.value.innerHTML = ''
  }

  content.value = e.target.innerHTML

  saveCaretPosition()

  // 检查是否删除了标记
  const markers = new Set(
    [...editorRef.value.querySelectorAll('content')].map((el) =>
      el.getAttribute('data-id'),
    ),
  )
  contents.value = contents.value.filter((item) => markers.has(item.id))

  // 根据编辑器中标记的顺序重新排序
  sortContentsByMarkers()
}

// 输入框聚焦
const inputFocus = ref(false)

const handleInputBlur = () => {
  if (title.value) return

  inputFocus.value = false
}

onMounted(() => {
  editorRef.value?.focus()
})
</script>

<template>
  <div>
    <input
      type="text"
      v-model="title"
      placeholder="添加标题"
      :class="[
        'h-6 font-semibold transition-all',
        inputFocus
          ? 'w-full rounded-none bg-transparent pl-0'
          : 'w-16 rounded-sm bg-gray-100 pl-2 text-xs',
      ]"
      @focus="inputFocus = true"
      @blur="handleInputBlur"
      @keyup.enter="editorRef.focus()"
    />

    <div
      ref="editorRef"
      contenteditable="true"
      placeholder="心有从容，向阳而生"
      class="relative mt-4 min-h-30 w-full leading-7 empty:before:pointer-events-none empty:before:absolute empty:before:text-gray-400 empty:before:content-[attr(placeholder)]"
      @input="handleEditorInput"
      @click="saveCaretPosition"
      @keyup="saveCaretPosition"
    ></div>

    <div class="mt-4 flex items-center justify-between">
      <EditorToolbar @contents-change="handleContentsChange" />

      <button
        v-if="content"
        class="ri-check-line btn-icon"
        @click="handleSaveNote"
      ></button>
    </div>

    <div v-if="contents.length" class="mt-4">
      <Contents
        ref="contentRef"
        :contents="contents"
        @remove-content="removeContent"
        @name-change="onContentNameChange"
      />
    </div>
  </div>
</template>
