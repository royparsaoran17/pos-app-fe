<template>
  <div class="p-4">
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label fz-13">Tanggal Opname</label>
            <input v-model="selectedDate" type="date" class="form-control form-control-sm" @change="loadOpname" />
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <span class="fz-13 text-muted">Input berat topping (KG) untuk hari ini</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="fz-13" style="width:40px">No</th>
                <th class="fz-13">Topping</th>
                <th class="fz-13" style="width:160px">Berat (KG)</th>
                <th class="fz-13">Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in items" :key="item.topping_id">
                <td class="fz-13">{{ idx + 1 }}</td>
                <td class="fz-13 fw-medium">{{ item.topping_name }}</td>
                <td>
                  <input v-model.number="item.weight_kg" type="number" step="0.1" min="0" class="form-control form-control-sm" />
                </td>
                <td>
                  <input v-model="item.notes" class="form-control form-control-sm" placeholder="Opsional" />
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="4" class="text-center text-muted py-4">Memuat data...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-end mt-3">
          <button class="btn btn-primary" :disabled="saving" @click="saveOpname">
            <i class="bi bi-check-lg me-1"></i> {{ saving ? 'Menyimpan...' : 'Simpan Stok Opname' }}
          </button>
        </div>

        <div v-if="saveMsg" class="alert alert-success mt-3 fz-13 mb-0">{{ saveMsg }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { todayJakarta } from '~/utils/format'
definePageMeta({ layout: 'dashboard' })

const store = useMainStore()
const selectedDate = ref(todayJakarta())
const items = ref([])
const saving = ref(false)
const saveMsg = ref('')

const loadOpname = async () => {
  saveMsg.value = ''
  try {
    const res = await store.fetchStockOpname({ date: selectedDate.value })
    const opname = res.content
    items.value = opname.items.map(i => ({
      topping_id: i.topping_id || i.topping?.id,
      topping_name: i.topping?.name || '',
      weight_kg: i.weight_kg || 0,
      notes: i.notes || '',
    }))
  } catch (e) { console.error(e) }
}

const saveOpname = async () => {
  saving.value = true
  saveMsg.value = ''
  try {
    await store.saveStockOpname({
      date: selectedDate.value,
      items: items.value.map(i => ({
        topping_id: i.topping_id,
        weight_kg: i.weight_kg,
        notes: i.notes || '',
      })),
    })
    saveMsg.value = 'Stok opname berhasil disimpan!'
  } catch (e) { alert(e.response?.data?.message || 'Gagal menyimpan') }
  saving.value = false
}

onMounted(() => loadOpname())
</script>
