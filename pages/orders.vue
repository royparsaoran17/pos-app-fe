<template>
  <div>
    <!-- Filters -->
    <div class="order-card">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label fz-13 fw-600">Cari No. Order</label>
          <input v-model="search" class="form-control fz-13" placeholder="Cari..." @input="debouncedFetch" />
        </div>
        <div class="col-md-2">
          <label class="form-label fz-13 fw-600">Pembayaran</label>
          <select v-model="filterPayment" class="form-select fz-13" @change="fetchData">
            <option value="">Semua</option>
            <option value="CASH">Cash</option>
            <option value="QRIS">QRIS</option>
            <option value="PROMO">Promo</option>
            <option value="GOJEK">Gojek</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label fz-13 fw-600">Dari Tanggal</label>
          <input v-model="dateFrom" type="date" class="form-control fz-13" @change="fetchData" />
        </div>
        <div class="col-md-2">
          <label class="form-label fz-13 fw-600">Sampai Tanggal</label>
          <input v-model="dateTo" type="date" class="form-control fz-13" @change="fetchData" />
        </div>
        <div class="col-md-3 text-end">
          <button class="btn btn-outline-secondary btn-sm" @click="resetFilters">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-3">
      <table class="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Antrian</th>
            <th>No. Order</th>
            <th>Customer</th>
            <th>Kasir</th>
            <th>Member</th>
            <th>Item</th>
            <th>Total</th>
            <th>Promo</th>
            <th>Pembayaran</th>
            <th>Tanggal</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="12" class="text-center py-4 text-muted">Memuat data...</td>
          </tr>
          <tr v-else-if="orders.length === 0">
            <td colspan="12" class="text-center py-4 text-muted">Tidak ada data pesanan</td>
          </tr>
          <tr v-for="(order, idx) in orders" :key="order.id">
            <td>{{ (currentPage - 1) * perPage + idx + 1 }}</td>
            <td class="text-center"><span class="badge bg-primary fw-bold">{{ order.queue_number || '-' }}</span></td>
            <td class="fw-600 fz-13">{{ order.order_number }}</td>
            <td class="fw-600">{{ order.customer_name || '-' }}</td>
            <td>{{ order.staff?.name }}</td>
            <td class="fz-13">
              <span v-if="order.member">{{ order.member.name || order.member.phone }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>{{ order.order_items?.length }} item</td>
            <td class="fw-600 text-primary">{{ formatRupiah(order.total_price) }}</td>
            <td>
              <span v-if="order.promo" class="badge bg-info fz-12">{{ order.promo.code }}</span>
              <span v-else class="text-muted fz-12">-</span>
            </td>
            <td>
              <span :class="'badge-payment badge-' + order.payment_method.toLowerCase()">
                {{ order.payment_method }}
              </span>
            </td>
            <td class="fz-13">{{ formatDate(order.created_at) }}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" @click="viewOrder(order)">
                <i class="bi bi-eye"></i>
              </button>
              <button v-if="store.isSuperAdmin" class="btn btn-sm btn-outline-warning me-1" @click="openEdit(order)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-success me-1" @click="printOrder(order)">
                <i class="bi bi-printer"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="d-flex justify-content-between align-items-center mt-3">
      <span class="fz-13 text-muted">
        Total: {{ meta.total }} pesanan
      </span>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage <= 1 }">
            <button class="page-link" @click="goToPage(currentPage - 1)">Prev</button>
          </li>
          <li
            v-for="p in meta.last_page"
            :key="p"
            class="page-item"
            :class="{ active: p === currentPage }"
          >
            <button class="page-link" @click="goToPage(p)">{{ p }}</button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage >= meta.last_page }">
            <button class="page-link" @click="goToPage(currentPage + 1)">Next</button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedOrder" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">Detail Pesanan</h5>
            <button class="btn-close" @click="selectedOrder = null"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2"><strong>No. Order:</strong> {{ selectedOrder.order_number }}</div>
            <div v-if="selectedOrder.customer_name" class="mb-2"><strong>Customer:</strong> {{ selectedOrder.customer_name }}</div>
            <div v-if="selectedOrder.acquisition_channel" class="mb-2"><strong>Tau Dari:</strong> <span class="badge bg-info fz-11">{{ selectedOrder.acquisition_channel }}</span></div>
            <div class="mb-2"><strong>Kasir:</strong> {{ selectedOrder.staff?.name }}</div>
            <div v-if="selectedOrder.member" class="mb-2"><strong>Member:</strong> {{ selectedOrder.member.name || selectedOrder.member.phone }}</div>
            <div class="mb-2"><strong>Pembayaran:</strong> {{ selectedOrder.payment_method }}</div>
            <div v-if="selectedOrder.promo" class="mb-2"><strong>Promo:</strong> {{ selectedOrder.promo.code }} ({{ selectedOrder.promo.name }})</div>
            <div v-if="selectedOrder.discount_amount > 0" class="mb-2"><strong>Diskon:</strong> -{{ formatRupiah(selectedOrder.discount_amount) }}</div>
            <div class="mb-3"><strong>Total:</strong> {{ formatRupiah(selectedOrder.total_price) }}</div>

            <h6 class="fw-600">Item Pesanan:</h6>
            <div v-for="(item, idx) in selectedOrder.order_items" :key="idx" class="order-summary-item">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="item-number">{{ idx + 1 }}</span>
                <span class="fw-600">{{ getSizeLabel(item.menu_size_key) }}</span>
                <span class="text-primary fz-13 fw-600">{{ formatRupiah(item.price) }}</span>
              </div>
              <div class="fz-12 text-muted">
                <div><strong>Topping:</strong> {{ item.toppings?.map(t => t.topping?.name).join(', ') || '-' }}</div>
                <div><strong>Bumbu:</strong> {{ item.bumbu }}</div>
                <div><strong>Level Pedas:</strong> {{ item.spicy_level }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Order Modal (Admin) -->
    <div v-if="editingOrder" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700">Edit Pesanan - {{ editingOrder.order_number }}</h5>
            <button class="btn-close" @click="editingOrder = null"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label fz-13 fw-600">Metode Pembayaran</label>
                <select v-model="editForm.payment_method" class="form-select form-select-sm">
                  <option value="CASH">Cash</option>
                  <option value="QRIS">QRIS</option>
                  <option value="PROMO">Promo</option>
                  <option value="GOJEK">Gojek</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fz-13 fw-600">Catatan</label>
                <input v-model="editForm.notes" class="form-control form-control-sm" />
              </div>
            </div>

            <h6 class="fw-600 mb-2">Item Pesanan</h6>
            <div v-for="(item, idx) in editForm.items" :key="idx" class="card mb-2">
              <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="fz-13">Item #{{ idx + 1 }}</strong>
                  <button v-if="editForm.items.length > 1" class="btn btn-sm btn-outline-danger" @click="editForm.items.splice(idx, 1)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <div class="row g-2">
                  <div class="col-md-3">
                    <label class="fz-12">Ukuran</label>
                    <select v-model="item.size" class="form-select form-select-sm">
                      <option v-for="s in editSizes" :key="s.key" :value="s.key">{{ s.label }} ({{ formatRupiah(s.price) }})</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="fz-12">Level Pedas</label>
                    <input v-model.number="item.spicy_level" type="number" min="0.5" max="5" step="0.5" class="form-control form-control-sm" />
                  </div>
                  <div class="col-md-6">
                    <label class="fz-12">Bumbu</label>
                    <div class="d-flex flex-wrap gap-1 mt-1">
                      <span v-for="b in editBumbuList" :key="b.id" class="badge cursor-pointer"
                        :class="item.bumbu.includes(b.name) ? 'bg-primary' : 'bg-light text-dark border'"
                        style="cursor:pointer" @click="toggleEditBumbu(item, b.name)">
                        {{ b.name }}
                      </span>
                    </div>
                  </div>
                  <div class="col-12">
                    <label class="fz-12">Topping</label>
                    <div class="d-flex flex-wrap gap-1 mt-1">
                      <span v-for="t in editToppings" :key="t.id" class="badge cursor-pointer"
                        :class="item.topping_ids.includes(t.id) ? 'bg-success' : 'bg-light text-dark border'"
                        style="cursor:pointer" @click="toggleEditTopping(item, t.id)">
                        {{ t.name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button class="btn btn-sm btn-outline-primary mt-2" @click="addEditItem">
              <i class="bi bi-plus"></i> Tambah Item
            </button>
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-secondary" @click="editingOrder = null">Batal</button>
            <button class="btn btn-sm btn-primary" :disabled="savingEdit" @click="saveEdit">
              {{ savingEdit ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Print area (both receipts) -->
    <div v-if="printingOrder" class="print-only-area">
      <ReceiptPrint :order="printingOrder" :sizes="editSizes" />
      <div class="page-break"></div>
      <ReceiptKitchen :order="printingOrder" :sizes="editSizes" />
    </div>

    <!-- Print Modal -->
    <div v-if="printingOrder" class="modal d-block no-print" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center py-4">
            <p class="fw-600">Cetak struk pesanan {{ printingOrder.order_number }}?</p>
            <p class="fz-13 text-muted">Struk Customer + Struk Dapur</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button class="btn btn-primary btn-sm" @click="doPrint">
              <i class="bi bi-printer me-1"></i> Cetak
            </button>
            <button class="btn btn-outline-secondary btn-sm" @click="printingOrder = null">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah, formatDate, todayJakarta } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()

const orders = ref([])
const loading = ref(false)
const currentPage = ref(1)
const perPage = ref(10)
const meta = ref({ total: 0, last_page: 1 })
const search = ref('')
const filterPayment = ref('')
const dateFrom = ref(todayJakarta())
const dateTo = ref(todayJakarta())
const selectedOrder = ref(null)
const printingOrder = ref(null)
const editingOrder = ref(null)
const editForm = ref({ payment_method: '', notes: '', items: [] })
const savingEdit = ref(false)
const editSizes = ref([])
const editToppings = ref([])
const editBumbuList = ref([])

let debounceTimer = null

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
    }
    if (search.value) params.search = search.value
    if (filterPayment.value) params.payment_method = filterPayment.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value

    const result = await store.fetchOrders(params)
    orders.value = result.content
    meta.value = result.meta
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 300)
}

const goToPage = (p) => {
  if (p < 1 || p > meta.value.last_page) return
  currentPage.value = p
  fetchData()
}

const resetFilters = () => {
  search.value = ''
  filterPayment.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  currentPage.value = 1
  fetchData()
}

const viewOrder = (order) => {
  selectedOrder.value = order
}

const printOrder = async (order) => {
  if (!editSizes.value.length) {
    try {
      const sRes = await store.fetchSizes()
      editSizes.value = sRes.content
    } catch (e) { console.error(e) }
  }
  printingOrder.value = order
}

const doPrint = () => {
  window.print()
}

const getSizeLabel = (key) => {
  const found = editSizes.value.find(s => s.key === key)
  return found?.label || key
}

const openEdit = async (order) => {
  // Load master data if needed
  if (!editSizes.value.length) {
    try {
      const [sRes, tRes, bRes] = await Promise.all([
        store.fetchSizes(), store.fetchToppings(), store.fetchBumbu(),
      ])
      editSizes.value = sRes.content
      editToppings.value = tRes.content
      editBumbuList.value = bRes.content
    } catch (e) { console.error(e) }
  }

  editingOrder.value = order
  editForm.value = {
    payment_method: order.payment_method,
    notes: order.notes || '',
    items: order.order_items.map(item => ({
      size: item.menu_size_key,
      spicy_level: item.spicy_level,
      bumbu: item.bumbu ? item.bumbu.split(', ') : [],
      topping_ids: item.toppings?.map(t => t.topping_id || t.topping?.id) || [],
    })),
  }
}

const toggleEditBumbu = (item, name) => {
  const idx = item.bumbu.indexOf(name)
  if (idx > -1) item.bumbu.splice(idx, 1)
  else item.bumbu.push(name)
}

const toggleEditTopping = (item, id) => {
  const idx = item.topping_ids.indexOf(id)
  if (idx > -1) item.topping_ids.splice(idx, 1)
  else item.topping_ids.push(id)
}

const addEditItem = () => {
  editForm.value.items.push({ size: editSizes.value[0]?.key || '', spicy_level: 2, bumbu: [], topping_ids: [] })
}

const saveEdit = async () => {
  savingEdit.value = true
  try {
    await store.updateOrder(editingOrder.value.id, editForm.value)
    editingOrder.value = null
    fetchData()
  } catch (e) {
    alert(e.response?.data?.message || 'Gagal menyimpan')
  }
  savingEdit.value = false
}

onMounted(() => {
  fetchData()
  // Load sizes for label lookup
  store.fetchSizes().then(res => { editSizes.value = res.content }).catch(() => {})
})
</script>
