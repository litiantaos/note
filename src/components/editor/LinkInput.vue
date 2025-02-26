<script setup>
import { ref, onMounted } from 'vue'
import { isValidUrl } from '../../utils'

const emit = defineEmits(['close', 'confirm'])

const inputRef = ref(null)
const input = ref('')
const error = ref('')

const handleLink = () => {
  error.value = ''

  if (!input.value) return

  if (isValidUrl(input.value)) {
    emit('confirm', input.value)
    emit('close')

    input.value = ''
  } else {
    error.value = '链接不合法'
  }
}

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
})
</script>

<template>
  <div class="flex items-center gap-4">
    <input
      ref="inputRef"
      v-model="input"
      type="text"
      placeholder="输入网页链接"
      class="w-full"
      @keyup.enter="handleLink"
    />
    <button class="ri-check-line btn-icon" @click="handleLink"></button>
  </div>

  <div v-if="error" class="mt-2 flex items-center gap-1 text-xs text-red-400">
    <span class="ri-information-line text-base"></span>
    <span>{{ error }}</span>
  </div>
</template>
