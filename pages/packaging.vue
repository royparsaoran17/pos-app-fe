<template>
  <div>
    <!-- Today's Summary -->
    <div class="order-card mb-4">
      <div class="card-title">Packaging Hari Ini</div>
      <div class="row g-3">
        <div v-for="s in todaySummary" :key="s.menu_size_key" class="col-md-3 col-6">
          <div class="stat-card text-center">
            <div class="fw-700 fz-24 text-primary">{{ s.total }}</div>
            <div class="fz-12 text-muted">{{ getSizeLabel(s.menu_size_key) }}</div>
          </div>
        </div>
        <div v-if="todaySummary.length === 0" class="col-12 text-center text-muted py-2">
          Belum ada packaging hari ini
        </div>
      </div>
    </div>

    <!-- Input Form -->
    <div class="order-card mb-4">
      <div class="card-title">Catat Packaging Baru</div>
      <div class="row g-3 align-items-end">
        <div class="col-md-4">
          <label class="form-label fw-600 fz-14">Pilih Menu</label>
          <select v-model="form.menu_size_key" class="form-select">
            <option value="">-- Pilih ukuran --</option>
            <option v-for="s in sizes" :key="s.key" :value="s.key">{{ s.label }} ({{ formatRupiah(s.price) }})</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label fw-600 fz-14">Jumlah</label>
          <input v-model.number="form.quantity" type="number" class="form-control" min="1" placeholder="0" />
        </div>
        <div class="col-md-4">
          <label class="form-label fw-600 fz-14">Catatan (opsional)</label>
          <input v-model="form.notes" class="form-control" placeholder="cth: batch pagi" />
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary w-100" :disabled="!form.menu_size_key || !form.quantity || saving" @click="savePackaging">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
      <div v-if="formError" class="alert alert-danger fz-13 py-2 mt-2">{{ formError }}</div>
    </div>

    <!-- History -->
    <div class="order-card">
      <div class="card-title">Riwayat Packaging</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Menu</th>
            <th>Jumlah</th>
            <th>Catatan</th>
            <th>Tanggal</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="text-center py-4 text-muted">Memuat...</td></tr>
          <tr v-else-if="rows.length === 0"><td colspan="6" class="text-center py-4 text-muted">Belum ada data</td></tr>
          <tr v-for="(row, idx) in rows" :key="row.id">
            <td>{{ idx + 1 }}</td>
            <td class="fw-600">{{ getSizeLabel(row.menu_size_key) }}</td>
            <td class="fw-700 fz-16 text-primary">{{ row.quantity }}</td>
            <td class="fz-13">{{ row.notes || '-' }}</td>
            <td class="fz-13">{{ formatDateTime(row.created_at) }}</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(row)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="meta.last_page > 1" class="d-flex justify-content-between align-items-center mt-3">
        <span class="fz-13 text-muted">Total: {{ meta.total }}</span>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li v-for="p in meta.last_page" :key="p" class="page-item" :class="{ active: p === currentPage }">
              <button class="page-link" @click="currentPage = p; fetchHistory()">{{ p }}</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deletingRow" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center py-4">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 40px"></i>
            <p class="mt-3 fw-600">Hapus data packaging ini?</p>
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

const sizes = ref([])
const todaySummary = ref([])
const rows = ref([])
const loading = ref(false)
const saving = ref(false)
const currentPage = ref(1)
const meta = ref({ total: 0, last_page: 1 })
const form = ref({ menu_size_key: '', quantity: 1, notes: '' })
const formError = ref('')
const deletingRow = ref(null)

const sizeMap = computed(() => {
  const map = {}
  sizes.value.forEach(s => { map[s.key] = s })
  return map
})

const getSizeLabel = (key) => sizeMap.value[key]?.label || key

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchHistory = async () => {
  loading.value = true
  try {
    const result = await store.fetchPackaging({ page: currentPage.value, per_page: 20 })
    rows.value = result.content
    meta.value = result.meta
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

const fetchSummary = async () => {
  try {
    const result = await store.fetchPackagingSummary()
    todaySummary.value = result.content
  } catch (err) { console.error(err) }
}

const savePackaging = async () => {
  saving.value = true
  formError.value = ''
  try {
    await store.createPackaging(form.value)
    form.value = { menu_size_key: '', quantity: 1, notes: '' }
    fetchHistory()
    fetchSummary()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan'
  } finally { saving.value = false }
}

const confirmDelete = (row) => { deletingRow.value = row }
const doDelete = async () => {
  try {
    await store.deletePackaging(deletingRow.value.id)
    deletingRow.value = null
    fetchHistory()
    fetchSummary()
  } catch (err) { console.error(err) }
}

onMounted(async () => {
  try {
    const sizeRes = await store.fetchSizes()
    sizes.value = sizeRes.content
  } catch (err) { console.error(err) }
  fetchHistory()
  fetchSummary()
})
</script>
