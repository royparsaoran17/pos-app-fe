import { defineStore } from 'pinia'
import http from '~/utils/http'

export const useMainStore = defineStore('main', {
  state: () => ({
    token: null,
    profile: null,
    currentStoreId: null,
    currentStore: null,
    stores: [],
    toppings: [],
    bumbuList: [],
    sizes: [],
    paymentMethods: [],
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isSuperAdmin: (state) => state.profile?.role === 'SUPERADMIN',
    isStaff: (state) => state.profile?.role === 'STAFF',
  },

  actions: {
    setToken(token) { this.token = token },
    setProfile(profile) { this.profile = profile },
    setCurrentStore(store) {
      this.currentStoreId = store?.id || null
      this.currentStore = store || null
      if (store?.id) {
        localStorage.setItem('pos_store_id', store.id)
        localStorage.setItem('pos_store', JSON.stringify(store))
      } else {
        localStorage.removeItem('pos_store_id')
        localStorage.removeItem('pos_store')
      }
    },
    setStores(stores) { this.stores = stores || [] },
    restoreStoreContext() {
      const storeId = localStorage.getItem('pos_store_id')
      const storeJson = localStorage.getItem('pos_store')
      if (storeId && storeJson) {
        this.currentStoreId = Number(storeId)
        this.currentStore = JSON.parse(storeJson)
      }
    },

    // Auth
    async doLoginStaff(payload) { return (await http.post('/auth/login/staff', payload)).data },
    async doLoginSuperadmin(payload) { return (await http.post('/auth/login/superadmin', payload)).data },

    // Master data
    async fetchToppings() {
      const res = await http.get('/master/toppings')
      this.toppings = res.data.content
      return res.data
    },
    async fetchBumbu() {
      const res = await http.get('/master/bumbu')
      this.bumbuList = res.data.content
      return res.data
    },
    async fetchSizes() {
      const res = await http.get('/master/sizes')
      this.sizes = res.data.content
      return res.data
    },
    async fetchPaymentMethods() {
      const res = await http.get('/master/payment-methods')
      this.paymentMethods = res.data.content
      return res.data
    },
    async fetchAdditionals() {
      const res = await http.get('/master/additionals')
      return res.data
    },
    async fetchActivePromos() {
      const res = await http.get('/master/active-promos')
      return res.data
    },

    // Orders
    async createOrder(payload) { return (await http.post('/orders', payload)).data },
    async fetchOrders(params) { return (await http.get('/orders', { params })).data },
    async fetchOrderById(id) { return (await http.get(`/orders/${id}`)).data },
    async deleteOrder(id) { return (await http.delete(`/orders/${id}`)).data },

    // Dashboard
    async fetchDashboardStats(params) { return (await http.get('/dashboard/statistics', { params })).data },
    async fetchStaffList() { return (await http.get('/dashboard/staff-list')).data },
    async fetchReports(params) { return (await http.get('/dashboard/reports', { params })).data },
    async fetchAttendance(params) { return (await http.get('/dashboard/attendance', { params })).data },
    async fetchDailyRecap(params) { return (await http.get('/dashboard/daily-recap', { params })).data },
    async fetchToppingStock(params) { return (await http.get('/dashboard/topping-stock', { params })).data },
    async fetchAnalytics(params) { return (await http.get('/dashboard/analytics', { params })).data },

    // SOP Checklist
    async fetchSopChecklist(params) { return (await http.get('/sop/checklist', { params })).data },
    async saveSopChecklist(payload) { return (await http.post('/sop/checklist', payload)).data },
    async fetchSopChecklistAdmin(params) { return (await http.get('/sop/checklist/admin', { params })).data },

    // Quality Check
    async fetchQualityCheck(params) { return (await http.get('/quality/check', { params })).data },
    async saveQualityCheck(payload) { return (await http.post('/quality/check', payload)).data },
    async fetchQualityCheckAdmin(params) { return (await http.get('/quality/admin', { params })).data },
    async fetchQualityCheckHistory(params) { return (await http.get('/quality/admin/history', { params })).data },

    // Admin - Toppings
    async adminFetchToppings(params) { return (await http.get('/admin/toppings', { params })).data },
    async adminCreateTopping(payload) { return (await http.post('/admin/toppings', payload)).data },
    async adminUpdateTopping(id, payload) { return (await http.put(`/admin/toppings/${id}`, payload)).data },
    async adminDeleteTopping(id) { return (await http.delete(`/admin/toppings/${id}`)).data },

    // Admin - Bumbu
    async adminFetchAdditionals(params) { return (await http.get('/admin/additionals', { params })).data },
    async adminCreateAdditional(payload) { return (await http.post('/admin/additionals', payload)).data },
    async adminUpdateAdditional(id, payload) { return (await http.put(`/admin/additionals/${id}`, payload)).data },
    async adminDeleteAdditional(id) { return (await http.delete(`/admin/additionals/${id}`)).data },

    async adminFetchBumbu(params) { return (await http.get('/admin/bumbu', { params })).data },
    async adminCreateBumbu(payload) { return (await http.post('/admin/bumbu', payload)).data },
    async adminUpdateBumbu(id, payload) { return (await http.put(`/admin/bumbu/${id}`, payload)).data },
    async adminDeleteBumbu(id) { return (await http.delete(`/admin/bumbu/${id}`)).data },

    // Admin - Menu Sizes
    async adminFetchMenuSizes(params) { return (await http.get('/admin/menu-sizes', { params })).data },
    async adminCreateMenuSize(payload) { return (await http.post('/admin/menu-sizes', payload)).data },
    async adminUpdateMenuSize(id, payload) { return (await http.put(`/admin/menu-sizes/${id}`, payload)).data },
    async adminDeleteMenuSize(id) { return (await http.delete(`/admin/menu-sizes/${id}`)).data },

    // Members
    async fetchMembers(params) { return (await http.get('/members', { params })).data },
    async searchMemberByPhone(phone) { return (await http.get('/members/search-phone', { params: { phone } })).data },
    async fetchMemberById(id) { return (await http.get(`/members/${id}`)).data },
    async fetchMemberOrders(id, params) { return (await http.get(`/members/${id}/orders`, { params })).data },
    async createMember(payload) { return (await http.post('/members', payload)).data },
    async updateMember(id, payload) { return (await http.put(`/members/${id}`, payload)).data },
    async deleteMember(id) { return (await http.delete(`/members/${id}`)).data },

    // Admin - Stock
    async adminFetchStocks(params) { return (await http.get('/admin/stocks', { params })).data },
    async adminCreateStock(payload) { return (await http.post('/admin/stocks', payload)).data },
    async adminUpdateStock(id, payload) { return (await http.put(`/admin/stocks/${id}`, payload)).data },
    async adminDeleteStock(id) { return (await http.delete(`/admin/stocks/${id}`)).data },

    // Admin - Expense Categories
    async adminFetchExpenseCategories(params) { return (await http.get('/admin/expense-categories', { params })).data },
    async adminCreateExpenseCategory(payload) { return (await http.post('/admin/expense-categories', payload)).data },
    async adminUpdateExpenseCategory(id, payload) { return (await http.put(`/admin/expense-categories/${id}`, payload)).data },
    async adminDeleteExpenseCategory(id) { return (await http.delete(`/admin/expense-categories/${id}`)).data },

    // Admin - Expenses
    async adminFetchExpenses(params) { return (await http.get('/admin/expenses', { params })).data },
    async adminCreateExpense(payload) { return (await http.post('/admin/expenses', payload)).data },
    async adminUpdateExpense(id, payload) { return (await http.put(`/admin/expenses/${id}`, payload)).data },
    async adminDeleteExpense(id) { return (await http.delete(`/admin/expenses/${id}`)).data },

    // Update Order (admin)
    async updateOrder(id, payload) { return (await http.put(`/orders/${id}`, payload)).data },

    // Staff Expenses
    async fetchStaffExpenseCategories() { return (await http.get('/staff-expenses/categories')).data },
    async fetchStaffExpenses(params) { return (await http.get('/staff-expenses', { params })).data },
    async createStaffExpense(payload) { return (await http.post('/staff-expenses', payload)).data },
    async updateStaffExpense(id, payload) { return (await http.put(`/staff-expenses/${id}`, payload)).data },
    async deleteStaffExpense(id) { return (await http.delete(`/staff-expenses/${id}`)).data },
    async fetchStaffExpensesAdmin(params) { return (await http.get('/staff-expenses/admin', { params })).data },

    // Stock Opname
    async fetchStockOpname(params) { return (await http.get('/stock-opname', { params })).data },
    async saveStockOpname(payload) { return (await http.post('/stock-opname', payload)).data },
    async fetchStockOpnameAdmin(params) { return (await http.get('/stock-opname/admin', { params })).data },

    // Promos
    async fetchPromos(params) { return (await http.get('/promos', { params })).data },
    async validatePromo(code, subtotal) { return (await http.get('/promos/validate', { params: { code, subtotal } })).data },
    async fetchPromoById(id) { return (await http.get(`/promos/${id}`)).data },
    async createPromo(payload) { return (await http.post('/promos', payload)).data },
    async updatePromo(id, payload) { return (await http.put(`/promos/${id}`, payload)).data },
    async deletePromo(id) { return (await http.delete(`/promos/${id}`)).data },

    // Admin - Staff Management
    async adminFetchStaff(params) { return (await http.get('/admin/staff', { params })).data },
    async adminCreateStaff(payload) { return (await http.post('/admin/staff', payload)).data },
    async adminUpdateStaff(id, payload) { return (await http.put(`/admin/staff/${id}`, payload)).data },
    async adminDeleteStaff(id) { return (await http.delete(`/admin/staff/${id}`)).data },

    // Admin - Supplier Management
    async adminFetchSuppliers(params) { return (await http.get('/admin/suppliers', { params })).data },
    async adminCreateSupplier(payload) { return (await http.post('/admin/suppliers', payload)).data },
    async adminUpdateSupplier(id, payload) { return (await http.put(`/admin/suppliers/${id}`, payload)).data },
    async adminDeleteSupplier(id) { return (await http.delete(`/admin/suppliers/${id}`)).data },

    // Shift Management
    async fetchActiveShift() { return (await http.get('/shifts/active')).data },
    async openShift(payload) { return (await http.post('/shifts/open', payload)).data },
    async closeShift(payload) { return (await http.post('/shifts/close', payload)).data },
    async fetchShiftHistory(params) { return (await http.get('/shifts/history', { params })).data },
    async fetchShiftHistoryAdmin(params) { return (await http.get('/shifts/admin', { params })).data },

    // Admin - Finance / Kas
    async adminFetchFinance(params) { return (await http.get('/admin/finance', { params })).data },
    async adminFetchFinanceSummary() { return (await http.get('/admin/finance/summary')).data },
    async adminFetchFinanceCategories() { return (await http.get('/admin/finance/categories')).data },
    async adminCreateFinance(payload) { return (await http.post('/admin/finance', payload)).data },
    async adminUpdateFinance(id, payload) { return (await http.put(`/admin/finance/${id}`, payload)).data },
    async adminDeleteFinance(id) { return (await http.delete(`/admin/finance/${id}`)).data },

    // Stock Packaging
    async createPackaging(payload) { return (await http.post('/stock-packaging', payload)).data },
    async fetchPackaging(params) { return (await http.get('/stock-packaging', { params })).data },
    async fetchPackagingSummary() { return (await http.get('/stock-packaging/summary-today')).data },
    async fetchPackagingAdmin(params) { return (await http.get('/stock-packaging/admin', { params })).data },
    async deletePackaging(id) { return (await http.delete(`/stock-packaging/${id}`)).data },

    // Photobooth
    async uploadPhotoStrip(payload) { return (await http.post('/photobooth/upload', payload)).data },

    // Store Management
    async adminFetchStores(params) { return (await http.get('/admin/stores', { params })).data },
    async adminFetchActiveStores() { return (await http.get('/admin/stores/active')).data },
    async adminCreateStore(payload) { return (await http.post('/admin/stores', payload)).data },
    async adminUpdateStore(id, payload) { return (await http.put(`/admin/stores/${id}`, payload)).data },
    async adminDeleteStore(id) { return (await http.delete(`/admin/stores/${id}`)).data },

  },
})
