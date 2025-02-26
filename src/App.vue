<script setup>
import { RouterView } from 'vue-router'
import Layout from './components/Layout.vue'
import Modal from './components/base/Modal.vue'
</script>

<template>
  <Layout>
    <RouterView v-slot="{ Component }">
      <Transition name="move-up" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </Layout>

  <Modal />
</template>
