<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Contents from '../editor/Contents.vue'
import { formatDate } from '../../utils'
import { contentType, getContentType } from '../../utils/note'
import { findContentIndex } from '../../utils/marker'
import { deleteNote, getFile } from '../../utils/db'

const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
  hideContents: {
    type: Boolean,
    default: false,
  },
  customStyle: {
    type: String,
    default: 'border-b px-4 py-6',
  },
})

const emit = defineEmits(['delete'])

const router = useRouter()
const route = useRoute()

const goToNote = () => {
  router.push({
    name: 'note',
    params: { id: props.note.id },
  })
}

const contentsRef = ref(null)
const contentRef = ref(null)

// 笔记内容，包含实际的文件内容
const noteContents = ref(props.note.contents || [])

// 删除笔记
const deleting = ref(false)

const handleDelete = async () => {
  if (deleting.value) {
    await deleteNote(props.note.id)
    emit('delete')

    deleting.value = false

    router.push('/')
  } else {
    deleting.value = true
  }
}

// 初始化文件内容
const initFileContent = async (id) => {
  try {
    const file = await getFile(id)

    if (!file) return null

    return {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file.data),
    }
  } catch (error) {
    console.error('Failed to load file:', error)
    return null
  }
}

// 初始化内容标记
const initContentMark = async () => {
  if (!contentRef.value) return

  // 查找所有标记元素
  const markers = contentRef.value.querySelectorAll('content')

  // 为每个标记添加内容和事件
  for (const marker of markers) {
    const id = marker.getAttribute('data-id')
    const type = marker.getAttribute('data-type')

    const contentTypeKey = getContentType(type)

    if (!id || !type) continue

    // 添加图标和名称元素
    const icon = document.createElement('i')
    icon.className = `${contentType[contentTypeKey].icon} ${contentType[contentTypeKey].color} content-marker-icon`

    const name = document.createElement('span')
    name.className = 'content-marker-name'

    // 处理不同类型的内容
    let content

    if (['image', 'video', 'file'].includes(contentTypeKey)) {
      // 文件类型需要从 IndexedDB 获取
      content = await initFileContent(id)

      if (!content) continue

      name.textContent = content.name
    } else {
      // 表格和代码类型直接使用现有内容
      content = props.note.contents.find((item) => item.id === id)
      if (!content) continue

      name.textContent = content.name
    }

    marker.appendChild(icon)
    marker.appendChild(name)

    // 将文件内容添加到笔记内容中
    const existingIndex = noteContents.value.findIndex((item) => item.id === id)
    if (existingIndex === -1) {
      noteContents.value.push(content)
    } else {
      noteContents.value[existingIndex] = content
    }

    // 添加点击事件
    if (!props.hideContents) {
      marker.addEventListener('click', (e) => {
        e.stopPropagation()
        const index = findContentIndex(noteContents.value, id)
        if (index > -1) {
          contentsRef.value.setCurrentIndex(index)
        }
      })
    }
  }
}

watch(
  () => props.note.content,
  async () => {
    await nextTick()
    initContentMark()
  },
  { immediate: true },
)

// 组件卸载时清理URL对象
onUnmounted(() => {
  noteContents.value.forEach((content) => {
    if (content.url) {
      URL.revokeObjectURL(content.url)
    }
  })
})
</script>

<template>
  <div :class="['border-gray-200', customStyle]">
    <div class="mb-2 flex items-center justify-between text-gray-400">
      <div class="text-xs">
        {{ formatDate(note.createAt) }}
      </div>
      <TransitionGroup
        name="list"
        tag="div"
        :class="[
          'flex items-center gap-2 rounded-sm transition-all',
          { 'bg-gray-100 px-1': deleting },
        ]"
      >
        <button
          v-if="!hideContents && route.name === 'note'"
          class="ri-delete-bin-line btn-icon text-sm transition-all duration-300"
          :class="{ 'text-red-400': deleting }"
          @click="handleDelete"
        ></button>
        <button
          v-if="deleting"
          class="ri-close-line btn-icon text-sm"
          @click="deleting = false"
        ></button>
      </TransitionGroup>
      <button
        v-if="route.name !== 'note'"
        class="ri-arrow-right-s-line btn-icon"
        @click="goToNote"
      ></button>
    </div>

    <h2 v-if="note.title && !hideContents" class="mb-2 font-semibold">
      {{ note.title }}
    </h2>

    <div ref="contentRef" class="leading-7" v-html="note.content"></div>

    <div v-if="noteContents.length && !hideContents" class="mt-4">
      <Contents ref="contentsRef" :contents="noteContents" readonly />
    </div>
  </div>
</template>
