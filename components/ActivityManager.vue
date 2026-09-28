<template>
  <div>
    <!-- Filters -->
    <div class="order-card mb-4">
      <div class="d-flex gap-2 align-items-end flex-wrap">
        <div v-if="isAdmin">
          <label class="form-label fw-600 fz-14 mb-1">Staff</label>
          <select v-model="selectedStaff" class="form-select fz-13" style="width: 200px" @change="fetchData">
            <option value="">Semua Staff</option>
            <option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label fw-600 fz-14 mb-1">Dari</label>
          <input v-model="dateFrom" type="date" class="form-control fz-13" style="width: 160px" @change="fetchData" />
        </div>
        <div>
          <label class="form-label fw-600 fz-14 mb-1">Sampai</label>
          <input v-model="dateTo" type="date" class="form-control fz-13" style="width: 160px" @change="fetchData" />
        </div>
        <div v-if="!isAdmin">
          <label class="form-label fw-600 fz-14 mb-1">Cari</label>
          <input v-model="search" class="form-control fz-13" style="width: 200px" placeholder="kegiatan..." @keyup.enter="fetchData" />
        </div>
        <button class="btn btn-outline-secondary btn-sm" @click="setToday">Hari Ini</button>
      </div>
    </div>

    <!-- Input form (staff only) -->
    <div v-if="!isAdmin" class="order-card mb-4">
      <div class="card-title">{{ editingId ? 'Ubah Kegiatan' : 'Input Kegiatan' }}</div>
      <div class="row g-3 align-items-end">
        <div class="col-md-5">
          <label class="form-label fw-600 fz-14">Kegiatan</label>
          <input v-model="form.activity" class="form-control" placeholder="cth: memasak makroni basah 2 cangkir" />
        </div>
        <div class="col-md-3">
          <label class="form-label fw-600 fz-14">Tanggal</label>
          <input v-model="form.activity_date" type="date" class="form-control" />
        </div>
        <div class="col-md-2">
          <label class="form-label fw-600 fz-14">Keterangan</label>
          <input v-model="form.notes" class="form-control" placeholder="opsional" />
        </div>
        <div class="col-md-2 d-flex gap-2">
          <button class="btn btn-primary w-100" :disabled="!form.activity || saving" @click="save">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            {{ editingId ? 'Update' : 'Simpan' }}
          </button>
          <button v-if="editingId" class="btn btn-outline-secondary" @click="cancelEdit">Batal</button>
        </div>
      </div>
      <div v-if="formError" class="alert alert-danger fz-13 py-2 mt-2">{{ formError }}</div>
    </div>

    <!-- List -->
    <div class="order-card">
      <div class="card-title">Riwayat Kegiatan</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th v-if="isAdmin">Staff</th>
            <th>Kegiatan</th>
            <th>Keterangan</th>
            <th v-if="!isAdmin">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td :colspan="colspan" class="text-center py-4 text-muted">Memuat...</td></tr>
          <tr v-else-if="activities.length === 0"><td :colspan="colspan" class="text-center py-4 text-muted">Belum ada data</td></tr>
          <tr v-for="(a, i) in activities" :key="a.id">
            <td>{{ (currentPage - 1) * 50 + i + 1 }}</td>
            <td class="fz-13">{{ prettyDate(a.activity_date) }}</td>
            <td v-if="isAdmin" class="fw-600">{{ a.staff?.name || '-' }}</td>
            <td>{{ a.activity }}</td>
            <td class="fz-13">{{ a.notes || '-' }}</td>
            <td v-if="!isAdmin">
              <button class="btn btn-sm btn-outline-primary me-1" @click="startEdit(a)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" @click="deleting = a"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>

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

    <!-- Delete Confirm -->
    <div v-if="deleting" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center py-4">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 40px"></i>
            <p class="mt-3 fw-600">Hapus kegiatan ini?</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button class="btn btn-outline-secondary btn-sm" @click="deleting = null">Batal</button>
            <button class="btn btn-danger btn-sm" @click="doDelete">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { todayJakarta } from '~/utils/format'

const props = defineProps({ mode: { type: String, default: 'staff' } })
const isAdmin = computed(() => props.mode === 'admin')
const colspan = computed(() => (isAdmin.value ? 5 : 5))

const store = useMainStore()
const activities = ref([])
const staffList = ref([])
const meta = ref({ total: 0, last_page: 1 })
const loading = ref(false)
const saving = ref(false)
const formError = ref('')
const currentPage = ref(1)
const selectedStaff = ref('')
const dateFrom = ref(todayJakarta())
const dateTo = ref(todayJakarta())
const search = ref('')
const editingId = ref(null)
const deleting = ref(null)
const form = ref({ activity: '', activity_date: todayJakarta(), notes: '' })

const prettyDate = (d) => {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  const [y, m, dd] = s.split('-')
  return `${dd}/${m}/${y}`
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: currentPage.value, per_page: 50, date_from: dateFrom.value, date_to: dateTo.value }
    if (isAdmin.value) {
      if (selectedStaff.value) params.staff_id = selectedStaff.value
      const res = await store.fetchActivitiesAdmin(params)
      activities.value = res.content
      meta.value = res.meta
    } else {
      if (search.value) params.search = search.value
      const res = await store.fetchActivities(params)
      activities.value = res.content
      meta.value = res.meta
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const setToday = () => {
  dateFrom.value = todayJakarta()
  dateTo.value = todayJakarta()
  currentPage.value = 1
  fetchData()
}

const save = async () => {
  saving.value = true
  formError.value = ''
  try {
    if (editingId.value) {
      await store.updateActivity(editingId.value, form.value)
    } else {
      await store.createActivity(form.value)
    }
    cancelEdit()
    fetchData()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}

const startEdit = (a) => {
  editingId.value = a.id
  form.value = { activity: a.activity, activity_date: String(a.activity_date).slice(0, 10), notes: a.notes || '' }
}

const cancelEdit = () => {
  editingId.value = null
  form.value = { activity: '', activity_date: todayJakarta(), notes: '' }
}

const doDelete = async () => {
  try {
    await store.deleteActivity(deleting.value.id)
    deleting.value = null
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  if (isAdmin.value) {
    try {
      const res = await store.fetchStaffList()
      staffList.value = res.content || []
    } catch (err) {
      console.error(err)
    }
  }
  fetchData()
})
</script>
