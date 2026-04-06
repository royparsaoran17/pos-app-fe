<template>
  <div>
    <!-- Date filter -->
    <div class="order-card mb-3">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label fz-13 fw-600">Dari Tanggal</label>
          <input v-model="dateFrom" type="date" class="form-control fz-13" />
        </div>
        <div class="col-md-3">
          <label class="form-label fz-13 fw-600">Sampai Tanggal</label>
          <input v-model="dateTo" type="date" class="form-control fz-13" />
        </div>
        <div class="col-md-3 d-flex gap-2">
          <button class="btn btn-primary btn-sm" @click="loadData">
            <i class="bi bi-bar-chart me-1"></i> Analisis
          </button>
          <button class="btn btn-outline-secondary btn-sm" @click="setPreset('all')">Semua</button>
          <button class="btn btn-outline-secondary btn-sm" @click="setPreset('month')">Bulan Ini</button>
          <button class="btn btn-outline-secondary btn-sm" @click="setPreset('week')">Minggu Ini</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div> Memuat data analytics...
    </div>

    <template v-if="data && !loading">
      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">{{ data.summary.total_orders.toLocaleString() }}</div>
            <div class="stat-label">Total Pesanan</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">{{ formatRupiah(data.summary.total_revenue) }}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">{{ formatRupiah(data.summary.avg_order_value) }}</div>
            <div class="stat-label">Rata-rata per Order</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">{{ Number(data.summary.operating_days).toLocaleString() }} hari</div>
            <div class="stat-label">Hari Operasional</div>
          </div>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div v-if="data.low_stock_alerts.length > 0" class="alert alert-danger mb-4 fz-13">
        <div class="fw-700 mb-2"><i class="bi bi-exclamation-triangle-fill me-1"></i> Peringatan Stok Rendah ({{ data.low_stock_alerts.length }} topping)</div>
        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="item in data.low_stock_alerts"
            :key="item.id"
            class="badge"
            :class="item.current_stock_gram <= 0 ? 'bg-danger' : 'bg-warning text-dark'"
          >
            {{ item.name }}: {{ item.current_stock_gram <= 0 ? 'HABIS' : Math.round(item.current_stock_gram) + 'g' }}
          </span>
        </div>
      </div>

      <div class="row g-3">
        <!-- Monthly Trend -->
        <div class="col-md-8">
          <div class="order-card h-100">
            <div class="card-title">Trend Bulanan</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th class="text-end">Orders</th>
                  <th class="text-end">Revenue</th>
                  <th class="text-end">Avg/Order</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in data.monthly_trend" :key="m.month">
                  <td class="fw-600">{{ m.month }}</td>
                  <td class="text-end">{{ m.order_count.toLocaleString() }}</td>
                  <td class="text-end fw-600">{{ formatRupiah(m.revenue) }}</td>
                  <td class="text-end fz-12">{{ formatRupiah(m.avg_order_value) }}</td>
                  <td>
                    <template v-if="i > 0">
                      <span :class="monthGrowth(i) >= 0 ? 'text-success' : 'text-danger'" class="fz-12 fw-600">
                        {{ monthGrowth(i) >= 0 ? '+' : '' }}{{ monthGrowth(i) }}%
                      </span>
                    </template>
                    <span v-else class="fz-12 text-muted">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Customer Stats -->
        <div class="col-md-4">
          <div class="order-card h-100">
            <div class="card-title">Pelanggan</div>
            <div class="mb-3">
              <div class="d-flex justify-content-between fz-13 mb-1">
                <span>Total Pelanggan</span>
                <span class="fw-700">{{ data.customer_stats.total_customers }}</span>
              </div>
              <div class="d-flex justify-content-between fz-13 mb-1">
                <span>Repeat Customer</span>
                <span class="fw-700 text-success">{{ data.customer_stats.repeat_customers }}</span>
              </div>
              <div class="d-flex justify-content-between fz-13 mb-2">
                <span>Repeat Rate</span>
                <span class="fw-700 text-primary">{{ data.customer_stats.repeat_rate }}%</span>
              </div>
              <div class="progress" style="height: 8px">
                <div class="progress-bar bg-success" :style="{ width: data.customer_stats.repeat_rate + '%' }"></div>
              </div>
            </div>
            <div class="card-title fz-12 mt-3">Top Loyal Customers</div>
            <div v-for="c in data.top_repeat_customers.slice(0, 8)" :key="c.name" class="d-flex justify-content-between fz-12 mb-1">
              <span>{{ c.name }}</span>
              <span class="fw-600">{{ c.order_count }}x ({{ formatRupiah(c.total_spent) }})</span>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mt-1">
        <!-- Peak Hours -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Jam Ramai (Peak Hours)</div>
            <div v-for="h in data.peak_hours" :key="h.hour" class="d-flex align-items-center gap-2 mb-1">
              <span class="fz-12 fw-600" style="min-width: 40px">{{ String(h.hour).padStart(2, '0') }}:00</span>
              <div class="flex-grow-1">
                <div class="progress" style="height: 18px">
                  <div
                    class="progress-bar"
                    :class="h.order_count === maxHourOrders ? 'bg-danger' : 'bg-primary'"
                    :style="{ width: (h.order_count / maxHourOrders * 100) + '%' }"
                  >
                    <span class="fz-11 fw-600">{{ h.order_count }}</span>
                  </div>
                </div>
              </div>
              <span class="fz-11 text-muted" style="min-width: 70px; text-align: right">{{ formatRupiah(h.revenue) }}</span>
            </div>
          </div>
        </div>

        <!-- Day of Week -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Performa per Hari</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Hari</th>
                  <th class="text-end">Avg Orders</th>
                  <th class="text-end">Avg Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in data.day_of_week" :key="d.day_name">
                  <td class="fw-600">{{ d.day_name }}</td>
                  <td class="text-end">{{ d.avg_orders_per_day }}/hari</td>
                  <td class="text-end fw-600">{{ formatRupiah(d.avg_revenue_per_day) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="row g-3 mt-1">
        <!-- Acquisition Channels -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Sumber Pelanggan (Tau Dari Mana?)</div>
            <div v-for="ch in data.acquisition_channels" :key="ch.channel" class="mb-2">
              <div class="d-flex justify-content-between fz-13 mb-1">
                <span class="fw-600">{{ ch.channel }}</span>
                <span>{{ ch.order_count }} orders ({{ formatRupiah(ch.revenue) }})</span>
              </div>
              <div class="progress" style="height: 6px">
                <div class="progress-bar bg-primary" :style="{ width: (ch.order_count / maxChannelOrders * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Mix -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Product Mix</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ukuran</th>
                  <th class="text-end">Qty</th>
                  <th class="text-end">%</th>
                  <th class="text-end">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in sortedProductMix" :key="p.size">
                  <td class="fw-600">{{ p.size }}</td>
                  <td class="text-end">{{ p.count.toLocaleString() }}</td>
                  <td class="text-end fz-12">{{ productPct(p.count) }}%</td>
                  <td class="text-end fw-600">{{ formatRupiah(p.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="row g-3 mt-1">
        <!-- Top Toppings -->
        <div class="col-md-4">
          <div class="order-card h-100">
            <div class="card-title">Top 15 Topping</div>
            <div v-for="(t, i) in data.top_toppings" :key="t.name" class="d-flex justify-content-between fz-13 mb-1">
              <span>
                <span class="badge bg-light text-dark fz-11 me-1">{{ i + 1 }}</span>
                {{ t.name }}
              </span>
              <span class="fw-600">{{ t.count }}x <span class="text-muted fz-11">({{ formatGram(t.total_gram) }})</span></span>
            </div>
          </div>
        </div>

        <!-- Top Bumbu -->
        <div class="col-md-4">
          <div class="order-card h-100">
            <div class="card-title">Top Bumbu</div>
            <div v-for="(b, i) in data.top_bumbu" :key="b.name" class="d-flex justify-content-between fz-13 mb-1">
              <span>
                <span class="badge bg-light text-dark fz-11 me-1">{{ i + 1 }}</span>
                {{ b.name }}
              </span>
              <span class="fw-600">{{ b.count }}x</span>
            </div>
          </div>
        </div>

        <!-- Spicy Distribution -->
        <div class="col-md-4">
          <div class="order-card h-100">
            <div class="card-title">Distribusi Level Pedas</div>
            <div v-for="s in sortedSpicy" :key="s.level" class="mb-2">
              <div class="d-flex justify-content-between fz-13 mb-1">
                <span class="fw-600">
                  Level {{ s.level }}
                  <span v-for="n in Math.min(Math.ceil(s.level), 5)" :key="n" class="fz-11">🌶️</span>
                </span>
                <span>{{ s.count }}x ({{ spicyPct(s.count) }}%)</span>
              </div>
              <div class="progress" style="height: 6px">
                <div
                  class="progress-bar"
                  :class="s.level >= 4 ? 'bg-danger' : s.level >= 2 ? 'bg-warning' : 'bg-success'"
                  :style="{ width: (s.count / maxSpicyCount * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah, todayJakarta } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()
const loading = ref(false)
const data = ref(null)

// Default: all time (from Nov 2025)
const dateFrom = ref('2025-11-01')
const dateTo = ref(todayJakarta())

const setPreset = (preset) => {
  const now = new Date()
  dateTo.value = todayJakarta()
  if (preset === 'all') {
    dateFrom.value = '2025-11-01'
  } else if (preset === 'month') {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    dateFrom.value = `${y}-${m}-01`
  } else if (preset === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    dateFrom.value = d.toISOString().slice(0, 10)
  }
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await store.fetchAnalytics({ date_from: dateFrom.value, date_to: dateTo.value })
    data.value = res.content
  } catch (err) {
    console.error('Failed to load analytics:', err)
  } finally {
    loading.value = false
  }
}

const formatGram = (g) => {
  if (!g) return '0g'
  if (g >= 1000) return (Math.round(g / 100) / 10) + 'kg'
  return Math.round(g) + 'g'
}

// Computed helpers
const maxHourOrders = computed(() => {
  if (!data.value?.peak_hours?.length) return 1
  return Math.max(...data.value.peak_hours.map(h => h.order_count))
})

const maxChannelOrders = computed(() => {
  if (!data.value?.acquisition_channels?.length) return 1
  return data.value.acquisition_channels[0]?.order_count || 1
})

const sortedProductMix = computed(() => {
  if (!data.value?.product_mix) return []
  return [...data.value.product_mix].sort((a, b) => b.count - a.count)
})

const totalProductCount = computed(() => {
  return (data.value?.product_mix || []).reduce((s, p) => s + p.count, 0)
})

const productPct = (count) => {
  return totalProductCount.value > 0 ? Math.round(count / totalProductCount.value * 1000) / 10 : 0
}

const sortedSpicy = computed(() => {
  if (!data.value?.spicy_distribution) return []
  return [...data.value.spicy_distribution].sort((a, b) => a.level - b.level)
})

const maxSpicyCount = computed(() => {
  if (!data.value?.spicy_distribution?.length) return 1
  return Math.max(...data.value.spicy_distribution.map(s => s.count))
})

const totalSpicyCount = computed(() => {
  return (data.value?.spicy_distribution || []).reduce((s, x) => s + x.count, 0)
})

const spicyPct = (count) => {
  return totalSpicyCount.value > 0 ? Math.round(count / totalSpicyCount.value * 1000) / 10 : 0
}

const monthGrowth = (i) => {
  if (!data.value?.monthly_trend || i === 0) return 0
  const prev = data.value.monthly_trend[i - 1].revenue
  const curr = data.value.monthly_trend[i].revenue
  return prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0
}

onMounted(() => loadData())
</script>
