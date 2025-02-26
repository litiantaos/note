<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Note from '../components/note/Note.vue'
import { getNote } from '../utils/db'

const route = useRoute()

const note = ref({})

onMounted(async () => {
  note.value = await getNote(route.params.id)
})
</script>

<template>
  <div>
    <Note :note="note" />
  </div>
</template>
