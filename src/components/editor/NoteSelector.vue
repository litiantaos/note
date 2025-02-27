<script setup>
import { ref, onMounted } from 'vue'
import Note from '../note/Note.vue'
import { throttle } from '../../utils'
import { searchNotes } from '../../utils/db'

const emit = defineEmits(['close', 'confirm'])

const inputRef = ref(null)
const input = ref('')
const results = ref([])

const handleNote = (data) => {
  emit('confirm', data)
  emit('close')
}

const handleSearch = throttle(async () => {
  try {
    results.value = await searchNotes(input.value)
    console.log(results.value)
  } catch (error) {
    console.error('Search failed:', error)
    results.value = []
  }
}, 1000)

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
})
</script>

<template>
  <input
    ref="inputRef"
    v-model="input"
    type="text"
    placeholder="搜索笔记"
    class="w-full"
    @keyup.enter="handleSearch"
  />

  <div v-if="results.length" class="mt-4">
    <ul class="overflow-hidden rounded-sm border border-gray-200">
      <li
        v-for="note in results"
        :key="note.id"
        class="cursor-pointer sm:hover:bg-gray-50"
        @click="handleNote(note)"
      >
        <Note :note="note" hide-contents />
      </li>
    </ul>
  </div>
</template>
