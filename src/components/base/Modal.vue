<script setup>
import { onMounted, onUnmounted } from 'vue'
import modal from '../../utils/modal'
import Layout from '../Layout.vue'

const { state, close, handleComponentEvent } = modal

const handleEsc = (event) => {
  if (event.key === 'Escape' || event.keyCode === 27) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="move-up">
      <div v-if="state.visible" class="fixed inset-0 z-[100] bg-white">
        <Layout :title="state.title">
          <div class="p-4">
            <button
              class="ri-arrow-left-s-line btn-icon -ml-1.5"
              @click="close"
            ></button>

            <div class="mt-2">
              <component
                :is="state.component"
                v-bind="state.componentProps"
                @close="close"
                @confirm="handleComponentEvent('confirm', $event)"
              ></component>
            </div>
          </div>
        </Layout>
      </div>
    </Transition>
  </Teleport>
</template>
