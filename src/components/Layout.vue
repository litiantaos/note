<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const props = defineProps(['title'])

const goToHome = () => {
  if (props.title) return

  const isAtTop = window.scrollY === 0

  if (isAtTop) {
    router.push('/')
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <header class="flex h-15 items-center justify-between px-4">
      <h1 class="cursor-pointer text-xl font-bold" @click="goToHome">
        {{ title || 'Note' }}
      </h1>

      <button
        v-if="route.path === '/'"
        class="ri-add-line btn-icon"
        @click="router.push('/edit')"
      ></button>
    </header>

    <main
      class="border-t border-gray-200 bg-white sm:mb-4 sm:rounded-md sm:border-x sm:border-b"
    >
      <slot></slot>
    </main>
  </div>
</template>
