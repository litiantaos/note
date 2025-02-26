<script setup>
import { ref } from 'vue'
import { contentType } from '../../utils/note'
import modal from '../../utils/modal'
import NoteSelector from './NoteSelector.vue'
import LinkInput from './LinkInput.vue'

const emit = defineEmits(['contents-change'])

// 链接
const openLinkInput = () => {
  modal.open({
    title: ' ',
    component: LinkInput,
    events: {
      confirm: (data) => {
        emit('contents-change', [
          {
            name: '链接',
            type: 'link',
            data,
          },
        ])
      },
    },
  })
}

// 笔记
const openNoteSelector = () => {
  modal.open({
    title: ' ',
    component: NoteSelector,
    events: {
      confirm: (data) => {
        emit('contents-change', [
          {
            name: '笔记',
            type: 'note',
            data,
          },
        ])
      },
    },
  })
}

// 代码
const handleCode = () => {
  emit('contents-change', [
    {
      name: '代码',
      type: 'code',
      data: '',
    },
  ])
}

// 表格
const handleTable = () => {
  emit('contents-change', [
    {
      name: '表格',
      type: 'table',
      data: [],
    },
  ])
}

// 文件
const fileInput = ref(null)

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = (event) => {
  // console.log(files.value)

  emit('contents-change', event.target.files)

  event.target.value = ''
}
</script>

<template>
  <div class="flex items-center gap-4">
    <button
      class="btn-icon"
      :class="contentType.image.icon"
      @click="triggerFileInput"
    >
      <input
        type="file"
        ref="fileInput"
        multiple
        @change="handleFileChange"
        class="hidden"
      />
    </button>
    <button
      class="btn-icon"
      :class="contentType.table.icon"
      @click="handleTable"
    ></button>
    <button
      class="btn-icon"
      :class="contentType.code.icon"
      @click="handleCode"
    ></button>
    <button
      class="btn-icon"
      :class="contentType.note.icon"
      @click="openNoteSelector"
    ></button>
    <button
      class="btn-icon"
      :class="contentType.link.icon"
      @click="openLinkInput"
    ></button>
  </div>

  <!-- <Modal v-model="openNoteSelector">
    <NoteSelector @close="openNoteSelector = false" @confirm="handleNote" />
  </Modal>

  <Modal v-model="openLinkInput">
    <LinkInput @close="openLinkInput = false" @confirm="handleLink" />
  </Modal> -->
</template>
