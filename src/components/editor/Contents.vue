<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import Table from './Table.vue'
import Note from '../note/Note.vue'
import LinkPreview from './LinkPreview.vue'
import { formatFileSize } from '../../utils'
import { contentType, getContentType } from '../../utils/note'

const props = defineProps({
  contents: Array,
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['remove-content', 'name-change'])

const currentIndex = ref(0)
const contentCount = computed(() => props.contents.length)

// 名称更改与标记同步
const handleNameInput = () => {
  emit(
    'name-change',
    props.contents[currentIndex.value].id,
    props.contents[currentIndex.value].name,
  )
}

// 删除内容
const removeContent = () => {
  const currentContent = props.contents[currentIndex.value]
  emit('remove-content', currentContent.id)
}

// 获取当前内容的高度
const itemRefs = ref([])
const height = ref(0)

const setItemRef = (el, index) => {
  if (el) {
    itemRefs.value[index] = el
  }
}

// 跟踪图片加载状态
const loadingImages = ref(new Set())

const handleImageLoad = (content) => {
  return new Promise((resolve) => {
    if (!getContentType(content.type)) {
      resolve()
      return
    }

    const img = new Image()
    img.src = content.url
    loadingImages.value.add(content.id)

    img.onload = () => {
      loadingImages.value.delete(content.id)
      resolve()
    }

    img.onerror = () => {
      loadingImages.value.delete(content.id)
      resolve()
    }
  })
}

// 跟踪视频加载状态
const loadingVideos = ref(new Set())

// 处理视频加载
const handleVideoLoad = (content) => {
  return new Promise((resolve) => {
    if (!getContentType(content.type)) {
      resolve()
      return
    }

    const video = document.createElement('video')
    video.src = content.url
    loadingVideos.value.add(content.id)

    // 监听元数据加载完成事件，此时可以获取视频尺寸
    video.onloadedmetadata = () => {
      loadingVideos.value.delete(content.id)
      resolve()
    }

    video.onerror = () => {
      loadingVideos.value.delete(content.id)
      resolve()
    }
  })
}

// 修改获取内容高度的逻辑
const getHeight = async () => {
  const currentContent = props.contents[currentIndex.value]

  if (currentContent) {
    // 同时等待图片和视频加载完成
    await Promise.all([
      handleImageLoad(currentContent),
      handleVideoLoad(currentContent),
    ])
  }

  await nextTick()

  const currentElement = itemRefs.value[currentIndex.value]
  if (!currentElement) return

  const contentElement = currentElement.children[0]
  if (contentElement) {
    height.value = contentElement.offsetHeight
  }
}

watch(
  () => props.contents,
  () => {
    getHeight()

    currentIndex.value = contentCount.value - 1
  },
)

watch(
  () => currentIndex.value,
  () => {
    getHeight()
  },
)

onMounted(() => {
  getHeight()
})

// 视频引用
const videoRefs = ref([])

const setVideoRef = (el, index) => {
  if (el) {
    videoRefs.value[index] = el
  }
}

// 暂停当前视频
const pauseCurrentVideo = () => {
  const currentVideo = videoRefs.value[currentIndex.value]
  if (currentVideo && !currentVideo.paused) {
    currentVideo.pause()
  }
}

// 导航
const next = () => {
  if (currentIndex.value < contentCount.value - 1) {
    pauseCurrentVideo()
    currentIndex.value++
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    pauseCurrentVideo()
    currentIndex.value--
  }
}

// 当组件卸载时暂停视频
onBeforeUnmount(() => {
  pauseCurrentVideo()
})

// 暴露 setCurrentIndex 方法供外部调用
defineExpose({
  setCurrentIndex: (index) => {
    currentIndex.value = index
  },
})

// 设置内容名称
const setContentName = (title) => {
  if (!title) return

  if (props.contents[currentIndex.value]) {
    props.contents[currentIndex.value].name = title
    handleNameInput()
  }
}

// 下载文件
const downloadFile = (url) => {
  // 创建并触发下载
  const link = document.createElement('a')
  link.href = url
  document.body.appendChild(link)
  link.click()

  // 清理
  document.body.removeChild(link)
  // URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="overflow-hidden rounded-sm border border-gray-200">
    <div
      class="flex items-center justify-between gap-4 border-b border-gray-200 p-2"
    >
      <i
        :class="[
          contentType[getContentType(contents[currentIndex].type)].icon,
          contentType[getContentType(contents[currentIndex].type)].color,
        ]"
      ></i>
      <input
        v-model="contents[currentIndex].name"
        placeholder="输入名称"
        :disabled="readonly"
        class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
        @input="handleNameInput"
      />

      <button
        class="ri-arrow-left-line btn-icon"
        @click="prev"
        :disabled="currentIndex === 0"
      ></button>
      <span>{{ currentIndex + 1 }}/{{ contentCount }}</span>
      <button
        class="ri-arrow-right-line btn-icon"
        @click="next"
        :disabled="currentIndex === contentCount - 1"
      ></button>
      <button
        v-if="!readonly"
        class="ri-close-line btn-icon text-gray-400"
        @click="removeContent"
      ></button>
    </div>

    <div
      class="transition-height relative w-full overflow-hidden duration-300"
      :style="{ height: `${height}px` }"
    >
      <div
        class="flex w-full transition-transform duration-300"
        :style="{
          transform: `translateX(-${currentIndex * 100}%)`,
        }"
      >
        <div
          v-for="(content, index) in contents"
          :key="content.id"
          :ref="(el) => setItemRef(el, index)"
          class="w-full flex-[0_0_100%]"
        >
          <!-- 图片 -->
          <img
            v-if="getContentType(content.type) === 'image'"
            :src="content.url"
            :alt="content.name"
            class="w-full"
          />

          <!-- 视频 -->
          <div
            v-else-if="getContentType(content.type) === 'video'"
            class="relative w-full"
            @touchstart="handleTouchstart"
            @touchend="handleTouchend"
            @touchcancel="handleTouchend"
          >
            <video
              :ref="(el) => setVideoRef(el, index)"
              :src="content.url"
              controls
              class="w-full"
            ></video>
          </div>

          <!-- 表格 -->
          <div
            v-else-if="getContentType(content.type) === 'table'"
            class="w-full p-2"
          >
            <Table
              v-model="content.data"
              @content-change="getHeight"
              :readonly="readonly"
            />
          </div>

          <!-- 代码 -->
          <div
            v-else-if="getContentType(content.type) === 'code'"
            class="w-full p-2"
          >
            <textarea
              v-model="content.data"
              placeholder="Hello World!"
              :readonly="readonly"
              class="min-h-60 w-full resize-none font-mono"
            ></textarea>
          </div>

          <!-- 笔记 -->
          <div
            v-else-if="getContentType(content.type) === 'note'"
            class="w-full"
          >
            <Note :note="content.data" hide-contents custom-style="px-2 py-4" />
          </div>

          <!-- 链接 -->
          <div
            v-else-if="getContentType(content.type) === 'link'"
            class="w-full"
          >
            <LinkPreview
              :url="content.data"
              @title-loaded="setContentName"
              @content-change="getHeight"
            />
          </div>

          <!-- 其他文件 -->
          <div v-else class="w-full p-2">
            <div
              class="flex h-20 items-center justify-center gap-4 rounded-sm border border-dashed border-gray-200 bg-gray-50"
            >
              <button
                class="ri-download-cloud-2-line btn-icon flex h-10 w-10 items-center justify-center rounded-sm bg-gray-200 text-lg"
                @click="downloadFile(content.url)"
              ></button>
              <div class="flex flex-col gap-[2px]">
                <div class="font-semibold">{{ content.name }}</div>
                <div class="text-xs text-gray-400">
                  {{ formatFileSize(content.size) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
