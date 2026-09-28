<template>
  <div>
    <!-- Filter -->
    <div class="order-card mb-4">
      <div class="d-flex gap-2 align-items-end flex-wrap">
        <div>
          <label class="form-label fw-600 fz-14 mb-1">Dari</label>
          <input v-model="dateFrom" type="date" class="form-control fz-13" style="width: 160px" @change="refreshAll" />
        </div>
        <div>
          <label class="form-label fw-600 fz-14 mb-1">Sampai</label>
          <input v-model="dateTo" type="date" class="form-control fz-13" style="width: 160px" @change="refreshAll" />
        </div>
        <button class="btn btn-outline-secondary btn-sm" @click="setToday">Hari Ini</button>
        <span v-if="loading" class="fz-13 text-muted">Memuat...</span>
      </div>
      <div v-if="error" class="alert alert-danger fz-13 py-2 mt-2">{{ error }}</div>
    </div>

    <!-- Ledger -->
    <div class="order-card mb-4">
      <div class="card-title">Stok Packaging — Saldo Berjalan</div>
      <div class="table-responsive">
        <table class="data-table text-center" style="font-size: 12px">
          <thead>
            <tr>
              <th rowspan="2" class="text-start">Tanggal</th>
              <th v-for="m in menuSizes" :key="m.key" :colspan="4">
                {{ m.label }}
                <div class="fw-400 fz-12">{{ formatRupiah(m.price) }}</div>
              </th>
              <th rowspan="2">Sesuai Fisik</th>
            </tr>
            <tr>
              <template v-for="m in menuSizes" :key="m.key">
                <th class="fw-600">Awal</th>
                <th class="fw-600">Masuk</th>
                <th class="fw-600">Keluar</th>
                <th class="fw-600">Akhir</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td :colspan="menuSizes.length * 4 + 2" class="text-center py-4 text-muted">Tidak ada data</td>
            </tr>
            <tr v-for="row in rows" :key="row.date">
              <td class="text-start fw-600">{{ prettyDate(row.date) }}</td>
              <template v-for="b in row.by_size" :key="b.size_key">
                <td>{{ b.saldo_awal }}</td>
                <td class="text-success fw-600">{{ b.masuk || '' }}</td>
                <td class="text-danger fw-600">{{ b.keluar || '' }}</td>
                <td class="fw-700">{{ b.saldo_akhir }}</td>
              </template>
              <td>
                <input type="checkbox" :checked="row.is_match" @change="toggleReconcile(row, $event.target.checked)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="fz-12 text-muted mt-2">
        Masuk = pembelian packaging. Keluar = pemakaian packaging harian (dari menu <b>Packaging</b>).
      </div>
    </div>

    <!-- Input Masuk -->
    <div class="order-card mb-4">
      <div class="card-title">Input Stok Packaging Masuk</div>
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label fw-600 fz-14">Menu / Ukuran</label>
          <select v-model="form.menu_size_key" class="form-select">
            <option value="">-- Pilih --</option>
            <option v-for="s in sizeOptions" :key="s.key" :value="s.key">
              {{ s.label }} ({{ formatRupiah(s.price) }})
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label fw-600 fz-14">Jumlah</label>
          <input v-model.number="form.quantity" type="number" min="1" class="form-control" />
        </div>
        <div class="col-md-3">
          <label class="form-label fw-600 fz-14">Tanggal</label>
          <input v-model="form.entry_date" type="date" class="form-control" />
        </div>
        <div class="col-md-2">
          <label class="form-label fw-600 fz-14">Catatan</label>
          <input v-model="form.notes" class="form-control" placeholder="opsional" />
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary w-100" :disabled="!form.menu_size_key || !form.quantity || saving" @click="saveMasuk">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
      <div v-if="formError" class="alert alert-danger fz-13 py-2 mt-2">{{ formError }}</div>
    </div>

    <!-- Riwayat Masuk -->
    <div class="order-card">
      <div class="card-title">Riwayat Stok Packaging Masuk</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>Menu</th>
            <th>Jumlah</th>
            <th>Catatan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="entries.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">Belum ada data</td>
          </tr>
          <tr v-for="(e, i) in entries" :key="e.id">
            <td>{{ i + 1 }}</td>
            <td>{{ prettyDate(e.entry_date) }}</td>
            <td class="fw-600">{{ labelOf(e.menu_size_key) }}</td>
            <td class="fw-700 text-primary">{{ e.quantity }}</td>
            <td class="fz-13">{{ e.notes || '-' }}</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" @click="deleting = e"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleting" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center py-4">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 40px"></i>
            <p class="mt-3 fw-600">Hapus data stok packaging masuk ini?</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button class="btn btn-outline-secondary btn-sm" @click="deleting = null">Batal</button>
            <button class="btn btn-danger btn-sm" @click="doDelete">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah, todayJakarta } from '~/utils/format'

const store = useMainStore()

const dateFrom = ref(todayJakarta())
const dateTo = ref(todayJakarta())
const menuSizes = ref([])
const rows = ref([])
const entries = ref([])
const sizeOptions = ref([])
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const formError = ref('')
const deleting = ref(null)
const form = ref({ menu_size_key: '', quantity: 1, entry_date: todayJakarta(), notes: '' })

const prettyDate = (d) => {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  const [y, m, dd] = s.split('-')
  return `${dd}/${m}/${y}`
}
const labelOf = (key) => sizeOptions.value.find((s) => s.key === key)?.label || key

const fetchLedger = async () => {
  if (dateFrom.value > dateTo.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await store.fetchPackagingLedger({ date_from: dateFrom.value, date_to: dateTo.value })
    menuSizes.value = res.content.menu_sizes || []
    rows.value = [...(res.content.rows || [])].reverse()
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal memuat ledger'
  } finally {
    loading.value = false
  }
}

const fetchEntries = async () => {
  try {
    const res = await store.fetchPackagingStocks({ per_page: 20, date_from: dateFrom.value, date_to: dateTo.value })
    entries.value = res.content || []
  } catch (err) {
    console.error(err)
  }
}

const refreshAll = () => {
  fetchLedger()
  fetchEntries()
}

const setToday = () => {
  dateFrom.value = todayJakarta()
  dateTo.value = todayJakarta()
  refreshAll()
}

const saveMasuk = async () => {
  saving.value = true
  formError.value = ''
  try {
    await store.createPackagingStock(form.value)
    form.value = { menu_size_key: '', quantity: 1, entry_date: todayJakarta(), notes: '' }
    refreshAll()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}

const toggleReconcile = async (row, checked) => {
  try {
    await store.setPackagingReconcile({ date: row.date, is_match: checked })
    row.is_match = checked
  } catch (err) {
    console.error(err)
    row.is_match = !checked
  }
}

const doDelete = async () => {
  try {
    await store.deletePackagingStock(deleting.value.id)
    deleting.value = null
    refreshAll()
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  try {
    const sizeRes = await store.fetchSizes()
    sizeOptions.value = sizeRes.content || []
  } catch (err) {
    console.error(err)
  }
  refreshAll()
})
</script>
