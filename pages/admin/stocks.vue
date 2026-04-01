<template>
  <div>
    <!-- Summary Card -->
    <div class="row mb-3">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm">
          <div class="card-body py-2 px-3">
            <div class="fz-12 text-muted">Total Biaya Stok (filter aktif)</div>
            <div class="fw-700 text-primary">{{ formatRupiah(totalCost) }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-8">
        <div class="d-flex gap-2 justify-content-end">
          <select v-model="filterType" class="form-select form-select-sm" style="width: 140px" @change="reloadData">
            <option value="">Semua Tipe</option>
            <option value="TOPPING">Topping</option>
            <option value="BUMBU">Bumbu</option>
            <option value="OTHER">Lainnya</option>
          </select>
          <input v-model="filterDateFrom" type="date" class="form-control form-control-sm" style="width: 150px" @change="reloadData" />
          <input v-model="filterDateTo" type="date" class="form-control form-control-sm" style="width: 150px" @change="reloadData" />
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <input v-model="search" class="form-control fz-13" placeholder="Cari item atau supplier..." style="width: 250px" @input="debouncedFetch" />
      <button class="btn btn-primary btn-sm" @click="openForm()">
        <i class="bi bi-plus-lg me-1"></i> Tambah Stok
      </button>
    </div>

    <!-- Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 40px">No</th>
          <th>Tanggal</th>
          <th>Tipe</th>
          <th>Nama Item</th>
          <th>Qty</th>
          <th>Harga Beli</th>
          <th>Total</th>
          <th>Supplier</th>
          <th style="width: 100px">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="9" class="text-center py-4 text-muted">Memuat data...</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td colspan="9" class="text-center py-4 text-muted">Tidak ada data</td>
        </tr>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ (currentPage - 1) * perPage + idx + 1 }}</td>
          <td class="fz-13">{{ formatDateShort(row.entry_date) }}</td>
          <td><span class="badge" :class="typeBadge(row.item_type)">{{ row.item_type }}</span></td>
          <td class="fw-600">{{ row.item_name }}</td>
          <td>{{ row.quantity }} {{ row.unit }}</td>
          <td>{{ formatRupiah(row.purchase_price) }}</td>
          <td class="fw-600">{{ formatRupiah(row.total_cost) }}</td>
          <td class="fz-13">{{ row.supplier || '-' }}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" @click="openForm(row)"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(row)"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="d-flex justify-content-between align-items-center mt-3">
      <span class="fz-13 text-muted">Total: {{ meta.total }}</span>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage <= 1 }">
            <button class="page-link" @click="goToPage(currentPage - 1)">Prev</button>
          </li>
          <li v-for="p in meta.last_page" :key="p" class="page-item" :class="{ active: p === currentPage }">
            <button class="page-link" @click="goToPage(p)">{{ p }}</button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage >= meta.last_page }">
            <button class="page-link" @click="goToPage(currentPage + 1)">Next</button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">{{ editingRow ? 'Edit' : 'Tambah' }} Stok Masuk</h5>
            <button class="btn-close" @click="showForm = false"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label fw-600 fz-14">Tipe Item</label>
                <select v-model="form.item_type" class="form-select" @change="onTypeChange">
                  <option value="TOPPING">Topping</option>
                  <option value="BUMBU">Bumbu</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-600 fz-14">Nama Item</label>
                <select v-if="form.item_type === 'TOPPING' && toppingOptions.length" v-model="form.topping_id" class="form-select" @change="onToppingSelect">
                  <option :value="null">-- Pilih Topping --</option>
                  <option v-for="t in toppingOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
                <select v-else-if="form.item_type === 'BUMBU' && bumbuOptions.length" v-model="form.bumbu_id" class="form-select" @change="onBumbuSelect">
                  <option :value="null">-- Pilih Bumbu --</option>
                  <option v-for="b in bumbuOptions" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
                <input v-else v-model="form.item_name" class="form-control" placeholder="Nama item" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label fw-600 fz-14">Jumlah</label>
                <input v-model.number="form.quantity" type="number" step="0.1" class="form-control" placeholder="0" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label fw-600 fz-14">Satuan</label>
                <input v-model="form.unit" class="form-control" placeholder="kg, liter, pcs..." />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label fw-600 fz-14">Harga Beli (per satuan)</label>
                <input v-model.number="form.purchase_price" type="number" class="form-control" placeholder="0" />
              </div>
              <div class="col-12 mb-2">
                <div class="alert alert-info py-2 fz-13 mb-0">
                  <strong>Total Biaya:</strong> {{ formatRupiah((form.quantity || 0) * (form.purchase_price || 0)) }}
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-600 fz-14">Supplier</label>
                <input v-model="form.supplier" class="form-control" placeholder="Nama supplier (opsional)" />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-600 fz-14">Tanggal Masuk</label>
                <input v-model="form.entry_date" type="date" class="form-control" />
              </div>
              <div class="col-12 mb-3">
                <label class="form-label fw-600 fz-14">Catatan</label>
                <textarea v-model="form.notes" class="form-control" rows="2" placeholder="Catatan tambahan (opsional)"></textarea>
              </div>
            </div>
            <div v-if="formError" class="alert alert-danger fz-13 mt-2 py-2">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary btn-sm" @click="showForm = false">Batal</button>
            <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveForm">
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
            <p class="mt-3 fw-600">Hapus stok ini?</p>
            <p class="fz-13 text-muted">Data yang dihapus tidak dapat dikembalikan</p>
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
import { formatRupiah } from '~/utils/format'
import { useMainStore } from '~/stores'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()
const rows = ref([])
const loading = ref(false)
const currentPage = ref(1)
const perPage = ref(20)
const meta = ref({ total: 0, last_page: 1 })
const search = ref('')
const filterType = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const totalCost = ref(0)
const showForm = ref(false)
const editingRow = ref(null)
const form = ref({})
const formError = ref('')
const saving = ref(false)
const deletingRow = ref(null)
const toppingOptions = ref([])
const bumbuOptions = ref([])

