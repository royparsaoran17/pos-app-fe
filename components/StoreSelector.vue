<template>
  <div class="store-selector">
    <select class="form-select form-select-sm" v-model="selectedStoreId" @change="onStoreChange">
      <option :value="null">Semua Toko</option>
      <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
    </select>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'

const store = useMainStore()

const stores = computed(() => {
  // Try from pinia first, then localStorage
  if (store.stores.length) return store.stores
  const saved = localStorage.getItem('pos_stores')
  if (saved) {
    const parsed = JSON.parse(saved)
    store.setStores(parsed)
    return parsed
  }
  return []
})

const selectedStoreId = ref(store.currentStoreId)

const onStoreChange = () => {
  if (selectedStoreId.value) {
    const selected = stores.value.find(s => s.id === Number(selectedStoreId.value))
    store.setCurrentStore(selected || null)
  } else {
    store.setCurrentStore(null)
  }
}

onMounted(async () => {
  if (!stores.value.length) {
    try {
      const res = await store.adminFetchActiveStores()
      store.setStores(res.content)
      localStorage.setItem('pos_stores', JSON.stringify(res.content))
    } catch {}
  }
})
</script>

<style scoped>
.store-selector select {
  min-width: 180px;
  font-size: 13px;
}
</style>
