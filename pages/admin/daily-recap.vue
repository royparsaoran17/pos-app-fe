<template>
  <div>
    <!-- Date Picker -->
    <div class="d-flex flex-wrap gap-2 mb-4 align-items-center no-print">
      <button class="btn btn-sm btn-outline-primary" @click="changeDate(-1)" title="Hari sebelumnya">
        <i class="bi bi-chevron-left"></i>
      </button>
      <input v-model="selectedDate" type="date" class="form-control form-control-sm" style="width: 170px" @change="loadRecap" />
      <button class="btn btn-sm btn-outline-primary" @click="changeDate(1)" title="Hari berikutnya">
        <i class="bi bi-chevron-right"></i>
      </button>
      <span class="fz-13 text-muted ms-2">{{ formattedDate }}</span>
      <button class="btn btn-sm btn-primary ms-auto" @click="printRecap">
        <i class="bi bi-printer me-1"></i> Cetak Rekap
      </button>
    </div>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div> Memuat rekap harian...
    </div>

    <div v-if="recap && !loading" id="recap-print-area">
      <!-- Print header (only visible in print) -->
      <div class="print-header" style="display:none">
        <h2 style="margin:0;font-size:18px;font-weight:700">Rekap Harian - Oh My Tongue</h2>
        <p style="margin:4px 0 16px;font-size:13px;color:#666">{{ formattedDate }}</p>
      </div>

      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value">{{ recap.orders.total_count }}</div>
            <div class="stat-label">Total Pesanan</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value fz-16">{{ formatRupiah(recap.orders.total_revenue) }}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value fz-16 text-danger">{{ formatRupiah(recap.net_summary.total_expenses) }}</div>
            <div class="stat-label">Total Pengeluaran</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card" :style="recap.net_summary.net_profit >= 0 ? 'border-left: 3px solid #198754' : 'border-left: 3px solid #dc3545'">
            <div class="stat-value fz-16" :class="recap.net_summary.net_profit >= 0 ? 'text-success' : 'text-danger'">
              {{ formatRupiah(recap.net_summary.net_profit) }}
            </div>
            <div class="stat-label">Net Profit</div>
          </div>
        </div>
      </div>

      <!-- Revenue Breakdown -->
      <div class="row g-3 mb-4">
        <!-- By Payment Method -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Pendapatan per Metode Pembayaran</div>
            <div v-if="recap.orders.by_payment.length === 0" class="text-center text-muted py-3 fz-13">Belum ada data</div>
            <div v-else class="row g-2">
              <div v-for="pm in recap.orders.by_payment" :key="pm.method" class="col-6">
                <div class="stat-card" style="padding: 12px">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span :class="'badge-payment badge-' + (pm.method || '').toLowerCase()">{{ pm.method }}</span>
                    <span class="fz-12 text-muted">{{ pm.count }} pesanan</span>
                  </div>
                  <div class="fw-700 fz-14">{{ formatRupiah(pm.total) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- By Menu Size -->
        <div class="col-md-6">
          <div class="order-card h-100">
            <div class="card-title">Penjualan per Ukuran Menu</div>
            <table class="table table-sm fz-13 mb-0">
              <thead>
                <tr>
                  <th>Ukuran</th>
                  <th class="text-end">Jumlah</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sz in recap.orders.by_size" :key="sz.size">
                  <td class="fw-600">{{ sz.size }}</td>
                  <td class="text-end">{{ sz.count }}</td>
                  <td class="text-end fw-600">{{ formatRupiah(sz.total) }}</td>
                </tr>
                <tr v-if="recap.orders.by_size.length === 0">
                  <td colspan="3" class="text-center text-muted">Belum ada data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Expenses List -->
      <div class="order-card mb-4">
        <div class="card-title">Pengeluaran Hari Ini</div>
        <div v-if="recap.expenses.items.length === 0" class="text-center text-muted py-3 fz-13">Tidak ada pengeluaran</div>
        <table v-else class="table table-sm fz-13 mb-0">
          <thead>
            <tr>
              <th style="width: 40px">No</th>
              <th>Deskripsi</th>
              <th>Kategori</th>
              <th>Sumber</th>
              <th class="text-end">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(exp, idx) in recap.expenses.items" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td class="fw-600">{{ exp.description }}</td>
              <td>{{ exp.category }}</td>
              <td>
                <span class="badge" :class="exp.source === 'expenses' ? 'bg-warning text-dark' : 'bg-info text-dark'">
                  {{ exp.source === 'expenses' ? 'Operasional' : 'Buku Kas' }}
                </span>
              </td>
              <td class="text-end fw-600 text-danger">{{ formatRupiah(exp.amount) }}</td>
            </tr>
            <tr class="fw-700" style="border-top: 2px solid #dee2e6">
              <td colspan="4">Total Pengeluaran</td>
              <td class="text-end text-danger">{{ formatRupiah(recap.expenses.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Finance Summary -->
      <div class="order-card mb-4">
        <div class="card-title">Ringkasan Keuangan (Buku Kas)</div>
        <div class="row g-3 mb-3">
          <div class="col-6">
            <div class="stat-card text-center" style="border-top: 3px solid #198754; padding: 12px">
              <div class="fz-12 text-muted mb-1">Pemasukan</div>
              <div class="fw-700 fz-16 text-success">{{ formatRupiah(recap.finance.income_total) }}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="stat-card text-center" style="border-top: 3px solid #dc3545; padding: 12px">
              <div class="fz-12 text-muted mb-1">Pengeluaran</div>
              <div class="fw-700 fz-16 text-danger">{{ formatRupiah(recap.finance.expense_total) }}</div>
            </div>
          </div>
        </div>
        <table class="table table-sm fz-13 mb-0">
          <thead>
            <tr>
              <th>Saldo</th>
              <th class="text-end">Net</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(val, wallet) in recap.finance.by_wallet" :key="wallet">
              <td>
                <span class="badge" :class="walletBadge(wallet)">{{ wallet }}</span>
              </td>
              <td class="text-end fw-600" :class="val >= 0 ? 'text-success' : 'text-danger'">
                {{ formatRupiah(val) }}
              </td>
            </tr>
            <tr v-if="Object.keys(recap.finance.by_wallet).length === 0">
              <td colspan="2" class="text-center text-muted">Tidak ada transaksi keuangan</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Staff Performance -->
      <div class="order-card mb-4">
        <div class="card-title">Performa Staff</div>
        <div v-if="recap.staff_on_duty.length === 0" class="text-center text-muted py-3 fz-13">Tidak ada data staff</div>
        <table v-else class="table table-sm fz-13 mb-0">
          <thead>
            <tr>
              <th style="width: 40px">No</th>
              <th>Nama Staff</th>
              <th class="text-end">Jumlah Pesanan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(staff, idx) in sortedStaff" :key="idx">
              <td>
                <span v-if="idx < 3" class="badge rounded-pill" :class="idx === 0 ? 'bg-warning text-dark' : idx === 1 ? 'bg-secondary' : 'bg-bronze'">{{ idx + 1 }}</span>
                <span v-else>{{ idx + 1 }}</span>
              </td>
              <td class="fw-600">{{ staff.name }}</td>
              <td class="text-end fw-700">{{ staff.orders_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!recap && !loading" class="text-center py-5 text-muted">
      <i class="bi bi-calendar-x" style="font-size: 48px"></i>
      <p class="mt-3">Pilih tanggal untuk melihat rekap harian</p>
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

const sortedStaff = computed(() => {
  if (!recap.value) return []
  return [...recap.value.staff_on_duty].sort((a, b) => b.orders_count - a.orders_count)
})

const walletBadge = (w) => {
  if (w === 'CASH') return 'bg-primary'
  if (w === 'BANK') return 'bg-warning text-dark'
  if (w === 'QRIS') return 'bg-info text-dark'
  return 'bg-secondary'
}

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
    const res = await store.fetchDailyRecap({ date: selectedDate.value })
    recap.value = res.content
  } catch (err) {
    console.error(err)
    recap.value = null
  } finally {
    loading.value = false
  }
}

const printRecap = () => {
  window.print()
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
.bg-bronze {
  background-color: #cd7f32 !important;
  color: #fff;
}

@media print {
  .no-print {
    display: none !important;
  }
  .print-header {
    display: block !important;
  }
  .stat-card {
    box-shadow: none;
    border: 1px solid #dee2e6;
  }
  .order-card {
    box-shadow: none;
    border: 1px solid #dee2e6;
    break-inside: avoid;
  }
}
</style>
