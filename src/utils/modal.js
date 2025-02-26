import { shallowRef, markRaw } from 'vue'

const state = shallowRef({
  visible: false,
  title: '',
  component: null,
  componentProps: {},
  events: {},
})

const useModal = (() => {
  // 核心方法定义
  const core = {
    open: ({ title, component, props = {}, events = {} } = {}) => {
      state.value = {
        visible: true,
        title,
        component: component ? markRaw(component) : null,
        componentProps: props,
        events,
      }
    },

    close: () => {
      state.value.visible = false

      requestAnimationFrame(() => {
        if (!state.value.visible) {
          state.value = {
            visible: false,
            title: '',
            component: null,
            componentProps: {},
            events: {},
          }
        }
      })
    },

    handleComponentEvent: (eventName, data) => {
      const handler = state.value.events[eventName]
      handler?.(data)
    },

    getState: () => state.value,
  }

  // 返回包含state的对象，作为单例和工厂函数的统一结果
  const modalApi = {
    state,
    open: core.open,
    close: core.close,
    handleComponentEvent: core.handleComponentEvent,
    getState: core.getState,
  }

  return () => modalApi
})()

const modal = useModal()

export default modal
