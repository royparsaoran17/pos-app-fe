<template>
  <div class="p-4">
    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
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
          <div class="col-md-3">
            <button class="btn btn-primary btn-sm w-100" @click="showForm = true; resetForm()">
              <i class="bi bi-plus"></i> Tambah Pengeluaran
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card bg-light">
          <div class="card-body text-center">
            <div class="fz-13 text-muted">Total Pengeluaran</div>
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

    <!-- Table -->
    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th class="fz-13">Tanggal</th>
              <th class="fz-13">Kategori</th>
              <th class="fz-13">Deskripsi</th>
              <th class="fz-13 text-end">Jumlah</th>
              <th class="fz-13">Catatan</th>
              <th class="fz-13 text-center" style="width:100px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td class="fz-13">{{ formatDate(row.expense_date) }}</td>
              <td class="fz-13"><span class="badge bg-secondary">{{ row.category?.name }}</span></td>
              <td class="fz-13">{{ row.description }}</td>
              <td class="fz-13 text-end fw-bold">Rp {{ row.amount.toLocaleString('id-ID') }}</td>
              <td class="fz-13 text-muted">{{ row.notes || '-' }}</td>
              <td class="text-center">
                <button class="btn btn-sm btn-outline-primary me-1" @click="editRow(row)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteRow(row.id)">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="text-center text-muted py-4">Belum ada data pengeluaran</td>
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

    <!-- Form Modal -->
    <div v-if="showForm" class="modal d-block" style="background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fz-16">{{ form.id ? 'Edit' : 'Tambah' }} Pengeluaran</h5>
            <button class="btn-close" @click="showForm = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fz-13">Kategori <span class="text-danger">*</span></label>
              <select v-model="form.category_id" class="form-select form-select-sm">
                <option value="">Pilih kategori</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fz-13">Deskripsi <span class="text-danger">*</span></label>
              <input v-model="form.description" class="form-control form-control-sm" placeholder="Keterangan pengeluaran" />
            </div>
            <div class="mb-3">
              <label class="form-label fz-13">Jumlah (Rp) <span class="text-danger">*</span></label>
              <input v-model.number="form.amount" type="number" class="form-control form-control-sm" placeholder="0" />
            </div>
            <div class="mb-3">
              <label class="form-label fz-13">Tanggal</label>
              <input v-model="form.expense_date" type="date" class="form-control form-control-sm" />
            </div>
            <div class="mb-3">
              <label class="form-label fz-13">Catatan</label>
              <textarea v-model="form.notes" class="form-control form-control-sm" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-secondary" @click="showForm = false">Batal</button>
            <button class="btn btn-sm btn-primary" :disabled="saving" @click="saveForm">
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
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
const categories = ref([])
const meta = ref({})
const showForm = ref(false)
const saving = ref(false)
const filters = ref({ page: 1, per_page: 20, category_id: '', date_from: todayJakarta(), date_to: todayJakarta() })
const form = ref({ id: null, category_id: '', description: '', amount: 0, expense_date: todayJakarta(), notes: '' })

const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const resetForm = () => {
  form.value = { id: null, category_id: '', description: '', amount: 0, expense_date: todayJakarta(), notes: '' }
}

const loadData = async () => {
  try {
    const params = { ...filters.value }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const res = await store.fetchStaffExpenses(params)
    rows.value = res.content
    meta.value = res.meta || {}
  } catch (e) { console.error(e) }
}

const loadCategories = async () => {
  try {
    const res = await store.fetchStaffExpenseCategories()
    categories.value = res.content
  } catch (e) { console.error(e) }
}

const editRow = (row) => {
  form.value = {
    id: row.id,
    category_id: row.category_id,
    description: row.description,
    amount: row.amount,
    expense_date: row.expense_date ? row.expense_date.slice(0, 10) : '',
    notes: row.notes || '',
  }
  showForm.value = true
}

const saveForm = async () => {
  if (!form.value.category_id || !form.value.description || !form.value.amount) return alert('Lengkapi data wajib')
  saving.value = true
  try {
    if (form.value.id) {
      await store.updateStaffExpense(form.value.id, form.value)
    } else {
      await store.createStaffExpense(form.value)
    }
    showForm.value = false
    loadData()
  } catch (e) { alert(e.response?.data?.message || 'Gagal menyimpan') }
  saving.value = false
}

const deleteRow = async (id) => {
  if (!confirm('Hapus pengeluaran ini?')) return
  try {
    await store.deleteStaffExpense(id)
    loadData()
  } catch (e) { alert('Gagal menghapus') }
}

onMounted(() => { loadCategories(); loadData() })
</script>
