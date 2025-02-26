<script setup>
import { ref, onMounted } from 'vue'
import Note from './Note.vue'
import { getAllNotes } from '../../utils/db'

const notes = ref([])

const loadNotes = async () => {
  try {
    notes.value = await getAllNotes()
  } catch (error) {
    console.error('Failed to load notes:', error)
  }
}

// 删除笔记后重新加载
const handleNoteDelete = async () => {
  await loadNotes()
}

onMounted(() => {
  loadNotes()
})
</script>

<template>
  <div class="">
    <div v-for="note in notes" :key="note.id">
      <Note :note="note" @delete="handleNoteDelete" />
    </div>
    <div v-if="!notes.length" class="text-center text-gray-400">暂无笔记</div>
  </div>
</template>
