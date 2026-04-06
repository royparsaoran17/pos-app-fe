<template>
  <div>
    <!-- Stats Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary bg-opacity-10 rounded-3 p-3">
              <i class="bi bi-receipt text-primary fz-20"></i>
            </div>
            <div>
              <div class="stat-value">{{ stats.total_orders }}</div>
              <div class="stat-label">Total Pesanan</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-success bg-opacity-10 rounded-3 p-3">
              <i class="bi bi-cash-coin text-success fz-20"></i>
            </div>
            <div>
              <div class="stat-value">{{ formatRupiah(stats.total_revenue) }}</div>
              <div class="stat-label">Total Pendapatan</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-warning bg-opacity-10 rounded-3 p-3">
              <i class="bi bi-bag-check text-warning fz-20"></i>
            </div>
            <div>
              <div class="stat-value">{{ stats.today_orders }}</div>
              <div class="stat-label">Pesanan Hari Ini</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-info bg-opacity-10 rounded-3 p-3">
              <i class="bi bi-people text-info fz-20"></i>
            </div>
            <div>
              <div class="stat-value">{{ staffList.length }}</div>
              <div class="stat-label">Total Staff</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock Alert -->
    <div v-if="lowStockAlerts.length > 0" class="alert alert-danger mb-4 fz-13">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="fw-700"><i class="bi bi-exclamation-triangle-fill me-1"></i> Peringatan Stok Rendah ({{ lowStockAlerts.length }} topping)</span>
        <NuxtLink to="/admin/topping-stock" class="btn btn-sm btn-outline-danger fz-12">Lihat Detail</NuxtLink>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <span
          v-for="item in lowStockAlerts"
          :key="item.id"
          class="badge"
          :class="item.current_stock_gram <= 0 ? 'bg-danger' : 'bg-warning text-dark'"
        >
          {{ item.name }}: {{ item.current_stock_gram <= 0 ? 'HABIS' : Math.round(item.current_stock_gram) + 'g' }}
        </span>
      </div>
    </div>

    <!-- Pie Charts Row -->
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="order-card">
          <div class="card-title">Pesanan per Metode Pembayaran</div>
          <div class="row align-items-center">
            <div class="col-6">
              <PieChart :data="paymentChartData" :size="180" :format-value="(v) => v + ' pesanan'" />
            </div>
            <div class="col-6">
              <table class="table table-sm fz-13 mb-0">
                <thead>
                  <tr>
                    <th>Metode</th>
                    <th class="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pm in stats.orders_by_payment" :key="pm.payment_method">
                    <td>
                      <span :class="'badge-payment badge-' + pm.payment_method?.toLowerCase()">
                        {{ pm.payment_method }}
                      </span>
                    </td>
                    <td class="text-end fw-600">{{ formatRupiah(pm._sum?.total_price || 0) }}</td>
                  </tr>
                  <tr v-if="!stats.orders_by_payment?.length">
                    <td colspan="2" class="text-center text-muted">Belum ada data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="order-card">
          <div class="card-title">Pesanan per Ukuran Menu</div>
          <div class="row align-items-center">
            <div class="col-6">
              <PieChart :data="sizeChartData" :size="180" :format-value="(v) => v + ' item'" />
            </div>
            <div class="col-6">
              <table class="table table-sm fz-13 mb-0">
                <thead>
                  <tr>
                    <th>Ukuran</th>
                    <th class="text-end">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="sz in stats.orders_by_size" :key="sz.size">
                    <td>{{ getSizeLabel(sz.size) }}</td>
                    <td class="text-end fw-600">{{ sz._count }}</td>
                  </tr>
                  <tr v-if="!stats.orders_by_size?.length">
                    <td colspan="2" class="text-center text-muted">Belum ada data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff Performance Pie Chart -->
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="order-card">
          <div class="card-title">Kontribusi Pesanan per Staff</div>
          <PieChart :data="staffChartData" :size="200" :format-value="(v) => v + ' pesanan'" />
        </div>
      </div>
      <div class="col-md-6">
        <div class="order-card">
          <div class="card-title">Ringkasan Cepat</div>
          <div class="row g-2">
            <div class="col-6">
              <div class="stat-card text-center" style="background: #f0f7ff">
                <div class="fw-700 fz-24 text-primary">{{ stats.total_orders }}</div>
                <div class="fz-12 text-muted">Total Transaksi</div>
              </div>
            </div>
            <div class="col-6">
              <div class="stat-card text-center" style="background: #f0fdf4">
                <div class="fw-700 fz-24 text-success">{{ formatRupiah(stats.total_revenue) }}</div>
                <div class="fz-12 text-muted">Total Pendapatan</div>
              </div>
            </div>
            <div class="col-6">
              <div class="stat-card text-center" style="background: #fffbeb">
                <div class="fw-700 fz-24 text-warning">{{ stats.today_orders }}</div>
                <div class="fz-12 text-muted">Pesanan Hari Ini</div>
              </div>
            </div>
            <div class="col-6">
              <div class="stat-card text-center" style="background: #fdf2f8">
                <div class="fw-700 fz-24" style="color: #e15759">{{ stats.orders_by_payment?.length || 0 }}</div>
                <div class="fz-12 text-muted">Metode Bayar Aktif</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff List -->
    <div class="order-card">
      <div class="card-title">Daftar Staff</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>Email</th>
            <th>Status</th>
            <th>Jumlah Pesanan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, idx) in staffList" :key="s.id">
            <td>{{ idx + 1 }}</td>
            <td class="fw-600">{{ s.name }}</td>
            <td>{{ s.email }}</td>
            <td>
              <span :class="s.is_active ? 'badge bg-success' : 'badge bg-secondary'">
                {{ s.is_active ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
            <td class="fw-600">{{ s._count?.orders || 0 }}</td>
          </tr>
          <tr v-if="staffList.length === 0">
            <td colspan="5" class="text-center text-muted py-3">Belum ada data staff</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()

const stats = ref({
  total_orders: 0,
  total_revenue: 0,
  today_orders: 0,
  orders_by_payment: [],
  orders_by_size: [],
})

const staffList = ref([])
const lowStockAlerts = ref([])

const paymentColors = { CASH: '#4e79a7', QRIS: '#f28e2b', PROMO: '#e15759', GOJEK: '#59a14f' }
const sizeColors = { SMALL: '#76b7b2', MEDIUM: '#4e79a7', LARGE: '#f28e2b', THINWALL: '#edc948' }

const paymentChartData = computed(() =>
  (stats.value.orders_by_payment || []).map(pm => ({
    label: pm.payment_method,
    value: pm._count || 0,
    color: paymentColors[pm.payment_method] || '#bab0ac',
  }))
)

const sizeChartData = computed(() =>
  (stats.value.orders_by_size || []).map(sz => ({
    label: getSizeLabel(sz.size),
    value: sz._count || 0,
    color: sizeColors[sz.size] || '#bab0ac',
  }))
)

const staffChartData = computed(() =>
  staffList.value
    .filter(s => (s._count?.orders || 0) > 0)
    .map(s => ({
      label: s.name,
      value: s._count?.orders || 0,
    }))
)

const getSizeLabel = (key) => {
  const map = { SMALL: 'Small', MEDIUM: 'Medium', LARGE: 'Large', THINWALL: 'Thinwall' }
  return map[key] || key
}

onMounted(async () => {
  try {
    const [statsRes, staffRes, stockRes] = await Promise.all([
      store.fetchDashboardStats(),
      store.fetchStaffList(),
      store.fetchToppingStock({}).catch(() => null),
    ])
    stats.value = statsRes.content
    staffList.value = staffRes.content
    if (stockRes?.content?.toppings) {
      lowStockAlerts.value = stockRes.content.toppings.filter(t => t.current_stock_gram < 500)
    }
  } catch (err) {
    console.error('Failed to load dashboard:', err)
  }
})
</script>
