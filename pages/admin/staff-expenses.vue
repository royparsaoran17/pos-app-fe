<template>
  <div class="p-4">
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label fz-13">Staff</label>
            <select v-model="filters.staff_id" class="form-select form-select-sm" @change="loadData">
              <option value="">Semua Staff</option>
              <option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label fz-13">Kategori</label>
            <select v-model="filters.category_id" class="form-select form-select-sm" @change="loadData">
              <option value="">Semua</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label fz-13">Dari Tanggal</label>
            <input v-model="filters.date_from" type="date" class="form-control form-control-sm" @change="loadData" />
          </div>
          <div class="col-md-3">
            <label class="form-label fz-13">Sampai Tanggal</label>
            <input v-model="filters.date_to" type="date" class="form-control form-control-sm" @change="loadData" />
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card bg-light">
          <div class="card-body text-center">
            <div class="fz-13 text-muted">Total Pengeluaran Staff</div>
            <div class="fw-bold fz-18">Rp {{ (meta.total_amount || 0).toLocaleString('id-ID') }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-light">
          <div class="card-body text-center">
            <div class="fz-13 text-muted">Jumlah Transaksi</div>
            <div class="fw-bold fz-18">{{ meta.total || 0 }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th class="fz-13">Tanggal</th>
              <th class="fz-13">Staff</th>
              <th class="fz-13">Kategori</th>
              <th class="fz-13">Deskripsi</th>
              <th class="fz-13 text-end">Jumlah</th>
              <th class="fz-13">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td class="fz-13">{{ formatDate(row.expense_date) }}</td>
              <td class="fz-13 fw-medium">{{ row.staff?.name }}</td>
              <td class="fz-13"><span class="badge bg-secondary">{{ row.category?.name }}</span></td>
              <td class="fz-13">{{ row.description }}</td>
              <td class="fz-13 text-end fw-bold">Rp {{ row.amount.toLocaleString('id-ID') }}</td>
              <td class="fz-13 text-muted">{{ row.notes || '-' }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="text-center text-muted py-4">Belum ada data</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
const categories = ref([])
const filters = ref({ page: 1, staff_id: '', category_id: '', date_from: todayJakarta(), date_to: todayJakarta() })

const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const loadData = async () => {
  try {
    const params = { ...filters.value }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const res = await store.fetchStaffExpensesAdmin(params)
    rows.value = res.content || []
    meta.value = res.meta || {}
  } catch (e) { console.error(e) }
}

const loadStaff = async () => {
  try { staffList.value = (await store.fetchStaffList()).content || [] } catch (e) { console.error(e) }
}

const loadCategories = async () => {
  try { categories.value = (await store.fetchStaffExpenseCategories()).content || [] } catch (e) { console.error(e) }
}

onMounted(() => { loadStaff(); loadCategories(); loadData() })
</script>
