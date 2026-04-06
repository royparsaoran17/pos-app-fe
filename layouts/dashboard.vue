<template>
  <ToastContainer />
  <div class="d-flex">
    <Sidebar @update:minimized="(v) => sidebarMini = v" />
    <div class="main-content w-100" :style="{ marginLeft: sidebarMini ? '68px' : '260px' }">
      <div class="topbar-wrapper">
        <div class="topbar">
          <div>
            <h1>{{ pageTitle }}</h1>
          </div>
          <div class="d-flex align-items-center gap-3">
            <StoreSelector v-if="store.isSuperAdmin" />
            <span v-else-if="store.currentStore" class="badge bg-info fz-12">
              <i class="bi bi-shop me-1"></i>{{ store.currentStore.name }}
            </span>
            <span class="fz-14 text-muted">{{ store.profile?.name }}</span>
            <span class="badge bg-primary fz-12">{{ store.profile?.role === 'SUPERADMIN' ? 'Super Admin' : 'Staff' }}</span>
            <button class="btn btn-sm btn-outline-danger" @click="logout">
              <i class="bi bi-box-arrow-right"></i> Keluar
            </button>
          </div>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'

const store = useMainStore()
const route = useRoute()
const router = useRouter()
const sidebarMini = ref(false)

onMounted(() => {
  sidebarMini.value = localStorage.getItem('sidebar_mini') === '1'

  const token = localStorage.getItem('pos_token')
  const user = localStorage.getItem('pos_user')
  if (!token) {
    router.push('/login')
    return
  }
  if (user) {
    store.setProfile(JSON.parse(user))
  }
  store.setToken(token)
  store.restoreStoreContext()

  // Restore stores list for superadmin
  const savedStores = localStorage.getItem('pos_stores')
  if (savedStores) {
    store.setStores(JSON.parse(savedStores))
  }
})

const pageTitle = computed(() => {
  const titles = {
    '/': 'Buat Pesanan',
    '/orders': 'Daftar Pesanan',
    '/dashboard': 'Dashboard',
    '/sop-checklist': 'SOP Checklist',
    '/quality-check': 'Quality Check',
    '/stok-opname': 'Stok Opname',
    '/staff-expenses': 'Pengeluaran',
    '/shift': 'Shift',
    '/members': 'Member',
    '/packaging': 'Packaging',
    '/photobooth': 'Photobooth',
    '/admin/toppings': 'Kelola Topping',
    '/admin/bumbu': 'Kelola Bumbu',
    '/admin/menu-sizes': 'Kelola Menu / Ukuran',
    '/admin/promos': 'Kelola Promo',
    '/admin/members': 'Kelola Member',
    '/admin/staff': 'Kelola Staff',
    '/admin/suppliers': 'Supplier',
    '/admin/finance': 'Buku Kas',
    '/admin/stocks': 'Stok Masuk',
    '/admin/topping-stock': 'Stok & Pemakaian Topping',
    '/admin/expenses': 'Pengeluaran Operasional',
    '/admin/staff-expenses': 'Pengeluaran Staff',
    '/admin/daily-recap': 'Rekap Harian',
    '/admin/reports': 'Laporan Penjualan',
    '/admin/analytics': 'Business Analytics',
    '/admin/sop-monitor': 'Monitoring SOP Staff',
    '/admin/quality-monitor': 'Monitoring Quality Staff',
    '/admin/stok-opname': 'Stok Opname Staff',
    '/admin/attendance': 'Absensi Staff',
    '/admin/shifts': 'Shift Staff',
    '/admin/packaging': 'Packaging Staff',
    '/admin/stores': 'Kelola Toko',
  }
  return titles[route.path] || 'OMT'
})

const logout = () => {
  localStorage.removeItem('pos_token')
  localStorage.removeItem('pos_user')
  localStorage.removeItem('pos_store_id')
  localStorage.removeItem('pos_store')
  localStorage.removeItem('pos_stores')
  store.setToken(null)
  store.setProfile(null)
  store.setCurrentStore(null)
  store.setStores([])
  router.push('/login')
}
</script>

<style scoped>
.topbar-wrapper {
  margin: -24px -32px 28px;
  padding: 20px 32px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(250,250,249,0.95) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gray-200);
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-wrapper .topbar {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
</style>
