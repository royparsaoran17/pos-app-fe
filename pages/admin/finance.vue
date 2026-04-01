<template>
  <div>
    <!-- Saldo Cards -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="fz-12 text-muted mb-1"><i class="bi bi-cash-coin me-1"></i> Saldo Cash</div>
          <div class="fw-700 fz-20" :class="summary.saldo_cash >= 0 ? 'text-success' : 'text-danger'">
            {{ formatRupiah(summary.saldo_cash) }}
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="fz-12 text-muted mb-1"><i class="bi bi-bank me-1"></i> Saldo Bank</div>
          <div class="fw-700 fz-20" :class="summary.saldo_bank >= 0 ? 'text-success' : 'text-danger'">
            {{ formatRupiah(summary.saldo_bank) }}
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="fz-12 text-muted mb-1"><i class="bi bi-qr-code me-1"></i> Saldo QRIS</div>
          <div class="fw-700 fz-20" :class="summary.saldo_qris >= 0 ? 'text-success' : 'text-danger'">
            {{ formatRupiah(summary.saldo_qris) }}
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card" style="border-left: 3px solid var(--primary)">
          <div class="fz-12 text-muted mb-1"><i class="bi bi-wallet2 me-1"></i> Total Saldo</div>
          <div class="fw-700 fz-20" :class="summary.saldo_total >= 0 ? 'text-primary' : 'text-danger'">
            {{ formatRupiah(summary.saldo_total) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Income / Expense summary -->
    <div class="row g-3 mb-4">
      <div class="col-6">
        <div class="stat-card text-center" style="border-top: 3px solid #198754">
          <div class="fz-12 text-muted mb-1">Total Pemasukan</div>
          <div class="fw-700 fz-18 text-success">{{ formatRupiah(summary.total_income) }}</div>
        </div>
      </div>
      <div class="col-6">
        <div class="stat-card text-center" style="border-top: 3px solid #dc3545">
          <div class="fz-12 text-muted mb-1">Total Pengeluaran</div>
          <div class="fw-700 fz-18 text-danger">{{ formatRupiah(summary.total_expense) }}</div>
        </div>
      </div>
    </div>

    <!-- Filters & Add Button -->
    <div class="d-flex gap-2 mb-3 flex-wrap align-items-center">
      <select v-model="filterType" class="form-select fz-13" style="width: 150px" @change="resetPage">
        <option value="">Semua Tipe</option>
        <option value="INCOME">Pemasukan</option>
        <option value="EXPENSE">Pengeluaran</option>
      </select>
      <select v-model="filterWallet" class="form-select fz-13" style="width: 140px" @change="resetPage">
        <option value="">Semua Saldo</option>
        <option value="CASH">Cash</option>
        <option value="BANK">Bank</option>
        <option value="QRIS">QRIS</option>
      </select>
      <select v-model="filterCategory" class="form-select fz-13" style="width: 160px" @change="resetPage">
        <option value="">Semua Kategori</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <input v-model="dateFrom" type="date" class="form-control fz-13" style="width: 150px" @change="resetPage" />
      <input v-model="dateTo" type="date" class="form-control fz-13" style="width: 150px" @change="resetPage" />
      <input v-model="search" class="form-control fz-13" placeholder="Cari deskripsi..." style="width: 180px" @input="debouncedFetch" />
      <div class="ms-auto">
        <button class="btn btn-success btn-sm me-1" @click="openForm('INCOME')">
          <i class="bi bi-plus-lg me-1"></i> Pemasukan
        </button>
        <button class="btn btn-danger btn-sm" @click="openForm('EXPENSE')">
          <i class="bi bi-plus-lg me-1"></i> Pengeluaran
        </button>
      </div>
    </div>

    <!-- Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 45px">No</th>
          <th>Tanggal</th>
          <th>Tipe</th>
          <th>Saldo</th>
          <th>Kategori</th>
          <th>Deskripsi</th>
          <th class="text-end">Jumlah</th>
          <th style="width: 100px">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="8" class="text-center py-4 text-muted">Memuat...</td></tr>
        <tr v-else-if="rows.length === 0"><td colspan="8" class="text-center py-4 text-muted">Tidak ada data</td></tr>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ (currentPage - 1) * 20 + idx + 1 }}</td>
          <td class="fz-13">{{ formatDateShort(row.transaction_date) }}</td>
          <td>
            <span :class="row.type === 'INCOME' ? 'badge bg-success' : 'badge bg-danger'">
              {{ row.type === 'INCOME' ? 'Masuk' : 'Keluar' }}
            </span>
          </td>
          <td>
            <span class="badge" :class="walletBadge(row.wallet)">{{ row.wallet }}</span>
          </td>
          <td class="fz-13">{{ row.category || '-' }}</td>
          <td>
            <div class="fw-600">{{ row.description }}</div>
            <div v-if="row.notes" class="fz-12 text-muted">{{ row.notes }}</div>
          </td>
          <td class="text-end fw-700" :class="row.type === 'INCOME' ? 'text-success' : 'text-danger'">
            {{ row.type === 'INCOME' ? '+' : '-' }}{{ formatRupiah(row.amount) }}
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" @click="editRow(row)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(row)">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="d-flex justify-content-between align-items-center mt-3">
      <span class="fz-13 text-muted">Total: {{ meta.total }}</span>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li v-for="p in meta.last_page" :key="p" class="page-item" :class="{ active: p === currentPage }">
            <button class="page-link" @click="currentPage = p; fetchData()">{{ p }}</button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">
              {{ editingRow ? 'Edit Transaksi' : (form.type === 'INCOME' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran') }}
            </h5>
            <button class="btn-close" @click="showForm = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label fw-600 fz-14">Tipe</label>
                <select v-model="form.type" class="form-select">
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label fw-600 fz-14">Saldo</label>
                <select v-model="form.wallet" class="form-select">
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label fw-600 fz-14">Jumlah (Rp)</label>
                <input v-model.number="form.amount" type="number" class="form-control" min="1" placeholder="50000" />
              </div>
              <div class="col-6">
                <label class="form-label fw-600 fz-14">Tanggal</label>
                <input v-model="form.transaction_date" type="date" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label fw-600 fz-14">Kategori</label>
                <input v-model="form.category" class="form-control" list="catList" placeholder="cth: Belanja Bahan, Setoran, dll" />
                <datalist id="catList">
                  <option v-for="c in categories" :key="c" :value="c" />
                </datalist>
              </div>
              <div class="col-12">
                <label class="form-label fw-600 fz-14">Deskripsi</label>
                <input v-model="form.description" class="form-control" placeholder="cth: Beli gula 5kg" />
              </div>
              <div class="col-12">
                <label class="form-label fw-600 fz-14">Catatan (opsional)</label>
                <textarea v-model="form.notes" class="form-control" rows="2" placeholder="Catatan tambahan..."></textarea>
              </div>
            </div>
            <div v-if="formError" class="alert alert-danger fz-13 py-2 mt-3">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary btn-sm" @click="showForm = false">Batal</button>
            <button class="btn btn-sm" :class="form.type === 'INCOME' ? 'btn-success' : 'btn-danger'" :disabled="saving" @click="saveForm">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deletingRow" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center py-4">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 40px"></i>
            <p class="mt-3 fw-600">Hapus transaksi ini?</p>
            <p class="fz-13 text-muted">{{ deletingRow.description }}</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button class="btn btn-outline-secondary btn-sm" @click="deletingRow = null">Batal</button>
            <button class="btn btn-danger btn-sm" @click="doDelete">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()

const rows = ref([])
const loading = ref(false)
const currentPage = ref(1)
const meta = ref({ total: 0, last_page: 1 })
const summary = ref({ saldo_cash: 0, saldo_bank: 0, saldo_qris: 0, saldo_total: 0, total_income: 0, total_expense: 0 })
const categories = ref([])

const search = ref('')
const filterType = ref('')
const filterWallet = ref('')
const filterCategory = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const showForm = ref(false)
const editingRow = ref(null)
const form = ref({})
const formError = ref('')
const saving = ref(false)
const deletingRow = ref(null)

let debounceTimer = null

const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

const walletBadge = (w) => {
  if (w === 'CASH') return 'bg-primary'
  if (w === 'BANK') return 'bg-warning text-dark'
  if (w === 'QRIS') return 'bg-info text-dark'
  return 'bg-secondary'
}

const formatDateShort = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: currentPage.value, per_page: 20 }
    if (search.value) params.search = search.value
    if (filterType.value) params.type = filterType.value
    if (filterWallet.value) params.wallet = filterWallet.value
    if (filterCategory.value) params.category = filterCategory.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    const result = await store.adminFetchFinance(params)
    rows.value = result.content
    meta.value = result.meta
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

const fetchSummary = async () => {
  try {
    const result = await store.adminFetchFinanceSummary()
    summary.value = result.content
  } catch (err) { console.error(err) }
}

const fetchCategories = async () => {
  try {
    const result = await store.adminFetchFinanceCategories()
    categories.value = result.content
  } catch (err) { console.error(err) }
}

const resetPage = () => { currentPage.value = 1; fetchData() }

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { currentPage.value = 1; fetchData() }, 300)
}

