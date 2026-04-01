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
          <th>Menu</th>
          <th>Jumlah</th>
          <th>Catatan</th>
          <th>Tanggal</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="6" class="text-center py-4 text-muted">Memuat...</td></tr>
        <tr v-else-if="rows.length === 0"><td colspan="6" class="text-center py-4 text-muted">Tidak ada data</td></tr>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ idx + 1 }}</td>
          <td class="fw-600">{{ row.staff?.name }}</td>
          <td class="fw-600">{{ row.menu_size_key }}</td>
          <td class="fw-700 fz-16 text-primary">{{ row.quantity }}</td>
          <td class="fz-13">{{ row.notes || '-' }}</td>
          <td class="fz-13">{{ formatDateTime(row.created_at) }}</td>
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

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: currentPage.value, per_page: 20 }
    if (selectedStaff.value) params.staff_id = selectedStaff.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    const result = await store.fetchPackagingAdmin(params)
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
