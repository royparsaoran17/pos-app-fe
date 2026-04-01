<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="fw-700 mb-1">SOP Checklist Harian</h5>
        <div class="fz-13 text-muted">Centang setiap tugas yang sudah dikerjakan</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <input v-model="selectedDate" type="date" class="form-control form-control-sm" style="width: 160px" @change="loadChecklist" />
      </div>
    </div>

    <!-- Progress -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-600">Progress Hari Ini</span>
          <span class="fw-700" :class="progressColor">{{ checklist.completed_tasks }}/{{ checklist.total_tasks }} ({{ checklist.progress }}%)</span>
        </div>
        <div class="progress" style="height: 10px">
          <div class="progress-bar" :class="progressBarColor" :style="{ width: checklist.progress + '%' }" role="progressbar"></div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div> Memuat checklist...
    </div>

    <template v-if="!loading">
      <!-- OPENING Section -->
      <div class="sop-section mb-4">
        <div class="sop-section-header bg-primary bg-opacity-10">
          <i class="bi bi-sunrise text-primary me-2"></i>
          <span class="fw-700 text-primary">BUKA TOKO (Opening)</span>
          <span class="ms-auto badge bg-primary">{{ sectionProgress('OPENING') }}</span>
        </div>
        <div class="sop-section-body">
          <div v-for="(item, idx) in checklist.sections?.OPENING || []" :key="'o-'+idx" class="sop-item" :class="{ 'sop-item-checked': item.is_checked }">
            <div class="form-check">
              <input :id="'op-'+idx" v-model="item.is_checked" type="checkbox" class="form-check-input" @change="onToggle(item)">
              <label :for="'op-'+idx" class="form-check-label" :class="{ 'text-decoration-line-through text-muted': item.is_checked }">
                <span class="fz-13 text-muted me-2">{{ idx + 1 }}.</span>
                {{ item.description }}
              </label>
            </div>
            <div v-if="item.checked_at" class="fz-12 text-muted ms-4 mt-1">
              <i class="bi bi-check-circle-fill text-success"></i> {{ formatTime(item.checked_at) }}
            </div>
          </div>
        </div>
      </div>

      <!-- OPERATIONAL Section -->
      <div class="sop-section mb-4">
        <div class="sop-section-header bg-warning bg-opacity-10">
          <i class="bi bi-shop text-warning me-2"></i>
          <span class="fw-700 text-warning">SAAT OPERASIONAL</span>
          <span class="ms-auto badge bg-warning text-dark">{{ sectionProgress('OPERATIONAL') }}</span>
        </div>
        <div class="sop-section-body">
          <div v-for="(item, idx) in checklist.sections?.OPERATIONAL || []" :key="'op2-'+idx" class="sop-item" :class="{ 'sop-item-checked': item.is_checked }">
            <div class="form-check">
              <input :id="'oper-'+idx" v-model="item.is_checked" type="checkbox" class="form-check-input" @change="onToggle(item)">
              <label :for="'oper-'+idx" class="form-check-label" :class="{ 'text-decoration-line-through text-muted': item.is_checked }">
                <span class="fz-13 text-muted me-2">{{ idx + 1 }}.</span>
                {{ item.description }}
              </label>
            </div>
            <div v-if="item.checked_at" class="fz-12 text-muted ms-4 mt-1">
              <i class="bi bi-check-circle-fill text-success"></i> {{ formatTime(item.checked_at) }}
            </div>
          </div>
        </div>
      </div>

      <!-- CLOSING Section -->
      <div class="sop-section mb-4">
        <div class="sop-section-header bg-danger bg-opacity-10">
          <i class="bi bi-moon text-danger me-2"></i>
          <span class="fw-700 text-danger">TUTUP TOKO (Closing)</span>
          <span class="ms-auto badge bg-danger">{{ sectionProgress('CLOSING') }}</span>
        </div>
        <div class="sop-section-body">
          <div v-for="(item, idx) in checklist.sections?.CLOSING || []" :key="'cl-'+idx" class="sop-item" :class="{ 'sop-item-checked': item.is_checked }">
            <div class="form-check">
              <input :id="'cl-'+idx" v-model="item.is_checked" type="checkbox" class="form-check-input" @change="onToggle(item)">
              <label :for="'cl-'+idx" class="form-check-label" :class="{ 'text-decoration-line-through text-muted': item.is_checked }">
                <span class="fz-13 text-muted me-2">{{ idx + 1 }}.</span>
                {{ item.description }}
              </label>
            </div>
            <div v-if="item.checked_at" class="fz-12 text-muted ms-4 mt-1">
              <i class="bi bi-check-circle-fill text-success"></i> {{ formatTime(item.checked_at) }}
            </div>
          </div>
        </div>
      </div>
    </template>

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
const selectedDate = ref(todayJakarta())
const showSaved = ref(false)
const checklist = ref({
  total_tasks: 0,
  completed_tasks: 0,
  progress: 0,
  sections: { OPENING: [], OPERATIONAL: [], CLOSING: [] },
})

let saveTimer = null

const loadChecklist = async () => {
  loading.value = true
  try {
    const res = await store.fetchSopChecklist({ date: selectedDate.value })
    checklist.value = res.content
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const onToggle = (item) => {
  // Auto-save after toggling
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveChecklist(), 500)
}

const saveChecklist = async () => {
  try {
    const allItems = [
      ...(checklist.value.sections?.OPENING || []),
      ...(checklist.value.sections?.OPERATIONAL || []),
      ...(checklist.value.sections?.CLOSING || []),
    ]
    const res = await store.saveSopChecklist({
      shift_date: selectedDate.value,
      items: allItems.map((i) => ({
        task_id: i.task_id,
        is_checked: i.is_checked,
        notes: i.notes || null,
      })),
    })
    checklist.value = res.content
    showSaved.value = true
    setTimeout(() => { showSaved.value = false }, 1500)
  } catch (err) {
    console.error(err)
  }
}

const sectionProgress = (category) => {
  const items = checklist.value.sections?.[category] || []
  const checked = items.filter((i) => i.is_checked).length
  return `${checked}/${items.length}`
}

const progressColor = computed(() => {
  const p = checklist.value.progress
  if (p >= 100) return 'text-success'
  if (p >= 50) return 'text-primary'
  return 'text-warning'
})

const progressBarColor = computed(() => {
  const p = checklist.value.progress
  if (p >= 100) return 'bg-success'
  if (p >= 50) return 'bg-primary'
  return 'bg-warning'
})

const formatTime = (dt) => {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

onMounted(loadChecklist)
</script>

<style scoped>
.sop-section {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.sop-section-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
}
.sop-section-body {
  background: #fff;
}
.sop-item {
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}
.sop-item:last-child {
  border-bottom: none;
}
.sop-item:hover {
  background: #f8f9fa;
}
.sop-item-checked {
  background: #f0fdf4;
}
.form-check-input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
}
.form-check-label {
  font-size: 14px;
  cursor: pointer;
}
</style>
