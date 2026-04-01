<template>
  <div>
    <!-- Period Selector -->
    <div class="d-flex flex-wrap gap-2 mb-4 align-items-center">
      <div class="btn-group btn-group-sm">
        <button v-for="p in periods" :key="p.value" class="btn" :class="activePeriod === p.value ? 'btn-primary' : 'btn-outline-primary'" @click="setPeriod(p.value)">
          {{ p.label }}
        </button>
      </div>
      <template v-if="activePeriod === 'custom'">
        <input v-model="dateFrom" type="date" class="form-control form-control-sm" style="width: 150px" />
        <span class="text-muted">s/d</span>
        <input v-model="dateTo" type="date" class="form-control form-control-sm" style="width: 150px" />
        <button class="btn btn-sm btn-primary" @click="loadReport">Tampilkan</button>
      </template>
      <span v-if="report" class="ms-auto fz-13 text-muted">
        {{ formatDateShort(report.period.start) }} - {{ formatDateShort(report.period.end) }}
      </span>
    </div>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div> Memuat laporan...
    </div>

    <template v-if="report && !loading">
      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-4 col-lg-3">
          <div class="stat-card">
            <div class="stat-value">{{ report.summary.total_orders }}</div>
            <div class="stat-label">Total Pesanan</div>
            <div class="fz-12 mt-1" :class="report.comparison.orders_change >= 0 ? 'text-success' : 'text-danger'">
              <i class="bi" :class="report.comparison.orders_change >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'"></i>
              {{ Math.abs(report.comparison.orders_change) }}% vs sebelumnya
            </div>
          </div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card">
            <div class="stat-value fz-16">{{ formatRupiah(report.summary.total_revenue) }}</div>
            <div class="stat-label">Total Pendapatan</div>
            <div class="fz-12 mt-1" :class="report.comparison.revenue_change >= 0 ? 'text-success' : 'text-danger'">
              <i class="bi" :class="report.comparison.revenue_change >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'"></i>
              {{ Math.abs(report.comparison.revenue_change) }}% vs sebelumnya
            </div>
          </div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card">
            <div class="stat-value fz-16">{{ formatRupiah(report.summary.avg_order_value) }}</div>
            <div class="stat-label">Rata-rata / Pesanan</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card">
            <div class="stat-value fz-16 text-danger">{{ formatRupiah(report.summary.total_hpp || 0) }}</div>
            <div class="stat-label">HPP (Harga Pokok)</div>
          </div>
        </div>
      </div>

      <!-- Profit Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card" style="background: #f0fdf4">
            <div class="stat-value fz-16 text-success">{{ formatRupiah(report.summary.gross_profit || 0) }}</div>
            <div class="stat-label">Laba Kotor</div>
            <div class="fz-12 mt-1 text-muted">Margin: {{ report.summary.gross_margin || 0 }}%</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value fz-16 text-info">{{ formatRupiah(report.summary.total_stock_cost) }}</div>
            <div class="stat-label">Biaya Stok Masuk</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value fz-16 text-warning">{{ formatRupiah(report.summary.total_expenses) }}</div>
            <div class="stat-label">Pengeluaran Operasional</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card" :style="report.summary.net_profit >= 0 ? 'background: #f0fdf4' : 'background: #fef2f2'">
            <div class="stat-value fz-16" :class="report.summary.net_profit >= 0 ? 'text-success' : 'text-danger'">
              {{ formatRupiah(report.summary.net_profit) }}
            </div>
            <div class="stat-label">Laba Bersih</div>
            <div class="fz-11 text-muted mt-1">Pendapatan - HPP - Stok - Pengeluaran</div>
          </div>
        </div>
      </div>

      <!-- HPP Breakdown -->
      <div v-if="report.hpp_breakdown?.length" class="order-card mb-4">
        <div class="card-title">Rincian HPP per Menu</div>
        <table class="table table-sm fz-13 mb-0">
          <thead>
            <tr>
              <th>Ukuran</th>
              <th class="text-end">Terjual</th>
              <th class="text-end">HPP / Item</th>
              <th class="text-end">Total HPP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in report.hpp_breakdown" :key="h.size">
              <td class="fw-600">{{ h.size }}</td>
              <td class="text-end">{{ h.count }}</td>
              <td class="text-end">{{ formatRupiah(h.hpp_per_item) }}</td>
              <td class="text-end fw-600 text-danger">{{ formatRupiah(h.total_hpp) }}</td>
            </tr>
            <tr class="fw-700" style="border-top: 2px solid #dee2e6">
              <td colspan="3">Total HPP</td>
              <td class="text-end text-danger">{{ formatRupiah(report.summary.total_hpp || 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Daily Sales Chart (Bar chart via CSS) -->
      <div class="order-card mb-4">
        <div class="card-title">Penjualan Harian</div>
        <div v-if="report.daily_sales.length === 0" class="text-center text-muted py-3">Belum ada data</div>
        <div v-else class="daily-chart-wrapper">
          <div class="daily-chart">
            <div v-for="day in report.daily_sales" :key="day.date" class="daily-bar-group">
              <div class="daily-bar-tooltip fz-12">
                {{ day.order_count }} pesanan<br>{{ formatRupiah(day.revenue) }}
              </div>
              <div class="daily-bar" :style="{ height: barHeight(day.revenue) + 'px' }"></div>
              <div class="daily-bar-label fz-11">{{ formatDayLabel(day.date) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Breakdown tables -->
      <div class="row g-3 mb-4">
        <!-- By Menu Size -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Penjualan per Menu / Ukuran</div>
            <table class="table table-sm fz-13 mb-0">
              <thead><tr><th>Ukuran</th><th class="text-end">Jumlah Terjual</th></tr></thead>
              <tbody>
                <tr v-for="sz in sortedSizes" :key="sz.size">
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="progress flex-grow-1" style="height: 6px">
                        <div class="progress-bar bg-primary" :style="{ width: sizePercent(sz.count) + '%' }"></div>
                      </div>
                      <span class="fw-600" style="min-width: 80px">{{ sz.size }}</span>
                    </div>
                  </td>
                  <td class="text-end fw-600">{{ sz.count }}</td>
                </tr>
                <tr v-if="report.orders_by_size.length === 0">
                  <td colspan="2" class="text-center text-muted">Belum ada data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- By Payment Method -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Penjualan per Metode Pembayaran</div>
            <table class="table table-sm fz-13 mb-0">
              <thead><tr><th>Metode</th><th class="text-end">Jumlah</th><th class="text-end">Total</th></tr></thead>
              <tbody>
                <tr v-for="pm in report.orders_by_payment" :key="pm.payment_method">
                  <td><span :class="'badge-payment badge-' + pm.payment_method?.toLowerCase()">{{ pm.payment_method }}</span></td>
                  <td class="text-end">{{ pm._count }}</td>
                  <td class="text-end fw-600">{{ formatRupiah(pm._sum?.total_price || 0) }}</td>
                </tr>
                <tr v-if="report.orders_by_payment.length === 0">
                  <td colspan="3" class="text-center text-muted">Belum ada data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <!-- Top Toppings -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Topping Terlaris</div>
            <table class="table table-sm fz-13 mb-0">
              <thead><tr><th>#</th><th>Topping</th><th class="text-end">Jumlah Terjual</th></tr></thead>
              <tbody>
                <tr v-for="(t, idx) in report.top_toppings" :key="t.topping_id">
                  <td>
                    <span v-if="idx < 3" class="badge rounded-pill" :class="idx === 0 ? 'bg-warning text-dark' : idx === 1 ? 'bg-secondary' : 'bg-bronze'">{{ idx + 1 }}</span>
                    <span v-else>{{ idx + 1 }}</span>
                  </td>
                  <td class="fw-600">{{ t.name }}</td>
                  <td class="text-end">{{ t.count }}</td>
                </tr>
                <tr v-if="report.top_toppings.length === 0">
                  <td colspan="3" class="text-center text-muted">Belum ada data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Bumbu -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Bumbu Terlaris</div>
            <table class="table table-sm fz-13 mb-0">
              <thead><tr><th>#</th><th>Bumbu</th><th class="text-end">Jumlah Terjual</th></tr></thead>
              <tbody>
                <tr v-for="(b, idx) in report.top_bumbu" :key="b.name">
                  <td>
                    <span v-if="idx < 3" class="badge rounded-pill" :class="idx === 0 ? 'bg-warning text-dark' : idx === 1 ? 'bg-secondary' : 'bg-bronze'">{{ idx + 1 }}</span>
                    <span v-else>{{ idx + 1 }}</span>
                  </td>
                  <td class="fw-600">{{ b.name }}</td>
                  <td class="text-end">{{ b.count }}</td>
                </tr>
                <tr v-if="report.top_bumbu.length === 0">
                  <td colspan="3" class="text-center text-muted">Belum ada data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { formatRupiah } from '~/utils/format'
import { useMainStore } from '~/stores'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()
const loading = ref(false)
const report = ref(null)
const activePeriod = ref('this_month')
const dateFrom = ref('')
const dateTo = ref('')

const periods = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'this_week', label: 'Minggu Ini' },
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'custom', label: 'Custom' },
]

const setPeriod = (val) => {
  activePeriod.value = val
  if (val !== 'custom') loadReport()
}

const loadReport = async () => {
  loading.value = true
  try {
    const params = { period: activePeriod.value }
    if (activePeriod.value === 'custom' && dateFrom.value && dateTo.value) {
      params.date_from = dateFrom.value
      params.date_to = dateTo.value
    }
    const res = await store.fetchReports(params)
    report.value = res.content
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const sortedSizes = computed(() => {
  if (!report.value) return []
  return [...report.value.orders_by_size].sort((a, b) => b.count - a.count)
})

const maxSizeCount = computed(() => {
  if (!sortedSizes.value.length) return 1
  return Math.max(...sortedSizes.value.map(s => s.count), 1)
})

const sizePercent = (count) => Math.round((count / maxSizeCount.value) * 100)

const maxDailyRevenue = computed(() => {
  if (!report.value?.daily_sales?.length) return 1
  return Math.max(...report.value.daily_sales.map(d => d.revenue), 1)
})

const barHeight = (revenue) => Math.max(Math.round((revenue / maxDailyRevenue.value) * 120), 4)

const formatDateShort = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDayLabel = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

onMounted(loadReport)
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}
.daily-chart-wrapper {
  overflow-x: auto;
  padding-bottom: 8px;
}
.daily-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  min-height: 160px;
  padding-top: 30px;
}
.daily-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 36px;
  position: relative;
}
.daily-bar {
  width: 28px;
  background: var(--primary, #4361ee);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}
.daily-bar-group:hover .daily-bar {
  background: var(--primary-dark, #3a56d4);
}
.daily-bar-label {
  margin-top: 4px;
  color: #6c757d;
  white-space: nowrap;
}
.daily-bar-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  margin-bottom: 4px;
  z-index: 10;
}
.daily-bar-group:hover .daily-bar-tooltip {
  display: block;
}
.bg-bronze {
  background-color: #cd7f32 !important;
  color: #fff;
}
</style>
