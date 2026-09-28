<template>
  <div>
    <!-- Filters -->
    <div class="d-flex gap-2 mb-3 flex-wrap">
      <select v-model="selectedStaff" class="form-select fz-13" style="width: 200px" @change="fetchData">
        <option value="">Semua Staff</option>
        <option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <input v-model="dateFrom" type="date" class="form-control fz-13" style="width: 160px" @change="fetchData" />
      <input v-model="dateTo" type="date" class="form-control fz-13" style="width: 160px" @change="fetchData" />
    </div>

    <!-- Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Staff</th>
          <th>Tanggal</th>
          <th>Buka</th>
          <th>Tutup</th>
          <th>Kas Awal</th>
          <th>Kas Akhir</th>
          <th>Selisih</th>
          <th>Pesanan</th>
          <th>Revenue</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="12" class="text-center py-4 text-muted">Memuat...</td></tr>
        <tr v-else-if="rows.length === 0"><td colspan="12" class="text-center py-4 text-muted">Tidak ada data</td></tr>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ idx + 1 }}</td>
          <td class="fw-600">{{ row.staff?.name }}</td>
          <td class="fz-13">{{ formatDate(row.shift_date) }}</td>
          <td class="fz-13">{{ formatTime(row.open_time) }}</td>
          <td class="fz-13">{{ row.close_time ? formatTime(row.close_time) : '-' }}</td>
          <td>{{ formatRupiah(row.opening_cash) }}</td>
          <td>{{ row.closing_cash !== null ? formatRupiah(row.closing_cash) : '-' }}</td>
          <td>
            <span v-if="row.cash_difference !== null" :class="row.cash_difference >= 0 ? 'text-success fw-600' : 'text-danger fw-600'">
              {{ row.cash_difference >= 0 ? '+' : '' }}{{ formatRupiah(row.cash_difference) }}
            </span>
            <span v-else>-</span>
          </td>
          <td class="fw-600">{{ row.total_orders }}</td>
          <td class="fw-600 text-primary">{{ formatRupiah(row.total_revenue) }}</td>
          <td>
            <span :class="row.status === 'OPEN' ? 'badge bg-success' : 'badge bg-secondary'">
              {{ row.status === 'OPEN' ? 'Buka' : 'Tutup' }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-warning" @click="openEdit(row)" title="Edit shift">
              <i class="bi bi-pencil"></i>
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

    <!-- Edit Shift Modal -->
    <div v-if="editingShift" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">Edit Shift - {{ editingShift.staff?.name }}</h5>
            <button class="btn-close" @click="editingShift = null"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fz-13 fw-600">Tanggal Shift</label>
                <input v-model="editForm.shift_date" type="date" class="form-control form-control-sm" />
              </div>
              <div class="col-md-6">
                <label class="form-label fz-13 fw-600">Status</label>
                <select v-model="editForm.status" class="form-select form-select-sm">
                  <option value="OPEN">Buka</option>
                  <option value="CLOSED">Tutup</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fz-13 fw-600">Jam Buka</label>
                <input v-model="editForm.open_time" type="datetime-local" class="form-control form-control-sm" />
              </div>
              <div class="col-md-6">
                <label class="form-label fz-13 fw-600">Jam Tutup</label>
                <input v-model="editForm.close_time" type="datetime-local" class="form-control form-control-sm" />
                <small class="text-muted fz-11">Kosongkan jika shift masih buka</small>
              </div>
              <div class="col-md-6">
                <label class="form-label fz-13 fw-600">Kas Awal</label>
                <input v-model.number="editForm.opening_cash" type="number" min="0" class="form-control form-control-sm" />
              </div>
              <div class="col-md-6">
                <label class="form-label fz-13 fw-600">Kas Akhir</label>
                <input v-model.number="editForm.closing_cash" type="number" min="0" class="form-control form-control-sm" />
              </div>
              <div class="col-12">
                <label class="form-label fz-13 fw-600">Catatan</label>
                <input v-model="editForm.notes" class="form-control form-control-sm" />
              </div>
              <div class="col-12">
                <div class="alert alert-light border fz-12 mb-0 py-2">
                  <i class="bi bi-info-circle me-1"></i>
                  Selisih, total pesanan, dan revenue akan dihitung ulang berdasarkan kas dan waktu shift.
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-secondary" :disabled="saving" @click="editingShift = null">Batal</button>
            <button class="btn btn-sm btn-primary" :disabled="saving" @click="saveEdit">
              {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah, formatDate, toJakartaDatetimeLocal, jakartaDatetimeLocalToISO } from '~/utils/format'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()
const toast = useToast()

const rows = ref([])
const loading = ref(false)
const currentPage = ref(1)
const meta = ref({ total: 0, last_page: 1 })
const staffList = ref([])
const selectedStaff = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const editingShift = ref(null)
const saving = ref(false)
const editForm = ref({
  shift_date: '',
  open_time: '',
  close_time: '',
  opening_cash: 0,
  closing_cash: null,
  status: 'OPEN',
  notes: '',
})

const formatTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const toDateInput = (dt) => {
  if (!dt) return ''
  const d = new Date(dt)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

const openEdit = (row) => {
  editingShift.value = row
  editForm.value = {
    shift_date: toDateInput(row.shift_date),
    open_time: toJakartaDatetimeLocal(row.open_time),
    close_time: toJakartaDatetimeLocal(row.close_time),
    opening_cash: row.opening_cash ?? 0,
    closing_cash: row.closing_cash ?? null,
    status: row.status,
    notes: row.notes || '',
  }
}

const saveEdit = async () => {
  if (!editingShift.value) return
  saving.value = true
  try {
    const payload = {
      shift_date: editForm.value.shift_date || undefined,
      open_time: editForm.value.open_time ? jakartaDatetimeLocalToISO(editForm.value.open_time) : undefined,
      close_time: editForm.value.close_time ? jakartaDatetimeLocalToISO(editForm.value.close_time) : null,
      opening_cash: editForm.value.opening_cash ?? 0,
      closing_cash: editForm.value.closing_cash === '' || editForm.value.closing_cash === null
        ? null
        : Number(editForm.value.closing_cash),
      status: editForm.value.status,
      notes: editForm.value.notes,
    }
    await store.updateShiftAdmin(editingShift.value.id, payload)
    toast.success('Shift berhasil diperbarui')
    editingShift.value = null
    fetchData()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menyimpan shift')
  } finally {
    saving.value = false
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: currentPage.value, per_page: 20 }
    if (selectedStaff.value) params.staff_id = selectedStaff.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    const result = await store.fetchShiftHistoryAdmin(params)
    rows.value = result.content
    meta.value = result.meta
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

onMounted(async () => {
  try {
    const staffRes = await store.fetchStaffList()
    staffList.value = staffRes.content
  } catch (err) { console.error(err) }
  fetchData()
})
</script>
