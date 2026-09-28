<template>
  <div>
    <!-- Filter Bar -->
    <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
      <button class="btn btn-sm btn-outline-secondary" @click="setMonth(-1)" title="Bulan sebelumnya">
        <i class="bi bi-chevron-left"></i>
      </button>
      <input v-model="dateFrom" type="date" class="form-control form-control-sm" style="width: 160px" @change="loadLedger" />
      <span class="text-muted fz-13">s/d</span>
      <input v-model="dateTo" type="date" class="form-control form-control-sm" style="width: 160px" @change="loadLedger" />
      <button class="btn btn-sm btn-outline-secondary" @click="setMonth(1)" title="Bulan berikutnya">
        <i class="bi bi-chevron-right"></i>
      </button>
      <button class="btn btn-sm btn-outline-primary ms-2" @click="setThisMonth">Bulan Ini</button>
      <button class="btn btn-sm btn-outline-secondary ms-auto" :disabled="loading" @click="loadLedger">
        <i class="bi bi-arrow-clockwise me-1"></i> Refresh
      </button>
    </div>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div> Memuat buku kas...
    </div>

    <div v-if="ledger && !loading" class="ledger-wrapper">
      <table class="ledger-table">
        <thead>
          <tr>
            <th rowspan="2" class="th-orange">TANGGAL</th>
            <th rowspan="2" class="th-orange">SALDO AWAL</th>
            <th rowspan="2" class="th-orange">MASUK</th>
            <th rowspan="2" class="th-orange">KELUAR</th>
            <th rowspan="2" class="th-orange">SALDO AKHIR</th>
            <th rowspan="2" class="th-orange">TOTAL QRIS</th>
            <th :colspan="ledger.menu_sizes.length + 1" class="th-orange">JUMLAH PENJUALAN</th>
            <th rowspan="2" class="th-orange th-narrow">SESUAI DENGAN FISIK</th>
          </tr>
          <tr>
            <th v-for="s in ledger.menu_sizes" :key="s.key" class="th-orange-sub">{{ s.label }}</th>
            <th class="th-orange-sub">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in ledger.rows" :key="row.date" :class="idx % 2 === 0 ? 'row-light' : 'row-dark'">
            <td class="td-date">{{ formatDateRow(row.date) }}</td>
            <td class="td-money">{{ formatNum(row.saldo_awal) }}</td>
            <td class="td-money">{{ formatNum(row.masuk) }}</td>
            <td class="td-money">{{ formatNum(row.keluar) }}</td>
            <td class="td-money fw-700">{{ formatNum(row.saldo_akhir) }}</td>
            <td class="td-money">{{ formatNum(row.total_qris) }}</td>
            <td v-for="s in row.by_size" :key="s.size_key" class="td-count fw-700">{{ s.count }}</td>
            <td class="td-count td-total" :class="row.total_items > 30 ? 'bg-total-good' : 'bg-total-low'">
              {{ row.total_items }}
            </td>
            <td class="td-check">
              <button
                class="check-btn"
                :class="{ checked: row.is_match }"
                :title="row.is_match ? `Diverifikasi oleh ${row.verified_by || '-'}` : 'Klik untuk tandai sesuai fisik'"
                :disabled="savingDate === row.date"
                @click="toggleMatch(row)"
              >
                <i v-if="savingDate === row.date" class="spinner-border spinner-border-sm"></i>
                <i v-else-if="row.is_match" class="bi bi-check-square-fill"></i>
                <i v-else class="bi bi-square"></i>
              </button>
            </td>
          </tr>
          <tr v-if="ledger.rows.length === 0">
            <td :colspan="7 + ledger.menu_sizes.length + 1" class="text-center text-muted py-4">
              Tidak ada data pada rentang tanggal ini
            </td>
          </tr>
        </tbody>
        <tfoot v-if="ledger.rows.length > 0">
          <tr class="row-footer fw-700">
            <td class="text-end">TOTAL</td>
            <td></td>
            <td class="td-money">{{ formatNum(totals.masuk) }}</td>
            <td class="td-money">{{ formatNum(totals.keluar) }}</td>
            <td></td>
            <td class="td-money">{{ formatNum(totals.qris) }}</td>
            <td v-for="(s, i) in ledger.menu_sizes" :key="s.key" class="td-count">{{ totals.by_size[i] }}</td>
            <td class="td-count">{{ totals.items }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { useToast } from '~/composables/useToast'
import { todayJakarta } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()
const toast = useToast()

const loading = ref(false)
const ledger = ref(null)
const savingDate = ref('')

const monthStart = () => {
  const t = new Date(todayJakarta() + 'T00:00:00+07:00')
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`
}

const dateFrom = ref(monthStart())
const dateTo = ref(todayJakarta())

const formatNum = (v) => (v == null ? '' : Number(v).toLocaleString('id-ID'))

const formatDateRow = (d) => {
  const dt = new Date(d + 'T00:00:00+07:00')
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const totals = computed(() => {
  if (!ledger.value) return { masuk: 0, keluar: 0, qris: 0, by_size: [], items: 0 }
  const rows = ledger.value.rows
  const sizes = ledger.value.menu_sizes
  return {
    masuk: rows.reduce((s, r) => s + r.masuk, 0),
    keluar: rows.reduce((s, r) => s + r.keluar, 0),
    qris: rows.reduce((s, r) => s + r.total_qris, 0),
    by_size: sizes.map((sz, i) => rows.reduce((s, r) => s + (r.by_size[i]?.count || 0), 0)),
    items: rows.reduce((s, r) => s + r.total_items, 0),
  }
})

const loadLedger = async () => {
  if (!dateFrom.value || !dateTo.value) return
  loading.value = true
  try {
    const res = await store.fetchCashLedger({ date_from: dateFrom.value, date_to: dateTo.value })
    ledger.value = res.content
  } catch (err) {
    console.error(err)
    toast.error(err.response?.data?.message || 'Gagal memuat buku kas')
    ledger.value = null
  } finally {
    loading.value = false
  }
}

const setMonth = (delta) => {
  const d = new Date(dateFrom.value + 'T00:00:00+07:00')
  d.setMonth(d.getMonth() + delta)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  dateFrom.value = `${y}-${m}-01`
  const last = new Date(y, d.getMonth() + 1, 0).getDate()
  dateTo.value = `${y}-${m}-${String(last).padStart(2, '0')}`
  loadLedger()
}

const setThisMonth = () => {
  dateFrom.value = monthStart()
  dateTo.value = todayJakarta()
  loadLedger()
}

const toggleMatch = async (row) => {
  savingDate.value = row.date
  const next = !row.is_match
  try {
    await store.setCashLedgerReconciliation({ date: row.date, is_match: next })
    row.is_match = next
    toast.success(next ? 'Ditandai sesuai fisik' : 'Tanda fisik dilepas')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menyimpan')
  } finally {
    savingDate.value = ''
  }
}

onMounted(loadLedger)
</script>

<style scoped>
.ledger-wrapper {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid var(--gray-200);
}
.ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 1100px;
}
.ledger-table th,
.ledger-table td {
  border: 1px solid var(--gray-200);
  padding: 8px 10px;
  text-align: center;
  vertical-align: middle;
}
.th-orange,
.th-orange-sub {
  background: #f37b21;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.4px;
}
.th-orange-sub {
  font-size: 12px;
  background: #f58c3c;
}
.th-narrow {
  width: 110px;
}
.row-light td { background: #fff8ef; }
.row-dark td { background: #ffffff; }
.td-date { text-align: center; font-weight: 600; white-space: nowrap; }
.td-money { text-align: right; font-variant-numeric: tabular-nums; }
.td-count { text-align: center; font-variant-numeric: tabular-nums; }
.td-total { color: #fff; font-weight: 700; }
.bg-total-good { background: #1f8a3a !important; }
.bg-total-low { background: #f37b21 !important; }
.row-footer td { background: #fff3e3; }
.check-btn {
  border: 1px solid var(--gray-300);
  background: #fff;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #6c757d;
  transition: all 0.15s ease;
}
.check-btn:hover:not(:disabled) {
  border-color: #f37b21;
  color: #f37b21;
}
.check-btn.checked {
  background: #f37b21;
  color: #fff;
  border-color: #f37b21;
}
.check-btn:disabled { cursor: wait; opacity: 0.6; }
</style>
