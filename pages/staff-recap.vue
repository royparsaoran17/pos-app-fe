<template>
  <div>
    <!-- Date Picker -->
    <div class="d-flex flex-wrap gap-2 mb-4 align-items-center">
      <button class="btn btn-sm btn-outline-primary" @click="changeDate(-1)" title="Hari sebelumnya">
        <i class="bi bi-chevron-left"></i>
      </button>
      <input v-model="selectedDate" type="date" class="form-control form-control-sm" style="width: 170px" @change="loadRecap" />
      <button class="btn btn-sm btn-outline-primary" @click="changeDate(1)" title="Hari berikutnya">
        <i class="bi bi-chevron-right"></i>
      </button>
      <span class="fz-13 text-muted ms-2">{{ formattedDate }}</span>
      <button class="btn btn-sm btn-outline-secondary ms-auto" @click="loadRecap" :disabled="loading">
        <i class="bi bi-arrow-clockwise me-1"></i> Refresh
      </button>
    </div>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div> Memuat rekap...
    </div>

    <div v-if="recap && !loading">
      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value">{{ recap.summary.total_orders }}</div>
            <div class="stat-label">Total Pesanan</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value">{{ recap.summary.total_items_sold }}</div>
            <div class="stat-label">Total Menu Terjual</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card" style="border-left: 3px solid #198754">
            <div class="stat-value fz-16 text-success">{{ formatRupiah(recap.summary.total_revenue) }}</div>
            <div class="stat-label">Total Uang Masuk</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card" style="border-left: 3px solid #6c757d">
            <div class="stat-value fz-16 text-muted">{{ formatRupiah(recap.summary.total_discount) }}</div>
            <div class="stat-label">Total Diskon / Promo</div>
          </div>
        </div>
      </div>

      <!-- Money by Payment Method -->
      <div class="order-card mb-4">
        <div class="card-title">Uang Masuk per Metode Pembayaran</div>
        <div v-if="recap.by_payment.length === 0" class="text-center text-muted py-3 fz-13">Belum ada transaksi hari ini</div>
        <div v-else class="row g-2">
          <div v-for="pm in recap.by_payment" :key="pm.method" class="col-6 col-md-4 col-lg-3">
            <div class="payment-card" :class="'pm-' + (pm.method || '').toLowerCase()">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <span :class="'badge-payment badge-' + (pm.method || '').toLowerCase()">{{ pm.method }}</span>
                <span class="fz-12 text-muted">{{ pm.count }} pesanan</span>
              </div>
              <div class="fw-700 fz-16">{{ formatRupiah(pm.total) }}</div>
            </div>
          </div>
        </div>

        <!-- Totals row -->
        <div v-if="recap.by_payment.length > 0" class="d-flex justify-content-end mt-3 pt-3 border-top">
          <div class="text-end">
            <div class="fz-12 text-muted">Total Semua Metode</div>
            <div class="fw-700 fz-18 text-success">{{ formatRupiah(recap.summary.total_revenue) }}</div>
          </div>
        </div>
      </div>

      <!-- Menu Sold -->
      <div class="order-card mb-4">
        <div class="card-title">Menu Terjual Hari Ini</div>
        <div v-if="recap.by_menu.length === 0" class="text-center text-muted py-3 fz-13">Belum ada menu terjual</div>
        <table v-else class="table table-sm fz-13 mb-0">
          <thead>
            <tr>
              <th style="width: 40px">No</th>
              <th>Menu / Ukuran</th>
              <th class="text-center">Qty Terjual</th>
              <th class="text-end">Total Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, idx) in recap.by_menu" :key="m.size_key">
              <td>
                <span v-if="idx < 3" class="badge rounded-pill" :class="idx === 0 ? 'bg-warning text-dark' : idx === 1 ? 'bg-secondary' : 'bg-bronze'">{{ idx + 1 }}</span>
                <span v-else>{{ idx + 1 }}</span>
              </td>
              <td class="fw-600">{{ m.label }}</td>
              <td class="text-center fw-700">{{ m.count }}</td>
              <td class="text-end fw-600 text-primary">{{ formatRupiah(m.total) }}</td>
            </tr>
            <tr class="fw-700" style="border-top: 2px solid #dee2e6">
              <td colspan="2">Total</td>
              <td class="text-center">{{ recap.summary.total_items_sold }}</td>
              <td class="text-end text-primary">{{ formatRupiah(menuTotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!recap && !loading" class="text-center py-5 text-muted">
      <i class="bi bi-calendar-x" style="font-size: 48px"></i>
      <p class="mt-3">Pilih tanggal untuk melihat rekap.</p>
    </div>
  </div>
</template>

<script setup>
import { formatRupiah, todayJakarta } from '~/utils/format'
import { useMainStore } from '~/stores'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()
const loading = ref(false)
const recap = ref(null)
const selectedDate = ref(todayJakarta())

const formattedDate = computed(() => {
  if (!selectedDate.value) return '-'
  const d = new Date(selectedDate.value + 'T00:00:00+07:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
})

const menuTotal = computed(() => {
  if (!recap.value) return 0
  return recap.value.by_menu.reduce((sum, m) => sum + (m.total || 0), 0)
})

const changeDate = (delta) => {
  const d = new Date(selectedDate.value + 'T00:00:00+07:00')
  d.setDate(d.getDate() + delta)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  selectedDate.value = `${y}-${m}-${day}`
  loadRecap()
}

const loadRecap = async () => {
  if (!selectedDate.value) return
  loading.value = true
  try {
    const res = await store.fetchStaffRecap({ date: selectedDate.value })
    recap.value = res.content
  } catch (err) {
    console.error(err)
    recap.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadRecap)
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.payment-card {
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid var(--gray-200);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.payment-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.payment-card.pm-cash { border-left: 3px solid #198754; }
.payment-card.pm-qris { border-left: 3px solid #0dcaf0; }
.payment-card.pm-gojek { border-left: 3px solid #198038; }
.payment-card.pm-promo { border-left: 3px solid #fd7e14; }
.bg-bronze {
  background-color: #cd7f32 !important;
  color: #fff;
}
</style>
