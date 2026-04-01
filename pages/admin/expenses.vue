<template>
  <div>
    <!-- Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'expenses' }" @click="activeTab = 'expenses'">Pengeluaran</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">Kategori</button>
      </li>
    </ul>

    <!-- ============ EXPENSES TAB ============ -->
    <div v-if="activeTab === 'expenses'">
      <!-- Summary -->
      <div class="row mb-3">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm">
            <div class="card-body py-2 px-3">
              <div class="fz-12 text-muted">Total Pengeluaran (filter aktif)</div>
              <div class="fw-700 text-danger">{{ formatRupiah(totalAmount) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="d-flex gap-2 justify-content-end">
            <select v-model="filterCategory" class="form-select form-select-sm" style="width: 160px" @change="reloadExpenses">
              <option value="">Semua Kategori</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <input v-model="filterDateFrom" type="date" class="form-control form-control-sm" style="width: 150px" @change="reloadExpenses" />
            <input v-model="filterDateTo" type="date" class="form-control form-control-sm" style="width: 150px" @change="reloadExpenses" />
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <input v-model="expSearch" class="form-control fz-13" placeholder="Cari deskripsi..." style="width: 250px" @input="debouncedFetchExpenses" />
        <button class="btn btn-primary btn-sm" @click="openExpenseForm()">
          <i class="bi bi-plus-lg me-1"></i> Tambah Pengeluaran
        </button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px">No</th>
            <th>Tanggal</th>
            <th>Kategori</th>
            <th>Deskripsi</th>
            <th>Jumlah</th>
            <th>Catatan</th>
            <th style="width: 100px">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="expLoading">
            <td colspan="7" class="text-center py-4 text-muted">Memuat data...</td>
          </tr>
          <tr v-else-if="expenses.length === 0">
            <td colspan="7" class="text-center py-4 text-muted">Tidak ada data</td>
          </tr>
          <tr v-for="(row, idx) in expenses" :key="row.id">
            <td>{{ (expPage - 1) * 20 + idx + 1 }}</td>
            <td class="fz-13">{{ formatDateShort(row.expense_date) }}</td>
            <td><span class="badge bg-dark">{{ row.category?.name || '-' }}</span></td>
            <td class="fw-600">{{ row.description }}</td>
            <td class="fw-600 text-danger">{{ formatRupiah(row.amount) }}</td>
            <td class="fz-13">{{ row.notes || '-' }}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" @click="openExpenseForm(row)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" @click="confirmDeleteExpense(row)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="expMeta.last_page > 1" class="d-flex justify-content-between align-items-center mt-3">
        <span class="fz-13 text-muted">Total: {{ expMeta.total }}</span>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: expPage <= 1 }">
              <button class="page-link" @click="goExpPage(expPage - 1)">Prev</button>
            </li>
            <li v-for="p in expMeta.last_page" :key="p" class="page-item" :class="{ active: p === expPage }">
              <button class="page-link" @click="goExpPage(p)">{{ p }}</button>
            </li>
            <li class="page-item" :class="{ disabled: expPage >= expMeta.last_page }">
              <button class="page-link" @click="goExpPage(expPage + 1)">Next</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- ============ CATEGORIES TAB ============ -->
    <div v-if="activeTab === 'categories'">
      <AdminCrud
        ref="catCrud"
        title="Kategori Pengeluaran"
        :column-count="4"
        :fetch-fn="store.adminFetchExpenseCategories"
        :create-fn="store.adminCreateExpenseCategory"
        :update-fn="store.adminUpdateExpenseCategory"
        :delete-fn="store.adminDeleteExpenseCategory"
        :default-form-data="() => ({ name: '' })"
        :map-row-to-form="(r) => ({ name: r.name })"
        :map-form-to-payload="(f) => ({ name: f.name })"
        @saved="loadCategories"
      >
        <template #table-head>
          <th>Nama Kategori</th>
        </template>
        <template #table-row="{ row }">
          <td class="fw-600">{{ row.name }}</td>
        </template>
        <template #form="{ form }">
          <div class="mb-3">
            <label class="form-label fw-600 fz-14">Nama Kategori</label>
            <input v-model="form.name" class="form-control" placeholder="Masukkan nama kategori" />
          </div>
        </template>
      </AdminCrud>
    </div>

    <!-- Expense Form Modal -->
    <div v-if="showExpForm" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">{{ editingExp ? 'Edit' : 'Tambah' }} Pengeluaran</h5>
            <button class="btn-close" @click="showExpForm = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Kategori</label>
              <select v-model="expForm.category_id" class="form-select">
                <option :value="null">-- Pilih Kategori --</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Deskripsi</label>
              <input v-model="expForm.description" class="form-control" placeholder="Bayar listrik bulan Maret..." />
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Jumlah (Rp)</label>
              <input v-model.number="expForm.amount" type="number" class="form-control" placeholder="0" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Tanggal</label>
              <input v-model="expForm.expense_date" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Catatan</label>
              <textarea v-model="expForm.notes" class="form-control" rows="2" placeholder="Catatan (opsional)"></textarea>
            </div>
            <div v-if="expFormError" class="alert alert-danger fz-13 mt-2 py-2">{{ expFormError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary btn-sm" @click="showExpForm = false">Batal</button>
            <button class="btn btn-primary btn-sm" :disabled="expSaving" @click="saveExpense">
              <span v-if="expSaving" class="spinner-border spinner-border-sm me-1"></span>
              {{ expSaving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Expense Confirm -->
    <div v-if="deletingExp" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center py-4">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 40px"></i>
            <p class="mt-3 fw-600">Hapus pengeluaran ini?</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button class="btn btn-outline-secondary btn-sm" @click="deletingExp = null">Batal</button>
            <button class="btn btn-danger btn-sm" @click="doDeleteExpense">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatRupiah } from '~/utils/format'
import { useMainStore } from '~/stores'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()
const activeTab = ref('expenses')

// Expenses state
const expenses = ref([])
const expLoading = ref(false)
const expPage = ref(1)
const expMeta = ref({ total: 0, last_page: 1 })
const expSearch = ref('')
const filterCategory = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const totalAmount = ref(0)
const showExpForm = ref(false)
const editingExp = ref(null)
const expForm = ref({})
const expFormError = ref('')
const expSaving = ref(false)
const deletingExp = ref(null)
const categories = ref([])

let debounceTimer = null

const loadCategories = async () => {
  try {
    const res = await store.adminFetchExpenseCategories({ per_page: 500 })
    categories.value = res.content.filter(c => c.is_active)
  } catch (err) { console.error(err) }
}

const fetchExpenses = async () => {
  expLoading.value = true
  try {
    const params = { page: expPage.value, per_page: 20 }
    if (expSearch.value) params.search = expSearch.value
    if (filterCategory.value) params.category_id = filterCategory.value
    if (filterDateFrom.value) params.date_from = filterDateFrom.value
    if (filterDateTo.value) params.date_to = filterDateTo.value
    const result = await store.adminFetchExpenses(params)
    expenses.value = result.content
    expMeta.value = result.meta
    totalAmount.value = result.meta.total_amount || 0
  } catch (err) { console.error(err) } finally { expLoading.value = false }
}

const debouncedFetchExpenses = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { expPage.value = 1; fetchExpenses() }, 300)
}

const reloadExpenses = () => { expPage.value = 1; fetchExpenses() }
const goExpPage = (p) => { if (p < 1 || p > expMeta.value.last_page) return; expPage.value = p; fetchExpenses() }

const openExpenseForm = (row = null) => {
  editingExp.value = row
  if (row) {
    expForm.value = {
      category_id: row.category_id,
      description: row.description,
      amount: row.amount,
      expense_date: row.expense_date ? row.expense_date.slice(0, 10) : '',
      notes: row.notes || '',
    }
  } else {
    expForm.value = {
      category_id: null,
      description: '',
      amount: null,
      expense_date: new Date().toISOString().slice(0, 10),
      notes: '',
    }
  }
  expFormError.value = ''
  showExpForm.value = true
}

const saveExpense = async () => {
  if (!expForm.value.category_id) { expFormError.value = 'Kategori wajib dipilih'; return }
  if (!expForm.value.description) { expFormError.value = 'Deskripsi wajib diisi'; return }
  if (!expForm.value.amount || expForm.value.amount <= 0) { expFormError.value = 'Jumlah wajib diisi'; return }
  expSaving.value = true
  expFormError.value = ''
  try {
    if (editingExp.value) {
      await store.adminUpdateExpense(editingExp.value.id, expForm.value)
    } else {
      await store.adminCreateExpense(expForm.value)
    }
    showExpForm.value = false
    fetchExpenses()
  } catch (err) {
    expFormError.value = err.response?.data?.message || 'Gagal menyimpan data'
  } finally { expSaving.value = false }
}

const confirmDeleteExpense = (row) => { deletingExp.value = row }
const doDeleteExpense = async () => {
  try {
    await store.adminDeleteExpense(deletingExp.value.id)
    deletingExp.value = null
    fetchExpenses()
  } catch (err) { console.error(err) }
}

const formatDateShort = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  loadCategories()
  fetchExpenses()
})
</script>
