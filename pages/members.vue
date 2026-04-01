<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <input v-model="search" class="form-control fz-13" placeholder="Cari nama/no HP..." style="width: 250px" @input="debouncedFetch" />
      <button class="btn btn-primary btn-sm" @click="openForm()">
        <i class="bi bi-plus-lg me-1"></i> Tambah Member
      </button>
    </div>

    <!-- Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Nama</th>
          <th>No. HP</th>
          <th>Total Pesanan</th>
          <th>Total Belanja</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="7" class="text-center py-4 text-muted">Memuat...</td></tr>
        <tr v-else-if="rows.length === 0"><td colspan="7" class="text-center py-4 text-muted">Tidak ada data</td></tr>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ (currentPage - 1) * 20 + idx + 1 }}</td>
          <td class="fw-600">{{ row.name || '-' }}</td>
          <td>{{ row.phone }}</td>
          <td class="fw-600">{{ row.total_orders }}</td>
          <td class="fw-600 text-primary">{{ formatRupiah(row.total_spent) }}</td>
          <td>
            <span :class="row.is_active ? 'badge bg-success' : 'badge bg-secondary'">
              {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-info me-1" @click="viewHistory(row)" title="Riwayat Pesanan">
              <i class="bi bi-clock-history"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary me-1" @click="openForm(row)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(row)">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="d-flex justify-content-between align-items-center mt-3">
      <span class="fz-13 text-muted">Total: {{ meta.total }} member</span>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li v-for="p in meta.last_page" :key="p" class="page-item" :class="{ active: p === currentPage }">
            <button class="page-link" @click="currentPage = p; fetchData()">{{ p }}</button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">{{ editing ? 'Edit' : 'Tambah' }} Member</h5>
            <button class="btn-close" @click="showForm = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">No. HP</label>
              <input v-model="form.phone" class="form-control" placeholder="08xxxxxxxxxx" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-600 fz-14">Nama (opsional)</label>
              <input v-model="form.name" class="form-control" placeholder="Nama pembeli" />
            </div>
            <div v-if="formError" class="alert alert-danger fz-13 py-2">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary btn-sm" @click="showForm = false">Batal</button>
            <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveForm">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order History Modal -->
    <div v-if="historyMember" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">
              Riwayat Pesanan - {{ historyMember.name || historyMember.phone }}
            </h5>
            <button class="btn-close" @click="historyMember = null"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3 mb-3">
              <div class="col-4">
                <div class="stat-card text-center">
                  <div class="fw-700 fz-20">{{ historyMember.total_orders }}</div>
                  <div class="fz-12 text-muted">Total Pesanan</div>
                </div>
              </div>
              <div class="col-4">
                <div class="stat-card text-center">
                  <div class="fw-700 fz-20 text-primary">{{ formatRupiah(historyMember.total_spent) }}</div>
                  <div class="fz-12 text-muted">Total Belanja</div>
                </div>
              </div>
              <div class="col-4">
                <div class="stat-card text-center">
                  <div class="fw-700 fz-20">{{ historyMember.phone }}</div>
                  <div class="fz-12 text-muted">No. HP</div>
                </div>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Kasir</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="historyOrders.length === 0">
                  <td colspan="5" class="text-center py-3 text-muted">Belum ada pesanan</td>
                </tr>
                <tr v-for="order in historyOrders" :key="order.id">
                  <td class="fz-13 fw-600">{{ order.order_number }}</td>
                  <td>{{ order.staff?.name }}</td>
                  <td>{{ order.order_items?.length }} item</td>
                  <td class="fw-600 text-primary">{{ formatRupiah(order.total_price) }}</td>
                  <td class="fz-13">{{ formatDate(order.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deletingRow" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center py-4">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 40px"></i>
            <p class="mt-3 fw-600">Hapus member "{{ deletingRow.name || deletingRow.phone }}"?</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button class="btn btn-outline-secondary btn-sm" @click="deletingRow = null">Batal</button>
            <button class="btn btn-danger btn-sm" @click="doDelete">Hapus</button>
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

const rows = ref([])
const loading = ref(false)
const currentPage = ref(1)
const meta = ref({ total: 0, last_page: 1 })
const search = ref('')
const showForm = ref(false)
const editing = ref(null)
const form = ref({ phone: '', name: '' })
const formError = ref('')
const saving = ref(false)
const deletingRow = ref(null)
const historyMember = ref(null)
const historyOrders = ref([])

let debounceTimer = null

const fetchData = async () => {
  loading.value = true
  try {
    const result = await store.fetchMembers({ page: currentPage.value, per_page: 20, search: search.value || undefined })
    rows.value = result.content
    meta.value = result.meta
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { currentPage.value = 1; fetchData() }, 300)
}

const openForm = (row = null) => {
  editing.value = row
  form.value = row ? { phone: row.phone, name: row.name || '' } : { phone: '', name: '' }
  formError.value = ''
  showForm.value = true
}

const saveForm = async () => {
  saving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      await store.updateMember(editing.value.id, form.value)
    } else {
      await store.createMember(form.value)
    }
    showForm.value = false
    fetchData()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan'
  } finally { saving.value = false }
}

const viewHistory = async (row) => {
  historyMember.value = row
  try {
    const result = await store.fetchMemberOrders(row.id, { per_page: 50 })
    historyOrders.value = result.content.orders
  } catch (err) {
    console.error(err)
    historyOrders.value = []
  }
}

const confirmDelete = (row) => { deletingRow.value = row }
const doDelete = async () => {
  try { await store.deleteMember(deletingRow.value.id); deletingRow.value = null; fetchData() }
  catch (err) { console.error(err) }
}

onMounted(fetchData)
</script>
