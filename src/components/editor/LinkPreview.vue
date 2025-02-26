<script setup>
import { ref, onMounted } from 'vue'
import { isValidUrl } from '../../utils'

const props = defineProps(['url'])
const emit = defineEmits(['title-loaded', 'content-change'])

const loading = ref(true)
const imageUrl = ref('')
const imageIsCover = ref(false)

const handleLoaded = () => {
  loading.value = false
  emit('content-change')
}

const getWebMeta = async (url) => {
  try {
    if (isValidUrl(url)) {
      const proxyUrl = `https://api.microlink.io/?url=${url}`
      const response = await fetch(proxyUrl)
      const { status, data } = await response.json()
      // console.log(data)

      if (status === 'success') {
        emit('title-loaded', data.title)

        const imgUrl = data.image.url

        imageIsCover.value = data.image.width > 540

        if (url.includes('bilibili.com/video/')) {
          imageUrl.value = imgUrl.replace(/\.jpg.*$/, '.jpg')
        } else {
          imageUrl.value = imgUrl
        }
      } else {
        console.log('获取网页信息失败')
      }
    } else {
      console.log('链接不合法')
    }
  } catch (err) {
    console.log('加载失败: ' + err.message)
  }
}

onMounted(() => {
  getWebMeta(props.url)
})
</script>

<template>
  <a :href="url" target="_blank" rel="noopener noreferrer">
    <div class="relative min-h-20 w-full">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt="Website preview"
        referrerpolicy="no-referrer"
        :class="['w-full', { 'h-24 object-cover': !imageIsCover }]"
        @load="handleLoaded"
      />
      <div
        class="absolute z-50 flex items-center justify-center gap-2 bg-white/60 px-4"
        :class="
          imageIsCover
            ? 'bottom-4 left-1/2 max-w-1/2 -translate-x-1/2 rounded-sm backdrop-blur-md'
            : 'top-0 right-0 bottom-0 left-0 backdrop-blur-2xl'
        "
      >
        <div
          v-if="loading"
          class="ri-loader-4-line flex-none animate-spin text-xl"
        ></div>
        <img
          v-if="!imageIsCover && !loading"
          :src="imageUrl"
          alt="Logo"
          class="h-4 flex-none"
        />
        <span class="overflow-hidden text-xs text-ellipsis whitespace-nowrap">
          {{ url }}
        </span>
        <span class="ri-arrow-right-s-line flex-none text-base"></span>
      </div>
    </div>
  </a>
</template>
