<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <input v-model="search" class="form-control fz-13" placeholder="Cari kode/nama promo..." style="width: 250px" @input="debouncedFetch" />
      <button class="btn btn-primary btn-sm" @click="openForm()">
        <i class="bi bi-plus-lg me-1"></i> Tambah Promo
      </button>
    </div>

    <!-- Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Kode</th>
          <th>Nama</th>
          <th>Tipe</th>
          <th>Nilai</th>
          <th>Min. Beli</th>
          <th>Penggunaan</th>
          <th>Periode</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="10" class="text-center py-4 text-muted">Memuat...</td></tr>
        <tr v-else-if="rows.length === 0"><td colspan="10" class="text-center py-4 text-muted">Tidak ada data</td></tr>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ (currentPage - 1) * 20 + idx + 1 }}</td>
          <td><code class="fw-700">{{ row.code }}</code></td>
          <td class="fw-600">{{ row.name }}</td>
          <td><span :class="row.discount_type === 'PERCENTAGE' ? 'badge bg-info' : 'badge bg-warning'">{{ row.discount_type === 'PERCENTAGE' ? 'Persen' : 'Nominal' }}</span></td>
          <td class="fw-600">{{ row.discount_type === 'PERCENTAGE' ? row.discount_value + '%' : formatRupiah(row.discount_value) }}</td>
          <td>{{ formatRupiah(row.min_purchase) }}</td>
          <td>{{ row.used_count }}{{ row.max_usage ? ' / ' + row.max_usage : '' }}</td>
          <td class="fz-12">
            <span v-if="row.start_date || row.end_date">
              {{ row.start_date ? formatDateShort(row.start_date) : '-' }} s/d {{ row.end_date ? formatDateShort(row.end_date) : '-' }}
            </span>
            <span v-else class="text-muted">Tanpa batas</span>
          </td>
          <td>
            <span :class="row.is_active ? 'badge bg-success' : 'badge bg-secondary'" style="cursor: pointer" @click="toggleActive(row)">
              {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" @click="openForm(row)"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(row)"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">{{ editing ? 'Edit' : 'Tambah' }} Promo</h5>
            <button class="btn-close" @click="showForm = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-600 fz-14">Kode Promo</label>
                <input v-model="form.code" class="form-control" placeholder="cth: DISKON20" :disabled="!!editing" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-600 fz-14">Nama</label>
                <input v-model="form.name" class="form-control" placeholder="cth: Diskon 20%" />
              </div>
              <div class="col-12">
                <label class="form-label fw-600 fz-14">Deskripsi</label>
                <textarea v-model="form.description" class="form-control fz-13" rows="2" placeholder="Deskripsi promo..."></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-600 fz-14">Tipe Diskon</label>
                <select v-model="form.discount_type" class="form-select">
                  <option value="PERCENTAGE">Persen (%)</option>
                  <option value="FIXED">Nominal (Rp)</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-600 fz-14">Nilai Diskon</label>
                <input v-model.number="form.discount_value" type="number" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-600 fz-14">Min. Pembelian (Rp)</label>
                <input v-model.number="form.min_purchase" type="number" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-600 fz-14">Maks Diskon (Rp)</label>
                <input v-model.number="form.max_discount" type="number" class="form-control" placeholder="Kosongkan untuk tanpa batas" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-600 fz-14">Maks Penggunaan</label>
                <input v-model.number="form.max_usage" type="number" class="form-control" placeholder="Kosongkan untuk tanpa batas" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-600 fz-14">Tanggal Mulai</label>
                <input v-model="form.start_date" type="date" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-600 fz-14">Tanggal Berakhir</label>
                <input v-model="form.end_date" type="date" class="form-control" />
              </div>
            </div>
            <div v-if="formError" class="alert alert-danger fz-13 mt-3 py-2">{{ formError }}</div>
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
            <p class="mt-3 fw-600">Hapus promo "{{ deletingRow.code }}"?</p>
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
const search = ref('')
const showForm = ref(false)
const editing = ref(null)
const form = ref({})
const formError = ref('')
const saving = ref(false)
const deletingRow = ref(null)

let debounceTimer = null

const defaultForm = () => ({
  code: '', name: '', description: '', discount_type: 'PERCENTAGE',
  discount_value: 10, min_purchase: 0, max_discount: null, max_usage: null,
  start_date: '', end_date: '',
})

const formatDateShort = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await store.fetchPromos({ page: currentPage.value, per_page: 20, search: search.value || undefined })
    rows.value = result.content
    meta.value = result.meta
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { currentPage.value = 1; fetchData() }, 300)
}

const openForm = (row = null) => {
  editing.value = row
  if (row) {
    form.value = {
      code: row.code, name: row.name, description: row.description || '',
      discount_type: row.discount_type, discount_value: row.discount_value,
      min_purchase: row.min_purchase, max_discount: row.max_discount,
      max_usage: row.max_usage,
      start_date: row.start_date ? row.start_date.slice(0, 10) : '',
      end_date: row.end_date ? row.end_date.slice(0, 10) : '',
    }
  } else {
    form.value = defaultForm()
  }
  formError.value = ''
  showForm.value = true
}

const saveForm = async () => {
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form.value }
    if (!payload.max_discount) payload.max_discount = null
    if (!payload.max_usage) payload.max_usage = null
    if (!payload.start_date) payload.start_date = undefined
    if (!payload.end_date) payload.end_date = undefined

    if (editing.value) {
      delete payload.code
      await store.updatePromo(editing.value.id, payload)
    } else {
      await store.createPromo(payload)
    }
    showForm.value = false
    fetchData()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan'
  } finally { saving.value = false }
}

const toggleActive = async (row) => {
  try { await store.updatePromo(row.id, { is_active: !row.is_active }); fetchData() }
  catch (err) { console.error(err) }
}

const confirmDelete = (row) => { deletingRow.value = row }
const doDelete = async () => {
  try { await store.deletePromo(deletingRow.value.id); deletingRow.value = null; fetchData() }
  catch (err) { console.error(err) }
}

onMounted(fetchData)
</script>
