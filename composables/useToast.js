import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export const useToast = () => {
  const show = (message, type = 'success', duration = 3000) => {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return {
    toasts,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'danger', 5000),
    warning: (msg) => show(msg, 'warning', 4000),
    info: (msg) => show(msg, 'info'),
  }
}
