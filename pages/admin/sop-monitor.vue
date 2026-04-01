<template>
  <div class="p-4">
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label fz-13">Tanggal</label>
            <input v-model="filters.date" type="date" class="form-control form-control-sm" @change="loadData" />
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

    <div v-if="!rows.length" class="text-center text-muted py-5">Belum ada data checklist untuk filter ini</div>

    <div v-for="row in rows" :key="row.id" class="card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>{{ row.staff?.name }}</strong>
          <span class="text-muted ms-2 fz-13">{{ formatDate(row.shift_date) }}</span>
        </div>
        <div>
          <span class="badge" :class="progressClass(row)">{{ completedCount(row) }}/{{ row.items?.length || 0 }} selesai</span>
        </div>
      </div>
      <div class="card-body p-0">
        <table class="table table-sm mb-0">
          <thead>
            <tr>
              <th class="fz-12" style="width:50px">Status</th>
              <th class="fz-12">Kategori</th>
              <th class="fz-12">Tugas</th>
              <th class="fz-12">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in row.items" :key="item.id">
              <td class="text-center">
                <i class="bi" :class="item.is_checked ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
              </td>
              <td class="fz-12"><span class="badge bg-secondary">{{ item.task?.category }}</span></td>
              <td class="fz-12">{{ item.task?.description }}</td>
              <td class="fz-12 text-muted">{{ item.notes || '-' }}</td>
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
const filters = ref({ date: todayJakarta(), staff_id: '' })

const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
const completedCount = (row) => (row.items || []).filter(i => i.is_checked).length
const progressClass = (row) => {
  const total = row.items?.length || 0
  const done = completedCount(row)
  if (done === total) return 'bg-success'
  if (done > total / 2) return 'bg-warning text-dark'
  return 'bg-danger'
}

const loadData = async () => {
  try {
    const params = { date: filters.value.date }
    if (filters.value.staff_id) params.staff_id = filters.value.staff_id
    const res = await store.fetchSopChecklistAdmin(params)
    rows.value = res.content || []
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
