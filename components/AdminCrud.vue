<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <input v-model="search" class="form-control fz-13" placeholder="Cari..." style="width: 250px" @input="debouncedFetch" />
      </div>
      <button class="btn btn-primary btn-sm" @click="openForm()">
        <i class="bi bi-plus-lg me-1"></i> Tambah {{ title }}
      </button>
    </div>

    <!-- Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 50px">No</th>
          <slot name="table-head" />
          <th>Status</th>
          <th style="width: 130px">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columnCount" class="text-center py-4 text-muted">Memuat data...</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columnCount" class="text-center py-4 text-muted">Tidak ada data</td>
        </tr>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ (currentPage - 1) * perPage + idx + 1 }}</td>
          <slot name="table-row" :row="row" />
          <td>
            <span :class="row.is_active ? 'badge bg-success' : 'badge bg-secondary'" style="cursor: pointer" @click="toggleActive(row)">
              {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" @click="openForm(row)">
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
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">{{ editingRow ? 'Edit' : 'Tambah' }} {{ title }}</h5>
            <button class="btn-close" @click="showForm = false"></button>
          </div>
          <div class="modal-body">
            <slot name="form" :form="formData" :is-editing="!!editingRow" />
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
            <p class="mt-3 fw-600">Hapus {{ title }} ini?</p>
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
const props = defineProps({
  title: String,
  columnCount: { type: Number, default: 4 },
  fetchFn: Function,
  createFn: Function,
  updateFn: Function,
  deleteFn: Function,
  defaultFormData: { type: Function, default: () => ({}) },
  mapFormToPayload: { type: Function, default: (f) => f },
  mapRowToForm: { type: Function, default: (r) => ({ ...r }) },
})

const emit = defineEmits(['saved'])

const rows = ref([])
const loading = ref(false)
const currentPage = ref(1)
const perPage = ref(20)
const meta = ref({ total: 0, last_page: 1 })
const search = ref('')
const showForm = ref(false)
const editingRow = ref(null)
const formData = ref({})
const formError = ref('')
const saving = ref(false)
const deletingRow = ref(null)

let debounceTimer = null

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: currentPage.value, per_page: perPage.value }
    if (search.value) params.search = search.value
    const result = await props.fetchFn(params)
    rows.value = result.content
    meta.value = result.meta
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

const goToPage = (p) => {
  if (p < 1 || p > meta.value.last_page) return
  currentPage.value = p
  fetchData()
}

const openForm = (row = null) => {
  editingRow.value = row
  formData.value = row ? props.mapRowToForm(row) : props.defaultFormData()
  formError.value = ''
  showForm.value = true
}

const saveForm = async () => {
  saving.value = true
  formError.value = ''
  try {
    const payload = props.mapFormToPayload(formData.value)
    if (editingRow.value) {
      await props.updateFn(editingRow.value.id, payload)
    } else {
      await props.createFn(payload)
    }
    showForm.value = false
    fetchData()
    emit('saved')
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan data'
  } finally {
    saving.value = false
  }
}

const toggleActive = async (row) => {
  try {
    await props.updateFn(row.id, { is_active: !row.is_active })
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

const confirmDelete = (row) => { deletingRow.value = row }

const doDelete = async () => {
  try {
    await props.deleteFn(deletingRow.value.id)
    deletingRow.value = null
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchData)

defineExpose({ fetchData })
</script>
