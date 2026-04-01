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
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="11" class="text-center py-4 text-muted">Memuat...</td></tr>
        <tr v-else-if="rows.length === 0"><td colspan="11" class="text-center py-4 text-muted">Tidak ada data</td></tr>
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
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah, formatDate } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()

const rows = ref([])
const loading = ref(false)
const currentPage = ref(1)
const meta = ref({ total: 0, last_page: 1 })
const staffList = ref([])
const selectedStaff = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const formatTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
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
