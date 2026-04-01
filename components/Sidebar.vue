<template>
  <div class="sidebar" :class="{ minimized }">
    <!-- Brand -->
    <div class="brand">
      <img src="/logo.png" alt="OMT" style="width:28px;height:28px;object-fit:contain" />
      <span v-if="!minimized" class="brand-text">Oh My Tongue</span>
    </div>

    <!-- Toggle button -->
    <button class="sidebar-toggle" @click="toggleMinimize" :title="minimized ? 'Expand' : 'Minimize'">
      <i class="bi" :class="minimized ? 'bi-list' : 'bi-chevron-bar-left'"></i>
    </button>

    <div class="sidebar-menu">
      <!-- Common -->
      <NuxtLink v-if="store.isStaff" to="/" class="nav-item" title="Buat Pesanan">
        <i class="bi bi-plus-circle"></i> <span class="nav-text">Buat Pesanan</span>
      </NuxtLink>
      <NuxtLink to="/orders" class="nav-item" title="Daftar Pesanan">
        <i class="bi bi-receipt"></i> <span class="nav-text">Daftar Pesanan</span>
      </NuxtLink>

      <!-- Staff-only -->
      <template v-if="store.isStaff">
        <div class="sidebar-group">
          <div class="sidebar-label" @click="toggle('tugas')">
            <span class="label-text">TUGAS HARIAN</span>
            <i v-if="!minimized" class="bi" :class="isOpen('tugas') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </div>
          <div v-if="!minimized" class="sidebar-items" :class="{ collapsed: !isOpen('tugas') }">
            <NuxtLink to="/sop-checklist" class="nav-item" title="SOP Checklist"><i class="bi bi-clipboard-check"></i> <span class="nav-text">SOP Checklist</span></NuxtLink>
            <NuxtLink to="/quality-check" class="nav-item" title="Quality Check"><i class="bi bi-shield-check"></i> <span class="nav-text">Quality Check</span></NuxtLink>
            <NuxtLink to="/stok-opname" class="nav-item" title="Stok Opname"><i class="bi bi-clipboard-data"></i> <span class="nav-text">Stok Opname</span></NuxtLink>
            <NuxtLink to="/packaging" class="nav-item" title="Packaging"><i class="bi bi-box2"></i> <span class="nav-text">Packaging</span></NuxtLink>
          </div>
          <div v-else class="sidebar-items-mini">
            <NuxtLink to="/sop-checklist" class="nav-item" title="SOP Checklist"><i class="bi bi-clipboard-check"></i></NuxtLink>
            <NuxtLink to="/quality-check" class="nav-item" title="Quality Check"><i class="bi bi-shield-check"></i></NuxtLink>
            <NuxtLink to="/stok-opname" class="nav-item" title="Stok Opname"><i class="bi bi-clipboard-data"></i></NuxtLink>
            <NuxtLink to="/packaging" class="nav-item" title="Packaging"><i class="bi bi-box2"></i></NuxtLink>
          </div>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-label" @click="toggle('ops')">
            <span class="label-text">OPERASIONAL</span>
            <i v-if="!minimized" class="bi" :class="isOpen('ops') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </div>
          <div v-if="!minimized" class="sidebar-items" :class="{ collapsed: !isOpen('ops') }">
            <NuxtLink to="/shift" class="nav-item" title="Shift"><i class="bi bi-clock-history"></i> <span class="nav-text">Shift</span></NuxtLink>
            <NuxtLink to="/members" class="nav-item" title="Member"><i class="bi bi-people"></i> <span class="nav-text">Member</span></NuxtLink>
          </div>
          <div v-else class="sidebar-items-mini">
            <NuxtLink to="/shift" class="nav-item" title="Shift"><i class="bi bi-clock-history"></i></NuxtLink>
            <NuxtLink to="/members" class="nav-item" title="Member"><i class="bi bi-people"></i></NuxtLink>
          </div>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-label" @click="toggle('lain')">
            <span class="label-text">LAINNYA</span>
            <i v-if="!minimized" class="bi" :class="isOpen('lain') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </div>
          <div v-if="!minimized" class="sidebar-items" :class="{ collapsed: !isOpen('lain') }">
            <NuxtLink to="/photobooth" class="nav-item" title="Photobooth"><i class="bi bi-camera"></i> <span class="nav-text">Photobooth</span></NuxtLink>
          </div>
          <div v-else class="sidebar-items-mini">
            <NuxtLink to="/photobooth" class="nav-item" title="Photobooth"><i class="bi bi-camera"></i></NuxtLink>
          </div>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-label" @click="toggle('keu-staff')">
            <span class="label-text">KEUANGAN</span>
            <i v-if="!minimized" class="bi" :class="isOpen('keu-staff') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </div>
          <div v-if="!minimized" class="sidebar-items" :class="{ collapsed: !isOpen('keu-staff') }">
            <NuxtLink to="/staff-expenses" class="nav-item" title="Pengeluaran"><i class="bi bi-cash-stack"></i> <span class="nav-text">Pengeluaran</span></NuxtLink>
          </div>
          <div v-else class="sidebar-items-mini">
            <NuxtLink to="/staff-expenses" class="nav-item" title="Pengeluaran"><i class="bi bi-cash-stack"></i></NuxtLink>
          </div>
        </div>
      </template>

      <!-- Superadmin -->
      <template v-if="store.isSuperAdmin">
        <NuxtLink to="/dashboard" class="nav-item" title="Dashboard">
          <i class="bi bi-graph-up"></i> <span class="nav-text">Dashboard</span>
        </NuxtLink>

        <div class="sidebar-group">
          <div class="sidebar-label" @click="toggle('data')">
            <span class="label-text">KELOLA DATA</span>
            <i v-if="!minimized" class="bi" :class="isOpen('data') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </div>
          <div v-if="!minimized" class="sidebar-items" :class="{ collapsed: !isOpen('data') }">
            <NuxtLink to="/admin/menu-sizes" class="nav-item" title="Menu / Ukuran"><i class="bi bi-grid"></i> <span class="nav-text">Menu / Ukuran</span></NuxtLink>
            <NuxtLink to="/admin/toppings" class="nav-item" title="Topping"><i class="bi bi-puzzle"></i> <span class="nav-text">Topping</span></NuxtLink>
            <NuxtLink to="/admin/bumbu" class="nav-item" title="Bumbu"><i class="bi bi-droplet"></i> <span class="nav-text">Bumbu</span></NuxtLink>
            <NuxtLink to="/admin/promos" class="nav-item" title="Promo"><i class="bi bi-tag"></i> <span class="nav-text">Promo</span></NuxtLink>
            <NuxtLink to="/admin/members" class="nav-item" title="Member"><i class="bi bi-people"></i> <span class="nav-text">Member</span></NuxtLink>
          </div>
          <div v-else class="sidebar-items-mini">
            <NuxtLink to="/admin/menu-sizes" class="nav-item" title="Menu / Ukuran"><i class="bi bi-grid"></i></NuxtLink>
            <NuxtLink to="/admin/toppings" class="nav-item" title="Topping"><i class="bi bi-puzzle"></i></NuxtLink>
            <NuxtLink to="/admin/bumbu" class="nav-item" title="Bumbu"><i class="bi bi-droplet"></i></NuxtLink>
            <NuxtLink to="/admin/promos" class="nav-item" title="Promo"><i class="bi bi-tag"></i></NuxtLink>
            <NuxtLink to="/admin/members" class="nav-item" title="Member"><i class="bi bi-people"></i></NuxtLink>
          </div>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-label" @click="toggle('mgmt')">
            <span class="label-text">MANAJEMEN</span>
            <i v-if="!minimized" class="bi" :class="isOpen('mgmt') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </div>
          <div v-if="!minimized" class="sidebar-items" :class="{ collapsed: !isOpen('mgmt') }">
            <NuxtLink to="/admin/stores" class="nav-item" title="Kelola Toko"><i class="bi bi-shop"></i> <span class="nav-text">Kelola Toko</span></NuxtLink>
            <NuxtLink to="/admin/staff" class="nav-item" title="Kelola Staff"><i class="bi bi-person-gear"></i> <span class="nav-text">Kelola Staff</span></NuxtLink>
            <NuxtLink to="/admin/suppliers" class="nav-item" title="Supplier"><i class="bi bi-truck"></i> <span class="nav-text">Supplier</span></NuxtLink>
          </div>
          <div v-else class="sidebar-items-mini">
            <NuxtLink to="/admin/stores" class="nav-item" title="Kelola Toko"><i class="bi bi-shop"></i></NuxtLink>
            <NuxtLink to="/admin/staff" class="nav-item" title="Kelola Staff"><i class="bi bi-person-gear"></i></NuxtLink>
            <NuxtLink to="/admin/suppliers" class="nav-item" title="Supplier"><i class="bi bi-truck"></i></NuxtLink>
          </div>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-label" @click="toggle('keu')">
            <span class="label-text">KEUANGAN</span>
            <i v-if="!minimized" class="bi" :class="isOpen('keu') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </div>
          <div v-if="!minimized" class="sidebar-items" :class="{ collapsed: !isOpen('keu') }">
            <NuxtLink to="/admin/finance" class="nav-item" title="Buku Kas"><i class="bi bi-journal-text"></i> <span class="nav-text">Buku Kas</span></NuxtLink>
            <NuxtLink to="/admin/stocks" class="nav-item" title="Stok Masuk"><i class="bi bi-box-seam"></i> <span class="nav-text">Stok Masuk</span></NuxtLink>
            <NuxtLink to="/admin/expenses" class="nav-item" title="Pengeluaran"><i class="bi bi-wallet2"></i> <span class="nav-text">Pengeluaran</span></NuxtLink>
            <NuxtLink to="/admin/daily-recap" class="nav-item" title="Rekap Harian"><i class="bi bi-calendar-check"></i> <span class="nav-text">Rekap Harian</span></NuxtLink>
            <NuxtLink to="/admin/reports" class="nav-item" title="Laporan"><i class="bi bi-bar-chart-line"></i> <span class="nav-text">Laporan</span></NuxtLink>
          </div>
          <div v-else class="sidebar-items-mini">
            <NuxtLink to="/admin/finance" class="nav-item" title="Buku Kas"><i class="bi bi-journal-text"></i></NuxtLink>
            <NuxtLink to="/admin/stocks" class="nav-item" title="Stok Masuk"><i class="bi bi-box-seam"></i></NuxtLink>
            <NuxtLink to="/admin/expenses" class="nav-item" title="Pengeluaran"><i class="bi bi-wallet2"></i></NuxtLink>
            <NuxtLink to="/admin/daily-recap" class="nav-item" title="Rekap Harian"><i class="bi bi-calendar-check"></i></NuxtLink>
            <NuxtLink to="/admin/reports" class="nav-item" title="Laporan"><i class="bi bi-bar-chart-line"></i></NuxtLink>
          </div>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-label" @click="toggle('monitor')">
            <span class="label-text">MONITORING</span>
            <i v-if="!minimized" class="bi" :class="isOpen('monitor') ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </div>
          <div v-if="!minimized" class="sidebar-items" :class="{ collapsed: !isOpen('monitor') }">
            <NuxtLink to="/admin/sop-monitor" class="nav-item" title="SOP Staff"><i class="bi bi-clipboard-check"></i> <span class="nav-text">SOP Staff</span></NuxtLink>
            <NuxtLink to="/admin/quality-monitor" class="nav-item" title="Quality Staff"><i class="bi bi-shield-check"></i> <span class="nav-text">Quality Staff</span></NuxtLink>
            <NuxtLink to="/admin/stok-opname" class="nav-item" title="Stok Opname Staff"><i class="bi bi-clipboard-data"></i> <span class="nav-text">Stok Opname</span></NuxtLink>
            <NuxtLink to="/admin/staff-expenses" class="nav-item" title="Pengeluaran Staff"><i class="bi bi-cash-stack"></i> <span class="nav-text">Pengeluaran Staff</span></NuxtLink>
            <NuxtLink to="/admin/attendance" class="nav-item" title="Absensi Staff"><i class="bi bi-person-check"></i> <span class="nav-text">Absensi Staff</span></NuxtLink>
            <NuxtLink to="/admin/shifts" class="nav-item" title="Shift Staff"><i class="bi bi-clock-history"></i> <span class="nav-text">Shift Staff</span></NuxtLink>
            <NuxtLink to="/admin/packaging" class="nav-item" title="Packaging Staff"><i class="bi bi-box2"></i> <span class="nav-text">Packaging Staff</span></NuxtLink>
          </div>
          <div v-else class="sidebar-items-mini">
            <NuxtLink to="/admin/sop-monitor" class="nav-item" title="SOP Staff"><i class="bi bi-clipboard-check"></i></NuxtLink>
            <NuxtLink to="/admin/quality-monitor" class="nav-item" title="Quality Staff"><i class="bi bi-shield-check"></i></NuxtLink>
            <NuxtLink to="/admin/stok-opname" class="nav-item" title="Stok Opname Staff"><i class="bi bi-clipboard-data"></i></NuxtLink>
            <NuxtLink to="/admin/staff-expenses" class="nav-item" title="Pengeluaran Staff"><i class="bi bi-cash-stack"></i></NuxtLink>
            <NuxtLink to="/admin/attendance" class="nav-item" title="Absensi Staff"><i class="bi bi-person-check"></i></NuxtLink>
            <NuxtLink to="/admin/shifts" class="nav-item" title="Shift Staff"><i class="bi bi-clock-history"></i></NuxtLink>
            <NuxtLink to="/admin/packaging" class="nav-item" title="Packaging Staff"><i class="bi bi-box2"></i></NuxtLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
