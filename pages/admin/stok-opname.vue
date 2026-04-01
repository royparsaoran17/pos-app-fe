<template>
  <div class="p-4">
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label fz-13">Dari Tanggal</label>
            <input v-model="filters.date_from" type="date" class="form-control form-control-sm" @change="loadData" />
          </div>
          <div class="col-md-3">
            <label class="form-label fz-13">Sampai Tanggal</label>
            <input v-model="filters.date_to" type="date" class="form-control form-control-sm" @change="loadData" />
          </div>
          <div class="col-md-3">
            <label class="form-label fz-13">Staff</label>
            <select v-model="filters.staff_id" class="form-select form-select-sm" @change="loadData">
              <option value="">Semua Staff</option>
              <option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!rows.length" class="text-center text-muted py-5">Belum ada data stok opname</div>

    <div v-for="row in rows" :key="row.id" class="card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>{{ row.staff?.name }}</strong>
          <span class="text-muted ms-2 fz-13">{{ formatDate(row.opname_date) }}</span>
        </div>
      </div>
      <div class="card-body p-0">
        <table class="table table-sm mb-0">
          <thead>
            <tr>
              <th class="fz-12">Topping</th>
              <th class="fz-12 text-end">Berat (KG)</th>
              <th class="fz-12">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in row.items" :key="item.id">
              <td class="fz-12">{{ item.topping?.name }}</td>
              <td class="fz-12 text-end fw-bold">{{ item.weight_kg }} kg</td>
              <td class="fz-12 text-muted">{{ item.notes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="d-flex justify-content-center mt-3">
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li v-for="p in meta.last_page" :key="p" class="page-item" :class="{ active: p === meta.current_page }">
            <button class="page-link" @click="filters.page = p; loadData()">{{ p }}</button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { todayJakarta } from '~/utils/format'
definePageMeta({ layout: 'dashboard' })

const store = useMainStore()
const rows = ref([])
const meta = ref({})
const staffList = ref([])
const filters = ref({ page: 1, date_from: todayJakarta(), date_to: todayJakarta(), staff_id: '' })

const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const loadData = async () => {
  try {
    const params = { ...filters.value }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const res = await store.fetchStockOpnameAdmin(params)
    rows.value = res.content || []
    meta.value = res.meta || {}
  } catch (e) { console.error(e) }
}

const loadStaff = async () => {
  try {
    const res = await store.fetchStaffList()
    staffList.value = res.content || []
  } catch (e) { console.error(e) }
}

onMounted(() => { loadStaff(); loadData() })
</script>