let debounceTimer = null

const defaultForm = () => ({
  item_type: 'TOPPING',
  item_name: '',
  topping_id: null,
  bumbu_id: null,
  quantity: null,
  unit: 'kg',
  purchase_price: null,
  supplier: '',
  notes: '',
  entry_date: new Date().toISOString().slice(0, 10),
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: currentPage.value, per_page: perPage.value }
    if (search.value) params.search = search.value
    if (filterType.value) params.item_type = filterType.value
    if (filterDateFrom.value) params.date_from = filterDateFrom.value
    if (filterDateTo.value) params.date_to = filterDateTo.value
    const result = await store.adminFetchStocks(params)
    rows.value = result.content
    meta.value = result.meta
    totalCost.value = result.meta.total_cost || 0
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { currentPage.value = 1; fetchData() }, 300)
}

const reloadData = () => { currentPage.value = 1; fetchData() }
const goToPage = (p) => { if (p < 1 || p > meta.value.last_page) return; currentPage.value = p; fetchData() }

const loadOptions = async () => {
  try {
    const [t, b] = await Promise.all([store.adminFetchToppings({ per_page: 500 }), store.adminFetchBumbu({ per_page: 500 })])
    toppingOptions.value = t.content
    bumbuOptions.value = b.content
  } catch (err) {
    console.error(err)
  }
}

const onTypeChange = () => {
  form.value.topping_id = null
  form.value.bumbu_id = null
  form.value.item_name = ''
}

const onToppingSelect = () => {
  const t = toppingOptions.value.find(x => x.id === form.value.topping_id)
  if (t) form.value.item_name = t.name
}

const onBumbuSelect = () => {
  const b = bumbuOptions.value.find(x => x.id === form.value.bumbu_id)
  if (b) form.value.item_name = b.name
}

const openForm = (row = null) => {
  editingRow.value = row
  if (row) {
    form.value = {
      item_type: row.item_type,
      item_name: row.item_name,
      topping_id: row.topping_id,
      bumbu_id: row.bumbu_id,
      quantity: row.quantity,
      unit: row.unit,
      purchase_price: row.purchase_price,
      supplier: row.supplier || '',
      notes: row.notes || '',
      entry_date: row.entry_date ? row.entry_date.slice(0, 10) : '',
    }
  } else {
    form.value = defaultForm()
  }
  formError.value = ''
  showForm.value = true
}

const saveForm = async () => {
  if (!form.value.item_name) { formError.value = 'Nama item wajib diisi'; return }
  if (!form.value.quantity || form.value.quantity <= 0) { formError.value = 'Jumlah wajib diisi'; return }
  if (!form.value.purchase_price || form.value.purchase_price <= 0) { formError.value = 'Harga beli wajib diisi'; return }
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form.value }
    if (payload.item_type !== 'TOPPING') payload.topping_id = null
    if (payload.item_type !== 'BUMBU') payload.bumbu_id = null
    if (editingRow.value) {
      await store.adminUpdateStock(editingRow.value.id, payload)
    } else {
      await store.adminCreateStock(payload)
    }
    showForm.value = false
    fetchData()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan data'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (row) => { deletingRow.value = row }
const doDelete = async () => {
  try {
    await store.adminDeleteStock(deletingRow.value.id)
    deletingRow.value = null
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

const typeBadge = (type) => ({
  'bg-info': type === 'TOPPING',
  'bg-warning text-dark': type === 'BUMBU',
  'bg-secondary': type === 'OTHER',
})

const formatDateShort = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  fetchData()
  loadOptions()
})
</script>
