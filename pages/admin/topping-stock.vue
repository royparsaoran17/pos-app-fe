<template>
  <div>
    <!-- Date filter -->
    <div class="order-card mb-3">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label fz-13 fw-600">Tanggal</label>
          <input v-model="date" type="date" class="form-control fz-13" @change="loadData" />
        </div>
        <div class="col-md-3">
          <button class="btn btn-outline-primary btn-sm" @click="date = todayJakarta(); loadData()">
            <i class="bi bi-calendar-event me-1"></i> Hari Ini
          </button>
        </div>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary bg-opacity-10 rounded-3 p-3">
              <i class="bi bi-speedometer2 text-primary fz-20"></i>
            </div>
            <div>
              <div class="stat-value">{{ formatGram(data.summary?.total_gram_used_today || 0) }}</div>
              <div class="stat-label">Total Pemakaian Hari Ini</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-success bg-opacity-10 rounded-3 p-3">
              <i class="bi bi-receipt text-success fz-20"></i>
            </div>
            <div>
              <div class="stat-value">{{ data.summary?.total_order_count_today || 0 }}</div>
              <div class="stat-label">Porsi Topping Terjual</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-warning bg-opacity-10 rounded-3 p-3">
              <i class="bi bi-exclamation-triangle text-warning fz-20"></i>
            </div>
            <div>
              <div class="stat-value">{{ lowStockCount }}</div>
              <div class="stat-label">Topping Stok Rendah (&lt;500g)</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="order-card">
      <div class="card-title">Detail per Topping</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Topping</th>
            <th class="text-end">Gram/Porsi</th>
            <th class="text-end">Pemakaian Hari Ini</th>
            <th class="text-end">Porsi Terjual</th>
            <th class="text-end">Total Stok Masuk</th>
            <th class="text-end">Total Terpakai</th>
            <th class="text-end">Sisa Stok</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="text-center py-4 text-muted">Memuat data...</td>
          </tr>
          <tr v-else-if="!data.toppings?.length">
            <td colspan="8" class="text-center py-4 text-muted">Tidak ada data topping</td>
          </tr>
          <tr v-for="t in data.toppings" :key="t.topping_id">
            <td class="fw-600">{{ t.name }}</td>
            <td class="text-end fz-13">{{ t.gram_per_portion }}g</td>
            <td class="text-end fw-600 text-primary">{{ formatGram(t.today_gram_used) }}</td>
            <td class="text-end fz-13">{{ t.today_order_count }}x</td>
            <td class="text-end fz-13">{{ t.total_stock_in_kg }}kg</td>
            <td class="text-end fz-13">{{ formatGram(t.total_used_gram) }}</td>
            <td class="text-end fw-600" :class="stockClass(t.current_stock_gram)">
              {{ formatGram(t.current_stock_gram) }}
              <span class="fz-11">({{ t.current_stock_kg }}kg)</span>
            </td>
            <td>
              <span v-if="t.current_stock_gram <= 0" class="badge bg-danger">Habis</span>
              <span v-else-if="t.current_stock_gram < 500" class="badge bg-warning">Rendah</span>
              <span v-else class="badge bg-success">OK</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { todayJakarta } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()
const loading = ref(false)
const date = ref(todayJakarta())
const data = ref({ toppings: [], summary: {} })

const lowStockCount = computed(() =>
  (data.value.toppings || []).filter(t => t.current_stock_gram < 500).length
)

const formatGram = (g) => {
  if (g >= 1000) return (Math.round(g / 100) / 10) + 'kg'
  return Math.round(g) + 'g'
}

const stockClass = (gram) => {
  if (gram <= 0) return 'text-danger'
  if (gram < 500) return 'text-warning'
  return 'text-success'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await store.fetchToppingStock({ date: date.value })
    data.value = res.content
  } catch (err) {
    console.error('Failed to load topping stock:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
</script>
