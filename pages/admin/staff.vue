<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <input v-model="search" class="form-control fz-13" placeholder="Cari nama/email..." style="width: 250px" @input="debouncedFetch" />
      <button class="btn btn-primary btn-sm" @click="openForm()">
        <i class="bi bi-plus-lg me-1"></i> Tambah Staff
      </button>
    </div>

    <!-- Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Nama</th>
          <th>Email</th>
          <th>Toko</th>
          <th>Pesanan</th>
          <th>SOP</th>
          <th>Quality</th>
          <th>Status</th>
          <th>Tgl Dibuat</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="10" class="text-center py-4 text-muted">Memuat...</td></tr>
        <tr v-else-if="rows.length === 0"><td colspan="10" class="text-center py-4 text-muted">Tidak ada data</td></tr>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ (currentPage - 1) * 20 + idx + 1 }}</td>
          <td class="fw-600">{{ row.name }}</td>
          <td>{{ row.email }}</td>
          <td><span v-if="row.store" class="badge bg-info fz-11">{{ row.store.name }}</span><span v-else class="text-muted fz-12">-</span></td>
          <td class="fw-600">{{ row._count?.orders || 0 }}</td>
          <td>{{ row._count?.sop_checklists || 0 }}</td>
          <td>{{ row._count?.quality_checks || 0 }}</td>
          <td>
            <span :class="row.is_active ? 'badge bg-success' : 'badge bg-secondary'" style="cursor: pointer" @click="toggleActive(row)">
              {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
            </span>
          </td>
          <td class="fz-13">{{ formatDate(row.created_at) }}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" @click="openForm(row)" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning me-1" @click="openResetPassword(row)" title="Reset Password">
              <i class="bi bi-key"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(row)" title="Hapus">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="d-flex justify-content-between align-items-center mt-3">
      <span class="fz-13 text-muted">Total: {{ meta.total }} staff</span>
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
            <h5 class="modal-title fw-700">{{ editing ? 'Edit' : 'Tambah' }} Staff</h5>
            <button class="btn-close" @click="showForm = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Nama</label>
              <input v-model="form.name" class="form-control" placeholder="Nama lengkap" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Email</label>
              <input v-model="form.email" type="email" class="form-control" placeholder="email@example.com" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Toko</label>
              <select v-model="form.store_id" class="form-select">
                <option :value="null">-- Pilih Toko --</option>
                <option v-for="s in storeList" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div v-if="!editing" class="mb-3">
              <label class="form-label fw-600 fz-14">Password</label>
              <input v-model="form.password" type="password" class="form-control" placeholder="Minimal 6 karakter" />
            </div>
            <div v-if="formError" class="alert alert-danger fz-13 py-2">{{ formError }}</div>
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

    <!-- Reset Password Modal -->
    <div v-if="resetRow" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">Reset Password</h5>
            <button class="btn-close" @click="resetRow = null"></button>
          </div>
          <div class="modal-body">
            <p class="fz-13 text-muted mb-2">Reset password untuk <strong>{{ resetRow.name }}</strong></p>
            <input v-model="newPassword" type="password" class="form-control" placeholder="Password baru (min 6 karakter)" />
            <div v-if="resetError" class="alert alert-danger fz-13 py-2 mt-2">{{ resetError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary btn-sm" @click="resetRow = null">Batal</button>
            <button class="btn btn-warning btn-sm" :disabled="saving" @click="doResetPassword">
              {{ saving ? 'Menyimpan...' : 'Reset' }}
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
            <p class="mt-3 fw-600">Hapus staff "{{ deletingRow.name }}"?</p>
            <p class="fz-13 text-muted">Staff yang dihapus tidak dapat login lagi</p>
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
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()

const rows = ref([])
const loading = ref(false)
const currentPage = ref(1)
const meta = ref({ total: 0, last_page: 1 })
const search = ref('')
const showForm = ref(false)
const editing = ref(null)
const form = ref({ name: '', email: '', password: '' })
const formError = ref('')
const saving = ref(false)
const deletingRow = ref(null)
const resetRow = ref(null)
const newPassword = ref('')
const resetError = ref('')
const storeList = ref([])

let debounceTimer = null

const fetchData = async () => {
  loading.value = true
  try {
    const result = await store.adminFetchStaff({ page: currentPage.value, per_page: 20, search: search.value || undefined })
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
  form.value = row
    ? { name: row.name, email: row.email, store_id: row.store_id || null }
    : { name: '', email: '', password: '', store_id: null }
  formError.value = ''
  showForm.value = true
}

const saveForm = async () => {
  saving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      await store.adminUpdateStaff(editing.value.id, { name: form.value.name, email: form.value.email, store_id: form.value.store_id })
    } else {
      await store.adminCreateStaff(form.value)
    }
    showForm.value = false
    fetchData()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan'
  } finally { saving.value = false }
}

const toggleActive = async (row) => {
  try {
    await store.adminUpdateStaff(row.id, { is_active: !row.is_active })
    fetchData()
  } catch (err) { console.error(err) }
}

const openResetPassword = (row) => {
  resetRow.value = row
  newPassword.value = ''
  resetError.value = ''
}

const doResetPassword = async () => {
  if (newPassword.value.length < 6) {
    resetError.value = 'Password minimal 6 karakter'
    return
  }
  saving.value = true
  try {
    await store.adminUpdateStaff(resetRow.value.id, { password: newPassword.value })
    resetRow.value = null
  } catch (err) {
    resetError.value = err.response?.data?.message || 'Gagal reset password'
  } finally { saving.value = false }
}

const confirmDelete = (row) => { deletingRow.value = row }
const doDelete = async () => {
  try { await store.adminDeleteStaff(deletingRow.value.id); deletingRow.value = null; fetchData() }
  catch (err) { console.error(err) }
}

onMounted(async () => {
  fetchData()
  try {
    const res = await store.adminFetchActiveStores()
    storeList.value = res.content
  } catch {}
})
</script>
