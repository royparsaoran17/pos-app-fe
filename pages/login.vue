<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="text-center mb-4">
        <img src="/logo.png" alt="Oh My Tongue" style="width:72px;height:72px;object-fit:contain" />
        <h2 class="mt-2">Oh My Tongue</h2>
        <p class="subtitle">Sistem Kasir</p>
      </div>

      <!-- Role Selection -->
      <div v-if="!selectedRole" class="d-grid gap-3">
        <button class="btn btn-primary btn-lg py-3" @click="selectedRole = 'STAFF'">
          <i class="bi bi-person-badge me-2"></i> Masuk sebagai Staff
        </button>
        <button class="btn btn-outline-primary btn-lg py-3" @click="selectedRole = 'SUPERADMIN'">
          <i class="bi bi-shield-lock me-2"></i> Masuk sebagai Super Admin
        </button>
      </div>

      <!-- Login Form -->
      <form v-else @submit.prevent="handleLogin">
        <button type="button" class="btn btn-sm btn-link text-muted p-0 mb-3" @click="selectedRole = null">
          <i class="bi bi-arrow-left me-1"></i> Kembali
        </button>

        <div class="badge bg-primary mb-3">
          {{ selectedRole === 'STAFF' ? 'Staff' : 'Super Admin' }}
        </div>

        <div class="mb-3">
          <label class="form-label fw-600 fz-14">Email</label>
          <input
            v-model="email"
            type="email"
            class="form-control"
            placeholder="Masukkan email"
            required
          />
          <div v-if="errors.email" class="text-danger fz-12 mt-1">{{ errors.email }}</div>
        </div>

        <div class="mb-3">
          <label class="form-label fw-600 fz-14">Password</label>
          <div class="input-group">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              placeholder="Masukkan password"
              required
            />
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <div v-if="errors.password" class="text-danger fz-12 mt-1">{{ errors.password }}</div>
        </div>

        <div v-if="errors.submit" class="alert alert-danger fz-13 py-2">
          {{ errors.submit }}
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2 mt-2" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'

definePageMeta({ layout: 'default' })

const store = useMainStore()
const router = useRouter()

const selectedRole = ref(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errors = ref({})

const handleLogin = async () => {
  errors.value = {}
  loading.value = true

  try {
    const loginFn = selectedRole.value === 'STAFF'
      ? store.doLoginStaff
      : store.doLoginSuperadmin

    const result = await loginFn({ email: email.value, password: password.value })

    const { access_token, user, stores } = result.content
    localStorage.setItem('pos_token', access_token)
    localStorage.setItem('pos_user', JSON.stringify(user))
    store.setToken(access_token)
    store.setProfile(user)

    // Handle store context
    if (user.role === 'STAFF' && user.store) {
      store.setCurrentStore(user.store)
    } else if (user.role === 'SUPERADMIN' && stores?.length) {
      store.setStores(stores)
      localStorage.setItem('pos_stores', JSON.stringify(stores))
      // Default to first store for superadmin
      if (stores.length === 1) {
        store.setCurrentStore(stores[0])
      }
    }

    if (user.role === 'SUPERADMIN') {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  } catch (err) {
    const msg = err.response?.data?.message || 'Terjadi kesalahan, silakan coba lagi'
    errors.value.submit = msg
  } finally {
    loading.value = false
  }
}
</script>
