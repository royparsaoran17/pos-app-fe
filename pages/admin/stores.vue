<template>
  <div class="p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div></div>
      <button class="btn btn-primary btn-sm" @click="openForm()">
        <i class="bi bi-plus-lg me-1"></i> Tambah Toko
      </button>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Toko</th>
              <th>Alamat</th>
              <th>Telepon</th>
              <th>Sosial Media</th>
              <th>Staff</th>
              <th>Orders</th>
              <th>Status</th>
              <th width="120">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="text-center py-4">
                <span class="spinner-border spinner-border-sm me-2"></span> Memuat...
              </td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="9" class="text-center py-4 text-muted">Belum ada toko</td>
            </tr>
            <tr v-for="row in rows" :key="row.id">
              <td><span class="badge bg-secondary">{{ row.code }}</span></td>
              <td class="fw-500">{{ row.name }}</td>
              <td class="fz-13 text-muted">{{ row.address || '-' }}</td>
              <td class="fz-13">{{ row.phone || '-' }}</td>
              <td class="fz-12">
                <div v-if="row.instagram"><i class="bi bi-instagram me-1"></i>@{{ row.instagram }}</div>
                <div v-if="row.tiktok"><i class="bi bi-tiktok me-1"></i>@{{ row.tiktok }}</div>
                <span v-if="!row.instagram && !row.tiktok" class="text-muted">-</span>
              </td>
              <td>{{ row._count?.users || 0 }}</td>
              <td>{{ row._count?.orders || 0 }}</td>
              <td>
                <span :class="row.is_active ? 'badge bg-success' : 'badge bg-danger'">
                  {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>
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
      </div>
    </div>

    <!-- Form Modal -->
    <div class="modal fade" ref="formModalEl" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.id ? 'Edit Toko' : 'Tambah Toko' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="saveStore">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label fw-500 fz-14">Nama Toko</label>
                <input v-model="form.name" class="form-control" placeholder="Oh My Tongue Cijerah" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-500 fz-14">Kode</label>
                <input v-model="form.code" class="form-control" placeholder="CJR" maxlength="20" required />
                <small class="text-muted">Kode singkat untuk identifikasi toko (akan diubah ke uppercase)</small>
              </div>
              <div class="mb-3">
                <label class="form-label fw-500 fz-14">Alamat</label>
                <textarea v-model="form.address" class="form-control" rows="2" placeholder="Jl. Cijerah No. 123"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label fw-500 fz-14">Telepon</label>
                <input v-model="form.phone" class="form-control" placeholder="08123456789" />
              </div>
              <div class="mb-3">
                <label class="form-label fw-500 fz-14">Instagram</label>
                <div class="input-group">
                  <span class="input-group-text fz-13">@</span>
                  <input v-model="form.instagram" class="form-control" placeholder="ohmytongue.id" />
                </div>
                <small class="text-muted">Username tanpa @, akan tampil di struk</small>
              </div>
              <div class="mb-3">
                <label class="form-label fw-500 fz-14">TikTok</label>
                <div class="input-group">
                  <span class="input-group-text fz-13">@</span>
                  <input v-model="form.tiktok" class="form-control" placeholder="ohmytongue" />
                </div>
                <small class="text-muted">Username tanpa @, akan tampil di struk</small>
              </div>
              <div v-if="form.id" class="form-check">
                <input v-model="form.is_active" type="checkbox" class="form-check-input" id="storeActive" />
                <label class="form-check-label" for="storeActive">Aktif</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Batal</button>
              <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div class="modal fade" ref="deleteModalEl" tabindex="-1">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Hapus Toko</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            Yakin hapus <strong>{{ deleteTarget?.name }}</strong>?
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Batal</button>
            <button class="btn btn-danger btn-sm" @click="doDelete" :disabled="saving">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { useToast } from '~/composables/useToast'
import { Modal } from 'bootstrap'

definePageMeta({ layout: 'dashboard' })

const store = useMainStore()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const form = ref({ id: null, name: '', code: '', address: '', phone: '', instagram: '', tiktok: '', is_active: true })
const deleteTarget = ref(null)
const formModalEl = ref(null)
const deleteModalEl = ref(null)
let formModal, deleteModal

onMounted(() => {
  formModal = new Modal(formModalEl.value)
  deleteModal = new Modal(deleteModalEl.value)
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await store.adminFetchStores()
    rows.value = res.content
  } catch {} finally { loading.value = false }
}

const openForm = (row) => {
  if (row) {
    form.value = { id: row.id, name: row.name, code: row.code, address: row.address || '', phone: row.phone || '', instagram: row.instagram || '', tiktok: row.tiktok || '', is_active: row.is_active }
  } else {
    form.value = { id: null, name: '', code: '', address: '', phone: '', instagram: '', tiktok: '', is_active: true }
  }
  formModal.show()
}

const saveStore = async () => {
  saving.value = true
  try {
    if (form.value.id) {
      await store.adminUpdateStore(form.value.id, form.value)
      toast.success('Toko berhasil diperbarui')
    } else {
      await store.adminCreateStore(form.value)
      toast.success('Toko berhasil ditambahkan')
    }
    formModal.hide()
    loadData()
    // Refresh stores list in selector
    try {
      const res = await store.adminFetchActiveStores()
      store.setStores(res.content)
      localStorage.setItem('pos_stores', JSON.stringify(res.content))
    } catch {}
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menyimpan')
  } finally { saving.value = false }
}

const confirmDelete = (row) => {
  deleteTarget.value = row
  deleteModal.show()
}

const doDelete = async () => {
  saving.value = true
  try {
    await store.adminDeleteStore(deleteTarget.value.id)
    toast.success('Toko berhasil dihapus')
    deleteModal.hide()
    loadData()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menghapus')
  } finally { saving.value = false }
}
</script>
