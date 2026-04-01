<template>
  <div>
    <!-- Active Shift Card -->
    <div class="order-card mb-4">
      <div class="card-title">Shift Saat Ini</div>
      <div v-if="activeShift" class="row g-3">
        <div class="col-md-3">
          <div class="stat-card text-center" style="background: #f0fdf4">
            <div class="fw-700 fz-18 text-success">AKTIF</div>
            <div class="fz-12 text-muted">Status Shift</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card text-center">
            <div class="fw-700 fz-18">{{ formatRupiah(activeShift.opening_cash) }}</div>
            <div class="fz-12 text-muted">Kas Awal</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card text-center">
            <div class="fw-700 fz-18">{{ formatTime(activeShift.open_time) }}</div>
            <div class="fz-12 text-muted">Waktu Buka</div>
          </div>
        </div>
        <div class="col-md-3 d-flex align-items-center justify-content-center">
          <button class="btn btn-danger btn-sm" @click="showCloseModal = true">
            <i class="bi bi-stop-circle me-1"></i> Tutup Shift
          </button>
        </div>
      </div>
      <div v-else class="text-center py-4">
        <p class="text-muted mb-3">Belum ada shift aktif</p>
        <button class="btn btn-success" @click="showOpenModal = true">
          <i class="bi bi-play-circle me-1"></i> Buka Shift Baru
        </button>
      </div>
    </div>

    <!-- Shift History -->
    <div class="order-card">
      <div class="card-title">Riwayat Shift</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Buka</th>
            <th>Tutup</th>
            <th>Kas Awal</th>
            <th>Kas Akhir</th>
            <th>Selisih</th>
            <th>Pesanan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="text-center py-4 text-muted">Memuat...</td></tr>
          <tr v-else-if="history.length === 0"><td colspan="8" class="text-center py-4 text-muted">Belum ada riwayat shift</td></tr>
          <tr v-for="s in history" :key="s.id">
            <td class="fz-13">{{ formatDate(s.shift_date) }}</td>
            <td class="fz-13">{{ formatTime(s.open_time) }}</td>
            <td class="fz-13">{{ s.close_time ? formatTime(s.close_time) : '-' }}</td>
            <td class="fw-600">{{ formatRupiah(s.opening_cash) }}</td>
            <td class="fw-600">{{ s.closing_cash !== null ? formatRupiah(s.closing_cash) : '-' }}</td>
            <td>
              <span v-if="s.cash_difference !== null" :class="s.cash_difference >= 0 ? 'text-success' : 'text-danger'" class="fw-600">
                {{ s.cash_difference >= 0 ? '+' : '' }}{{ formatRupiah(s.cash_difference) }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="fw-600">{{ s.total_orders }}</td>
            <td>
              <span :class="s.status === 'OPEN' ? 'badge bg-success' : 'badge bg-secondary'">
                {{ s.status === 'OPEN' ? 'Buka' : 'Tutup' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Open Shift Modal -->
    <div v-if="showOpenModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">Buka Shift</h5>
            <button class="btn-close" @click="showOpenModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Kas Awal (Rp)</label>
              <input v-model.number="openForm.opening_cash" type="number" class="form-control" placeholder="0" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Catatan (opsional)</label>
              <textarea v-model="openForm.notes" class="form-control" rows="2"></textarea>
            </div>
            <div v-if="formError" class="alert alert-danger fz-13 py-2">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary btn-sm" @click="showOpenModal = false">Batal</button>
            <button class="btn btn-success btn-sm" :disabled="saving" @click="doOpenShift">
              {{ saving ? 'Memproses...' : 'Buka Shift' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Close Shift Modal -->
    <div v-if="showCloseModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">Tutup Shift</h5>
            <button class="btn-close" @click="showCloseModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Kas Akhir (Rp)</label>
              <input v-model.number="closeForm.closing_cash" type="number" class="form-control" placeholder="Hitung kas di laci" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Catatan (opsional)</label>
              <textarea v-model="closeForm.notes" class="form-control" rows="2"></textarea>
            </div>
            <div v-if="formError" class="alert alert-danger fz-13 py-2">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary btn-sm" @click="showCloseModal = false">Batal</button>
            <button class="btn btn-danger btn-sm" :disabled="saving" @click="doCloseShift">
              {{ saving ? 'Memproses...' : 'Tutup Shift' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah, formatDate } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()

const activeShift = ref(null)
const history = ref([])
const loading = ref(false)
const saving = ref(false)
const formError = ref('')
const showOpenModal = ref(false)
const showCloseModal = ref(false)
const openForm = ref({ opening_cash: 0, notes: '' })
const closeForm = ref({ closing_cash: 0, notes: '' })

const formatTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const fetchData = async () => {
  loading.value = true
  try {
    const [activeRes, historyRes] = await Promise.all([
      store.fetchActiveShift(),
      store.fetchShiftHistory(),
    ])
    activeShift.value = activeRes.content
    history.value = historyRes.content
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

const doOpenShift = async () => {
  saving.value = true
  formError.value = ''
  try {
    await store.openShift(openForm.value)
    showOpenModal.value = false
    openForm.value = { opening_cash: 0, notes: '' }
    fetchData()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal membuka shift'
  } finally { saving.value = false }
}

const doCloseShift = async () => {
  saving.value = true
  formError.value = ''
  try {
    await store.closeShift(closeForm.value)
    showCloseModal.value = false
    closeForm.value = { closing_cash: 0, notes: '' }
    fetchData()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menutup shift'
  } finally { saving.value = false }
}

onMounted(fetchData)
</script>
