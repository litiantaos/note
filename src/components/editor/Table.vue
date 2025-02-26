<script setup>
import { ref, onMounted, watch } from 'vue'

const data = defineModel()
const props = defineProps({
  readonly: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['content-change'])

// 处理表格输入
const handleTableInput = (rowIndex, colIndex, event) => {
  event.target.innerHTML.trim() === '<br>' && (event.target.innerHTML = '')

  data.value[rowIndex][colIndex] = event.target.innerHTML
}

// 行列数
const rowCount = ref(3)
const colCount = ref(3)

// 初始化或调整表格数据
const adjustTableSize = () => {
  if (!data.value) {
    data.value = Array(rowCount.value)
      .fill()
      .map(() => Array(colCount.value).fill(''))
    return
  }

  const newData = [...data.value]

  // 调整行数
  if (newData.length < rowCount.value) {
    // 添加新行
    while (newData.length < rowCount.value) {
      newData.push(Array(colCount.value).fill(''))
    }
  } else if (newData.length > rowCount.value) {
    // 删除多余行
    newData.splice(rowCount.value)
  }

  // 调整列数
  newData.forEach((row) => {
    if (row.length < colCount.value) {
      // 添加新列
      while (row.length < colCount.value) {
        row.push('')
      }
    } else if (row.length > colCount.value) {
      // 删除多余列
      row.splice(colCount.value)
    }
  })

  data.value = newData

  emit('content-change')
}

// 监听行列数变化
watch(
  [rowCount, colCount],
  () => {
    adjustTableSize()
  },
  { immediate: false },
)

onMounted(() => {
  adjustTableSize()
})
</script>

<template>
  <div>
    <div v-if="!readonly" class="mb-4 flex items-center gap-2">
      <input
        type="number"
        v-model="rowCount"
        class="h-8 w-20 rounded-sm border border-gray-200 px-2"
      />
      <span>×</span>
      <input
        type="number"
        v-model="colCount"
        class="h-8 w-20 rounded-sm border border-gray-200 px-2"
      />
    </div>

    <table class="w-full table-fixed">
      <tbody>
        <tr
          v-for="(row, rowIndex) in data"
          :key="rowIndex"
          class="border-gray-200 not-last:border-b first:border-b-2 first:font-semibold"
        >
          <td
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            :contenteditable="!readonly"
            placeholder="-"
            class="relative py-2 pr-2 empty:before:pointer-events-none empty:before:absolute empty:before:text-gray-400 empty:before:content-[attr(placeholder)]"
            @input="handleTableInput(rowIndex, colIndex, $event)"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
