<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="fw-700 mb-1">Quality Check Topping</h5>
        <div class="fz-13 text-muted">Periksa kondisi setiap topping hari ini</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <input v-model="selectedDate" type="date" class="form-control form-control-sm" style="width: 160px" @change="loadCheck" />
      </div>
    </div>

    <!-- Summary -->
    <div class="row g-3 mb-4" v-if="check.summary">
      <div class="col-4">
        <div class="card border-0 shadow-sm text-center py-2">
          <div class="fw-700 text-success fz-20">{{ check.summary.good }}</div>
          <div class="fz-12 text-muted">Baik</div>
        </div>
      </div>
      <div class="col-4">
        <div class="card border-0 shadow-sm text-center py-2">
          <div class="fw-700 text-warning fz-20">{{ check.summary.warning }}</div>
          <div class="fz-12 text-muted">Perhatian</div>
        </div>
      </div>
      <div class="col-4">
        <div class="card border-0 shadow-sm text-center py-2">
          <div class="fw-700 text-danger fz-20">{{ check.summary.bad }}</div>
          <div class="fz-12 text-muted">Buruk</div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div> Memuat data...
    </div>

    <!-- Topping Quality List -->
    <div v-if="!loading" class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-for="(item, idx) in check.items" :key="item.topping_id" class="qc-item" :class="'qc-' + item.status.toLowerCase()">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <span class="fz-13 text-muted" style="min-width: 24px">{{ idx + 1 }}.</span>
              <span class="fw-600">{{ item.topping_name }}</span>
            </div>
            <div class="btn-group btn-group-sm">
              <button class="btn" :class="item.status === 'GOOD' ? 'btn-success' : 'btn-outline-success'" @click="setStatus(item, 'GOOD')">
                <i class="bi bi-check-circle"></i> Baik
              </button>
              <button class="btn" :class="item.status === 'WARNING' ? 'btn-warning' : 'btn-outline-warning'" @click="setStatus(item, 'WARNING')">
                <i class="bi bi-exclamation-triangle"></i> Perhatian
              </button>
              <button class="btn" :class="item.status === 'BAD' ? 'btn-danger' : 'btn-outline-danger'" @click="setStatus(item, 'BAD')">
                <i class="bi bi-x-circle"></i> Buruk
              </button>
            </div>
          </div>
          <!-- Notes for WARNING/BAD -->
          <div v-if="item.status !== 'GOOD'" class="mt-2 ms-4">
            <input v-model="item.notes" class="form-control form-control-sm fz-13" :placeholder="item.status === 'WARNING' ? 'Catatan: stok menipis, warna pudar...' : 'Catatan: basi, berjamur, bau...'" @input="debouncedSave" />
          </div>
        </div>

        <div v-if="check.items?.length === 0" class="text-center py-4 text-muted">
          Tidak ada topping aktif
        </div>
      </div>
    </div>

    <!-- Overall notes -->
    <div v-if="!loading && check.items?.length > 0" class="mt-3">
      <label class="form-label fw-600 fz-14">Catatan Umum (opsional)</label>
      <textarea v-model="check.overall_notes" class="form-control fz-13" rows="2" placeholder="Catatan tambahan tentang kondisi topping hari ini..." @input="debouncedSave"></textarea>
    </div>

    <!-- Save button -->
    <div v-if="!loading && check.items?.length > 0" class="mt-3 d-flex justify-content-end">
      <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveCheck">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
        {{ saving ? 'Menyimpan...' : 'Simpan Quality Check' }}
      </button>
    </div>

    <!-- Save toast -->
    <div v-if="showSaved" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1050">
      <div class="toast show bg-success text-white">
        <div class="toast-body fz-13"><i class="bi bi-check-circle me-1"></i> Tersimpan!</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { todayJakarta } from '~/utils/format'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()
const loading = ref(false)
const saving = ref(false)
const selectedDate = ref(todayJakarta())
const showSaved = ref(false)
const check = ref({
  items: [],
  overall_notes: null,
  summary: { good: 0, warning: 0, bad: 0, total: 0 },
})

let saveTimer = null

const loadCheck = async () => {
  loading.value = true
  try {
    const res = await store.fetchQualityCheck({ date: selectedDate.value })
    check.value = res.content
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const setStatus = (item, status) => {
  item.status = status
  if (status === 'GOOD') item.notes = null
  updateSummary()
  debouncedSave()
}

const updateSummary = () => {
  const items = check.value.items || []
  check.value.summary = {
    good: items.filter((i) => i.status === 'GOOD').length,
    warning: items.filter((i) => i.status === 'WARNING').length,
    bad: items.filter((i) => i.status === 'BAD').length,
    total: items.length,
  }
}

const debouncedSave = () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveCheck(), 1000)
}

const saveCheck = async () => {
  saving.value = true
  try {
    const res = await store.saveQualityCheck({
      check_date: selectedDate.value,
      notes: check.value.overall_notes || null,
      items: (check.value.items || []).map((i) => ({
        topping_id: i.topping_id,
        status: i.status,
        notes: i.notes || null,
      })),
    })
    check.value = res.content
    showSaved.value = true
    setTimeout(() => { showSaved.value = false }, 1500)
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

onMounted(loadCheck)
</script>

<style scoped>
.qc-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}
.qc-item:last-child {
  border-bottom: none;
}
.qc-good {
  background: #fff;
}
.qc-warning {
  background: #fffbeb;
}
.qc-bad {
  background: #fef2f2;
}
</style>
