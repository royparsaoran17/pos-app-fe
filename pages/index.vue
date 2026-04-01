<template>
  <div>
    <div class="row">
      <!-- LEFT: Order Form -->
      <div class="col-lg-7">
        <div class="order-card">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-700 mb-0">
              <i class="bi bi-bag-plus me-2"></i>Item #{{ orderItems.length + 1 }}
            </h5>
          </div>

          <!-- SIZE SELECTION (dynamic from DB) -->
          <div class="mb-4">
            <label class="fw-600 fz-14 mb-2 d-block">Pilih Ukuran</label>
            <div class="row g-2">
              <div v-for="size in sizes" :key="size.key" class="col-6 col-md-3">
                <div
                  class="size-btn"
                  :class="{ selected: currentItem.size === size.key }"
                  @click="selectSize(size.key)"
                >
                  <div class="size-name">{{ size.label }}</div>
                  <div class="size-price">{{ formatRupiah(size.price) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- TOPPING SELECTION -->
          <div class="mb-4">
            <label class="fw-600 fz-14 mb-1 d-block">
              Pilih Topping
              <span v-if="maxToppings" class="text-muted fz-12">
                (maks {{ maxToppings }}, dipilih: {{ currentItem.topping_ids.length }})
              </span>
              <span v-else class="text-muted fz-12">
                (tanpa batas{{ currentTotalGram ? ', total ' + currentTotalGram + 'g' : '' }})
              </span>
            </label>
            <div class="mt-2">
              <span
                v-for="topping in toppings"
                :key="topping.id"
                class="topping-chip"
                :class="{
                  selected: currentItem.topping_ids.includes(topping.id),
                  disabled: !currentItem.topping_ids.includes(topping.id) && isToppingLimitReached,
                }"
                @click="toggleTopping(topping.id)"
              >
                <i v-if="currentItem.topping_ids.includes(topping.id)" class="bi bi-check-circle-fill me-1"></i>
                {{ topping.name }}
                <span v-if="currentItem.topping_ids.includes(topping.id) && calcToppingGram(topping) > 0" class="fz-11 ms-1 opacity-75">
                  ({{ calcToppingGram(topping) }}g)
                </span>
              </span>
            </div>
            <!-- Gram info box - limited sizes -->
            <div v-if="currentItem.topping_ids.length > 0 && maxToppings && portionMultiplier > 1" class="alert alert-info fz-12 py-2 mt-2 mb-0">
              <i class="bi bi-info-circle me-1"></i>
              {{ currentItem.topping_ids.length }} topping dipilih dari maks {{ maxToppings }} porsi &rarr; setiap topping dapat <strong>{{ portionMultiplier }}x</strong> porsi
            </div>
            <!-- Gram info box - unlimited sizes with total gram -->
            <div v-if="currentItem.topping_ids.length > 0 && !maxToppings && currentTotalGram" class="alert alert-info fz-12 py-2 mt-2 mb-0">
              <i class="bi bi-info-circle me-1"></i>
              Total {{ currentTotalGram }}g &divide; {{ currentItem.topping_ids.length }} topping = <strong>{{ Math.round(currentTotalGram / currentItem.topping_ids.length) }}g</strong> per topping
            </div>
          </div>

          <!-- BUMBU SELECTION (multi) -->
          <div class="mb-4">
            <label class="fw-600 fz-14 mb-2 d-block">
              Pilih Bumbu <span class="text-muted fz-12">(min 1, dipilih: {{ currentItem.bumbu.length }})</span>
            </label>
            <div>
              <span
                v-for="b in bumbuList"
                :key="b.id"
                class="bumbu-option"
                :class="{ selected: currentItem.bumbu.includes(b.name) }"
                @click="toggleBumbu(b.name)"
              >
                <i v-if="currentItem.bumbu.includes(b.name)" class="bi bi-check-circle-fill me-1"></i>
                {{ b.name }}
              </span>
            </div>
          </div>

          <!-- SPICY LEVEL -->
          <div class="mb-4">
            <label class="fw-600 fz-14 mb-2 d-block">
              Level Pedas: <span class="text-danger fw-700">{{ currentItem.spicy_level }}</span>
              <span class="ms-2">
                <span v-for="n in Math.floor(currentItem.spicy_level)" :key="n">🌶️</span>
              </span>
            </label>
            <input v-model.number="currentItem.spicy_level" type="range" class="spicy-slider" min="0.5" max="5" step="0.5" />
            <div class="d-flex justify-content-between fz-12 text-muted mt-1">
              <span>0.5 (Ringan)</span>
              <span>5 (Sangat Pedas)</span>
            </div>
          </div>

          <!-- ADD ITEM BUTTON -->
          <button class="btn btn-primary w-100 py-2" :disabled="!isCurrentItemValid" @click="addItem">
            <i class="bi bi-plus-lg me-1"></i> Tambah ke Pesanan
          </button>
        </div>
      </div>

      <!-- RIGHT: Order Summary -->
      <div class="col-lg-5">
        <div class="order-card">
          <div class="card-title">
            <i class="bi bi-cart3 me-2"></i>Ringkasan Pesanan ({{ orderItems.length }} item)
          </div>

          <!-- Customer Name -->
          <div class="mb-3">
            <label class="fw-600 fz-14 mb-1">Nama Customer <span class="text-danger">*</span></label>
            <input v-model="customerName" class="form-control fz-13" placeholder="Masukkan nama customer" />
            <div class="fz-12 text-muted mt-1">Nama ini akan dipanggil saat pesanan siap</div>
          </div>

          <div v-if="orderItems.length === 0" class="text-center text-muted py-4">
            <i class="bi bi-cart-x" style="font-size: 40px"></i>
            <p class="mt-2 fz-14">Belum ada item ditambahkan</p>
          </div>

          <div v-for="(item, index) in orderItems" :key="index" class="order-summary-item">
            <button class="remove-item-btn" @click="removeItem(index)"><i class="bi bi-x-circle"></i></button>
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="item-number">{{ index + 1 }}</span>
              <span class="fw-600">{{ getSizeLabel(item.size) }}</span>
              <span class="text-primary fw-600 fz-13">{{ formatRupiah(getSizePrice(item.size)) }}</span>
            </div>
            <div class="fz-12 text-muted">
              <div><strong>Topping:</strong> {{ getToppingNamesWithGram(item) }}</div>
              <div><strong>Bumbu:</strong> {{ Array.isArray(item.bumbu) ? item.bumbu.join(', ') : item.bumbu }}</div>
              <div><strong>Level Pedas:</strong> {{ item.spicy_level }}</div>
            </div>
          </div>

          <template v-if="orderItems.length > 0">
            <!-- Member (optional) -->
            <div class="mt-3">
              <label class="fw-600 fz-14 mb-1">No. HP Pembeli (opsional)</label>
              <div class="input-group">
                <input v-model="memberPhone" class="form-control fz-13" placeholder="08xxxxxxxxxx" @blur="lookupMember" />
                <button v-if="memberPhone" class="btn btn-outline-secondary btn-sm" @click="clearMember">
                  <i class="bi bi-x"></i>
                </button>
              </div>
              <div v-if="memberInfo" class="fz-12 mt-1 text-success">
                <i class="bi bi-check-circle me-1"></i>
                {{ memberInfo.name || 'Member' }} - {{ memberInfo.total_orders }} pesanan ({{ formatRupiah(memberInfo.total_spent) }})
              </div>
              <div v-if="memberPhone && !memberInfo" class="fz-12 mt-1">
                <input v-model="memberName" class="form-control form-control-sm fz-12 mt-1" placeholder="Nama pembeli (opsional, member baru)" />
              </div>
            </div>

            <!-- Promo Code -->
            <div class="mt-3">
              <label class="fw-600 fz-14 mb-1">Kode Promo (opsional)</label>
              <div class="input-group">
                <input v-model="promoCode" class="form-control fz-13" placeholder="Masukkan kode promo" :disabled="promoApplied" />
                <button v-if="!promoApplied" class="btn btn-outline-primary btn-sm" :disabled="!promoCode || validatingPromo" @click="applyPromo">
                  {{ validatingPromo ? '...' : 'Terapkan' }}
                </button>
                <button v-else class="btn btn-outline-danger btn-sm" @click="clearPromo">
                  <i class="bi bi-x"></i> Hapus
                </button>
              </div>
              <div v-if="promoError" class="fz-12 text-danger mt-1">{{ promoError }}</div>
              <div v-if="promoApplied" class="fz-12 text-success mt-1">
                <i class="bi bi-check-circle me-1"></i>
                {{ promoApplied.promo.name }} - Diskon {{ formatRupiah(promoApplied.discount_amount) }}
              </div>
            </div>

            <!-- Payment Method -->
            <div class="mt-3">
              <label class="fw-600 fz-14 mb-2 d-block">Metode Pembayaran</label>
              <div class="row g-2">
                <div v-for="pm in paymentMethods" :key="pm.key" class="col-6">
                  <div class="payment-btn" :class="{ selected: paymentMethod === pm.key }" @click="paymentMethod = pm.key">
                    <i :class="getPaymentIcon(pm.key)" class="me-1"></i>
                    {{ pm.label }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="mt-3">
              <label class="fw-600 fz-14 mb-1">Catatan (opsional)</label>
              <textarea v-model="notes" class="form-control fz-13" rows="2" placeholder="Catatan tambahan..."></textarea>
            </div>

            <!-- Total & Submit -->
            <div class="mt-3 pt-3 border-top">
              <div class="d-flex justify-content-between fz-14 mb-1">
                <span>Subtotal</span>
                <span class="fw-600">{{ formatRupiah(subtotal) }}</span>
              </div>
              <div v-if="promoApplied" class="d-flex justify-content-between fz-14 mb-1 text-success">
                <span>Diskon ({{ promoApplied.promo.code }})</span>
                <span class="fw-600">-{{ formatRupiah(promoApplied.discount_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span class="fw-700 fz-20">Total</span>
                <span class="fw-700 fz-20 text-primary">{{ formatRupiah(totalPrice) }}</span>
              </div>

              <button
                class="btn btn-success w-100 py-2 fw-600"
                :disabled="!paymentMethod || !customerName.trim() || submitting"
                @click="submitOrder"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-circle me-1"></i>
                {{ submitting ? 'Memproses...' : 'Selesai & Cetak Struk' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Auto-print area (both receipts, page-break between) -->
    <div v-if="lastOrder" class="print-only-area">
      <ReceiptPrint :order="lastOrder" :toppings="toppings" :sizes="sizes" />
      <div class="page-break"></div>
      <ReceiptKitchen :order="lastOrder" :sizes="sizes" />
    </div>

    <!-- Receipt Modal (for manual reprint) -->
    <div v-if="showReceipt" class="modal d-block no-print" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header py-2">
            <h6 class="modal-title fw-700 fz-14">Pesanan Berhasil</h6>
            <button class="btn-close" @click="closeReceipt"></button>
          </div>
          <div class="modal-body text-center py-4">
            <i class="bi bi-check-circle text-success" style="font-size: 48px"></i>
            <p class="mt-3 fw-600">Struk Customer & Struk Dapur sudah dicetak</p>
            <p class="fz-13 text-muted">No. Order: {{ lastOrder?.order_number }} &bull; Antrian: {{ lastOrder?.queue_number }}</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button class="btn btn-outline-primary btn-sm" @click="printReceipt">
              <i class="bi bi-printer me-1"></i> Cetak Ulang
            </button>
            <button class="btn btn-primary btn-sm" @click="closeReceipt">Selesai</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()

const toppings = ref([])
const bumbuList = ref([])
const sizes = ref([])
const paymentMethods = ref([
  { key: 'CASH', label: 'Cash' },
  { key: 'QRIS', label: 'QRIS' },
  { key: 'PROMO', label: 'Promo' },
  { key: 'GOJEK', label: 'Gojek' },
])

const defaultItem = () => ({ size: null, topping_ids: [], bumbu: [], spicy_level: 2 })

const currentItem = ref(defaultItem())
const orderItems = ref([])
const customerName = ref('')
const paymentMethod = ref(null)
const notes = ref('')
const submitting = ref(false)
const showReceipt = ref(false)
const lastOrder = ref(null)

// Member
const memberPhone = ref('')
const memberName = ref('')
const memberInfo = ref(null)

// Promo
const promoCode = ref('')
const promoApplied = ref(null)
const promoError = ref('')
const validatingPromo = ref(false)

// Build sizeMap from dynamic DB data
const sizeMap = computed(() => {
  const map = {}
  sizes.value.forEach((s) => { map[s.key] = s })
  return map
})

const maxToppings = computed(() => {
  if (!currentItem.value.size) return null
  return sizeMap.value[currentItem.value.size]?.max_toppings ?? null
})

const currentTotalGram = computed(() => {
  if (!currentItem.value.size) return null
  return sizeMap.value[currentItem.value.size]?.total_topping_gram ?? null
})

const isToppingLimitReached = computed(() => {
  if (!maxToppings.value) return false
  return currentItem.value.topping_ids.length >= maxToppings.value
})

const isCurrentItemValid = computed(() => {
  return currentItem.value.size && currentItem.value.bumbu.length > 0 && currentItem.value.spicy_level
})

const toggleBumbu = (name) => {
  const idx = currentItem.value.bumbu.indexOf(name)
  if (idx > -1) {
    currentItem.value.bumbu.splice(idx, 1)
  } else {
    currentItem.value.bumbu.push(name)
  }
}

const subtotal = computed(() => {
  return orderItems.value.reduce((sum, item) => {
    return sum + (sizeMap.value[item.size]?.price || 0)
  }, 0)
})

const totalPrice = computed(() => {
  const disc = promoApplied.value?.discount_amount || 0
  return Math.max(0, subtotal.value - disc)
})

const selectSize = (key) => {
  currentItem.value.size = key
  const limit = sizeMap.value[key]?.max_toppings
  if (limit && currentItem.value.topping_ids.length > limit) {
    currentItem.value.topping_ids = currentItem.value.topping_ids.slice(0, limit)
  }
}

const toggleTopping = (id) => {
  const idx = currentItem.value.topping_ids.indexOf(id)
  if (idx > -1) {
    currentItem.value.topping_ids.splice(idx, 1)
  } else {
    if (isToppingLimitReached.value) return
    currentItem.value.topping_ids.push(id)
  }
}

const addItem = () => {
  orderItems.value.push({ ...currentItem.value, topping_ids: [...currentItem.value.topping_ids], bumbu: [...currentItem.value.bumbu] })
  currentItem.value = defaultItem()
  // Re-validate promo when items change
  if (promoApplied.value) clearPromo()
}

const removeItem = (index) => {
  orderItems.value.splice(index, 1)
  if (promoApplied.value) clearPromo()
}

const getSizeLabel = (key) => sizeMap.value[key]?.label || key
const getSizePrice = (key) => sizeMap.value[key]?.price || 0

const getToppingNames = (ids) => {
  if (!ids || ids.length === 0) return '-'
  return ids.map((id) => toppings.value.find((t) => t.id === id)?.name || id).join(', ')
}

// Portion multiplier: if max_toppings=4 and user picks 1 topping, multiplier=4
const portionMultiplier = computed(() => {
  const max = maxToppings.value
  const selected = currentItem.value.topping_ids.length
  if (!max || !selected) return 1
  return Math.floor(max / selected)
})

// Calculate gram for a single topping in the current item form
const calcToppingGram = (topping) => {
  const selected = currentItem.value.topping_ids.length
  if (!selected) return 0

  // Unlimited sizes (Large/Thinwall): total_topping_gram / number of toppings
  const totalGram = currentTotalGram.value
  if (!maxToppings.value && totalGram) {
    return Math.round(totalGram / selected)
  }

  // Limited sizes (Small/Medium): gram_per_portion * multiplier
  if (!topping.gram_per_portion) return 0
  return Math.round(topping.gram_per_portion * portionMultiplier.value * 10) / 10
}

// Calculate gram for a topping in a saved order item (order summary)
const calcItemToppingGram = (item, toppingId) => {
  const selected = item.topping_ids.length
  if (!selected) return 0

  const sizeData = sizeMap.value[item.size]

  // Unlimited sizes: total_topping_gram / number of toppings
  if (!sizeData?.max_toppings && sizeData?.total_topping_gram) {
    return Math.round(sizeData.total_topping_gram / selected)
  }

  // Limited sizes: gram_per_portion * multiplier
  const topping = toppings.value.find(t => t.id === toppingId)
  if (!topping?.gram_per_portion) return 0
  const max = sizeData?.max_toppings
  if (!max) return topping.gram_per_portion
  const multiplier = Math.floor(max / selected)
  return Math.round(topping.gram_per_portion * multiplier * 10) / 10
}

// Topping names with gram info for order summary
const getToppingNamesWithGram = (item) => {
  if (!item.topping_ids || item.topping_ids.length === 0) return '-'
  return item.topping_ids.map((id) => {
    const t = toppings.value.find((tp) => tp.id === id)
    if (!t) return id
    const gram = calcItemToppingGram(item, id)
    return gram > 0 ? `${t.name} (${gram}g)` : t.name
  }).join(', ')
}

const getPaymentIcon = (key) => {
  const icons = { CASH: 'bi bi-cash-stack', QRIS: 'bi bi-qr-code', PROMO: 'bi bi-tag', GOJEK: 'bi bi-bicycle' }
  return icons[key] || 'bi bi-credit-card'
}

// Member lookup
const lookupMember = async () => {
  if (!memberPhone.value || memberPhone.value.length < 8) { memberInfo.value = null; return }
  try {
    const result = await store.searchMemberByPhone(memberPhone.value)
    memberInfo.value = result.content
  } catch { memberInfo.value = null }
}

const clearMember = () => {
  memberPhone.value = ''
  memberName.value = ''
  memberInfo.value = null
}

// Promo
const applyPromo = async () => {
  promoError.value = ''
  validatingPromo.value = true
  try {
    const result = await store.validatePromo(promoCode.value, subtotal.value)
    promoApplied.value = result.content
  } catch (err) {
    promoError.value = err.response?.data?.message || 'Kode promo tidak valid'
    promoApplied.value = null
  } finally { validatingPromo.value = false }
}

const clearPromo = () => {
  promoCode.value = ''
  promoApplied.value = null
  promoError.value = ''
}

const submitOrder = async () => {
  submitting.value = true
  try {
    const payload = {
      items: orderItems.value,
      customer_name: customerName.value.trim(),
      payment_method: paymentMethod.value,
      notes: notes.value || undefined,
      member_phone: memberPhone.value || undefined,
      member_name: memberName.value || undefined,
      promo_code: promoApplied.value?.promo?.code || undefined,
    }
    const result = await store.createOrder(payload)
    lastOrder.value = result.content

    // Auto-print both receipts
    await nextTick()
    window.print()
    showReceipt.value = true

    // Reset form
    orderItems.value = []
    customerName.value = ''
    paymentMethod.value = null
    notes.value = ''
    currentItem.value = defaultItem()
    clearMember()
    clearPromo()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal membuat pesanan')
  } finally { submitting.value = false }
}

const printReceipt = () => { window.print() }
const closeReceipt = () => { showReceipt.value = false; lastOrder.value = null }

onMounted(async () => {
  try {
    const [toppingRes, bumbuRes, sizeRes] = await Promise.all([
      store.fetchToppings(),
      store.fetchBumbu(),
      store.fetchSizes(),
    ])
    toppings.value = toppingRes.content
    bumbuList.value = bumbuRes.content
    sizes.value = sizeRes.content
  } catch (err) {
    console.error('Failed to load master data:', err)
  }
})
</script>