const defaultForm = (type = 'EXPENSE') => ({
  type,
  wallet: 'CASH',
  amount: null,
  description: '',
  category: '',
  transaction_date: todayStr(),
  notes: '',
})

const openForm = (type = 'EXPENSE') => {
  editingRow.value = null
  form.value = defaultForm(type)
  formError.value = ''
  showForm.value = true
}

const editRow = (row) => {
  editingRow.value = row
  form.value = {
    type: row.type,
    wallet: row.wallet,
    amount: row.amount,
    description: row.description,
    category: row.category || '',
    transaction_date: row.transaction_date ? row.transaction_date.slice(0, 10) : todayStr(),
    notes: row.notes || '',
  }
  formError.value = ''
  showForm.value = true
}

const saveForm = async () => {
  if (!form.value.description) { formError.value = 'Deskripsi wajib diisi'; return }
  if (!form.value.amount || form.value.amount < 1) { formError.value = 'Jumlah harus lebih dari 0'; return }
  saving.value = true
  formError.value = ''
  try {
    if (editingRow.value) {
      await store.adminUpdateFinance(editingRow.value.id, form.value)
    } else {
      await store.adminCreateFinance(form.value)
    }
    showForm.value = false
    fetchData()
    fetchSummary()
    fetchCategories()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan'
  } finally { saving.value = false }
}

const confirmDelete = (row) => { deletingRow.value = row }

const doDelete = async () => {
  try {
    await store.adminDeleteFinance(deletingRow.value.id)
    deletingRow.value = null
    fetchData()
    fetchSummary()
  } catch (err) { console.error(err) }
}

onMounted(() => {
  fetchData()
  fetchSummary()
  fetchCategories()
})
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
</style>