const store = useMainStore()

const minimized = ref(false)
const openGroups = ref({})

const emit = defineEmits(['update:minimized'])

onMounted(() => {
  try {
    const saved = localStorage.getItem('sidebar_groups')
    if (saved) openGroups.value = JSON.parse(saved)
    minimized.value = localStorage.getItem('sidebar_mini') === '1'
    emit('update:minimized', minimized.value)
  } catch {}
})

const isOpen = (id) => openGroups.value[id] !== false

const toggle = (id) => {
  if (minimized.value) return
  openGroups.value[id] = !isOpen(id)
  localStorage.setItem('sidebar_groups', JSON.stringify(openGroups.value))
}

const toggleMinimize = () => {
  minimized.value = !minimized.value
  localStorage.setItem('sidebar_mini', minimized.value ? '1' : '0')
  emit('update:minimized', minimized.value)
}
</script>

<style scoped>
.sidebar-menu {
  padding: 4px 0 16px;
}

.sidebar-group {
  margin-top: 4px;
  border-top: 1px solid var(--gray-200);
  padding-top: 4px;
}

.sidebar-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--gray-400);
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}
.sidebar-label:hover { color: var(--gray-600); }
.sidebar-label i { font-size: 10px; }

.sidebar-items {
  overflow: hidden;
  max-height: 500px;
  transition: max-height 0.25s ease, opacity 0.2s ease;
  opacity: 1;
}
.sidebar-items.collapsed {
  max-height: 0;
  opacity: 0;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  background: white;
  color: var(--gray-500);
  cursor: pointer;
  margin: 12px auto 4px;
  transition: all 0.2s ease;
  font-size: 18px;
}
.sidebar-toggle:hover {
  background: linear-gradient(135deg, var(--primary-bg), var(--primary-bg-hover));
  color: var(--primary);
  border-color: var(--primary-light);
  transform: scale(1.05);
}

/* Minimized state */
.sidebar.minimized .brand {
  justify-content: center;
  padding: 0 0 16px;
}
.sidebar.minimized .brand-text { display: none; }

.sidebar.minimized .sidebar-label {
  justify-content: center;
  padding: 8px 0 4px;
}
.sidebar.minimized .label-text {
  display: none;
}
.sidebar.minimized .sidebar-group {
  border-top: 1px solid var(--gray-200);
  margin-top: 2px;
  padding-top: 2px;
}

.sidebar.minimized .nav-item {
  justify-content: center;
  padding: 10px 0;
  border-left: none;
}
.sidebar.minimized .nav-text { display: none; }

.sidebar-items-mini {
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
