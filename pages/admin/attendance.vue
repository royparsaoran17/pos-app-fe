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

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th class="fz-13">No</th>
              <th class="fz-13">Staff</th>
              <th class="fz-13">Tanggal</th>
              <th class="fz-13">Jam Login</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in rows" :key="row.id">
              <td class="fz-13">{{ idx + 1 }}</td>
              <td class="fz-13 fw-medium">{{ row.staff?.name }}</td>
              <td class="fz-13">{{ formatDateShort(row.login_date) }}</td>
              <td class="fz-13">{{ formatTime(row.login_at) }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="4" class="text-center text-muted py-4">Belum ada data absensi</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { todayJakarta } from '~/utils/format'
definePageMeta({ layout: 'dashboard' })

const store = useMainStore()
const rows = ref([])
const staffList = ref([])
const filters = ref({ date_from: todayJakarta(), date_to: todayJakarta(), staff_id: '' })

const formatDateShort = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
const formatTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

const loadData = async () => {
  try {
    const params = { ...filters.value }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const res = await store.fetchAttendance(params)
    rows.value = res.content || []
  } catch (e) { console.error(e) }
}

const loadStaff = async () => {
  try { staffList.value = (await store.fetchStaffList()).content || [] } catch (e) { console.error(e) }
}

onMounted(() => { loadStaff(); loadData() })
</script>
