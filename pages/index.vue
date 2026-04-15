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
            <label class="fw-700 mb-2 d-block" style="font-size:16px">Pilih Ukuran</label>
            <div class="row g-2">
              <div v-for="size in sizes" :key="size.key" class="col-6 col-md-3">
                <div
                  class="size-btn"
                  :class="{ selected: currentItem.size === size.key }"
                  @click="selectSize(size.key)"
                >
                  <div class="size-name">
                    <i :class="size.category === 'DRINK' ? 'bi bi-cup-straw' : 'bi bi-egg-fried'" class="me-1 fz-12"></i>
                    {{ size.label }}
                  </div>
                  <div class="size-price">{{ formatRupiah(size.price) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOD-ONLY sections: Topping, Bumbu, Spicy -->
          <template v-if="isCurrentSizeFood">
            <!-- TOPPING SELECTION -->
            <div class="mb-4">
              <label class="fw-700 mb-1 d-block" style="font-size:16px">
                Pilih Topping
                <span v-if="maxToppings" class="text-muted fz-12">
                  (maks {{ maxToppings }} porsi, terpakai: {{ currentItem.topping_ids.length }})
                </span>
                <span v-else class="text-muted fz-12">
                  (tanpa batas{{ currentTotalGram ? ', total ' + currentTotalGram + 'g' : '' }}, porsi: {{ currentItem.topping_ids.length }})
                </span>
              </label>
              <div class="topping-grid mt-2">
                <div
                  v-for="topping in toppings"
                  :key="topping.id"
                  class="topping-card"
                  :class="{
                    selected: getToppingQty(topping.id) > 0,
                    disabled: getToppingQty(topping.id) === 0 && isToppingLimitReached,
                  }"
                  @click="toggleTopping(topping.id)"
                >
                  <div class="topping-card-body">
                    <div class="topping-name">{{ topping.name }}</div>
                    <div v-if="getToppingQty(topping.id) > 0 && calcToppingGram(topping) > 0" class="topping-gram">
                      {{ calcToppingGram(topping) }}g
                    </div>
                  </div>
                  <div v-if="getToppingQty(topping.id) > 0" class="topping-qty-controls">
                    <button class="qty-btn" @click.stop="decrementTopping(topping.id)">
                      <i class="bi bi-dash"></i>
                    </button>
                    <span class="qty-value">{{ getToppingQty(topping.id) }}</span>
                    <button class="qty-btn" :disabled="isToppingLimitReached" @click.stop="incrementTopping(topping.id)">
                      <i class="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
              <!-- Gram info box - limited sizes -->
              <div v-if="currentItem.topping_ids.length > 0 && maxToppings && portionMultiplier > 1" class="alert alert-info fz-12 py-2 mt-2 mb-0">
                <i class="bi bi-info-circle me-1"></i>
                {{ currentItem.topping_ids.length }} porsi topping dari maks {{ maxToppings }} &rarr; sisa {{ maxToppings - currentItem.topping_ids.length }} porsi
              </div>
              <!-- Gram info box - unlimited sizes with total gram -->
              <div v-if="currentItem.topping_ids.length > 0 && !maxToppings && currentTotalGram" class="alert alert-info fz-12 py-2 mt-2 mb-0">
                <i class="bi bi-info-circle me-1"></i>
                Total {{ currentTotalGram }}g &divide; {{ currentItem.topping_ids.length }} porsi = <strong>{{ Math.round(currentTotalGram / currentItem.topping_ids.length) }}g</strong> per porsi
              </div>
            </div>

            <!-- BUMBU SELECTION (multi) -->
            <div class="mb-4">
              <label class="fw-700 mb-2 d-block" style="font-size:16px">
                Pilih Bumbu <span class="text-muted fz-12">(min 1, dipilih: {{ currentItem.bumbu.length }})</span>
              </label>
              <div class="d-flex flex-wrap gap-2">
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
              <label class="fw-600 mb-2 d-block" style="font-size:16px">
                Level Pedas: <span class="text-danger fw-700" style="font-size:20px">{{ currentItem.spicy_level }}</span>
                <span class="ms-2">
                  <span v-for="n in Math.floor(currentItem.spicy_level)" :key="n">🌶️</span>
                </span>
              </label>
              <input v-model.number="currentItem.spicy_level" type="range" class="spicy-slider" min="0.5" max="5" step="0.5" />
              <div class="d-flex justify-content-between fz-13 text-muted mt-2">
                <span>0.5 (Ringan)</span>
                <span>5 (Sangat Pedas)</span>
              </div>
            </div>
          </template>

          <!-- DRINK info -->
          <div v-if="currentItem.size && !isCurrentSizeFood" class="mb-4">
            <div class="alert alert-info fz-13 py-2 mb-0">
              <i class="bi bi-cup-straw me-1"></i> Minuman — tidak perlu pilih topping, bumbu, atau level pedas.
            </div>
          </div>

          <!-- ADDITIONAL (Cheese, Chili Oil, etc.) -->
          <div v-if="additionalsList.length > 0" class="mb-4">
            <label class="fw-700 mb-2 d-block" style="font-size:16px">
              Additional <span class="text-muted fz-12">(opsional)</span>
            </label>
            <div class="d-flex flex-wrap gap-2">
              <div
                v-for="add in additionalsList"
                :key="add.id"
                class="additional-chip"
                :class="{ selected: getAdditionalQty(add.id) > 0 }"
                @click="toggleAdditional(add.id)"
              >
                <span class="additional-name">{{ add.name }}</span>
                <span class="additional-price">+{{ formatRupiah(add.price) }}</span>
                <div v-if="getAdditionalQty(add.id) > 0" class="additional-qty-controls" @click.stop>
                  <button class="qty-btn-sm" @click="decrementAdditional(add.id)"><i class="bi bi-dash"></i></button>
                  <span class="qty-val">{{ getAdditionalQty(add.id) }}</span>
                  <button class="qty-btn-sm" @click="incrementAdditional(add.id)"><i class="bi bi-plus"></i></button>
                </div>
              </div>
            </div>
          </div>

          <!-- UPSELL PROMPT: Medium → Thinwall -->
          <div v-if="showUpsell" class="alert alert-warning fz-13 py-2 mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-lightning-charge-fill text-warning"></i>
            <div>
              <strong>Upgrade ke Thinwall?</strong> Hanya +{{ formatRupiah(upsellPriceDiff) }} — dapat lebih banyak topping tanpa batas!
              <button class="btn btn-warning btn-sm ms-2 py-0 px-2 fz-12 fw-600" @click="upgradeToThinwall">
                Upgrade <i class="bi bi-arrow-up-circle ms-1"></i>
              </button>
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
              <span v-if="isItemDrink(item)" class="badge bg-info fz-11">Minuman</span>
              <span class="text-primary fw-600 fz-13">{{ formatRupiah(getSizePrice(item.size)) }}</span>
            </div>
            <div v-if="!isItemDrink(item)" class="fz-12 text-muted">
              <div><strong>Topping:</strong> {{ getToppingNamesWithGram(item) }}</div>
              <div><strong>Bumbu:</strong> {{ Array.isArray(item.bumbu) ? item.bumbu.join(', ') : item.bumbu }}</div>
              <div><strong>Level Pedas:</strong> {{ item.spicy_level }}</div>
            </div>
            <div v-if="item.additionals && item.additionals.length > 0" class="fz-12 text-muted">
              <div><strong>Additional:</strong> {{ getAdditionalSummary(item) }}</div>
            </div>
            <div v-if="getItemAdditionalTotal(item) > 0" class="fz-12 text-success fw-600">
              + {{ formatRupiah(getItemAdditionalTotal(item)) }} (additional)
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

            <!-- Promo / Diskon -->
            <div class="mt-3">
              <label class="fw-600 fz-14 mb-1">Diskon</label>
              <!-- Quick-apply promo suggestions -->
              <div v-if="!promoApplied && activePromos.length > 0" class="d-flex flex-wrap gap-1 mb-2">
                <button
                  v-for="p in activePromos"
                  :key="p.id"
                  class="btn btn-sm promo-suggest-btn"
                  :disabled="validatingPromo"
                  @click="quickApplyPromo(p.code)"
                >
                  <i class="bi bi-tag-fill me-1"></i>
                  {{ p.code }}
                  <span class="fz-11 ms-1 opacity-75">
                    ({{ p.discount_type === 'PERCENTAGE' ? p.discount_value + '%' : formatRupiah(p.discount_value) }})
                  </span>
                </button>
              </div>
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

            <!-- Tau Dari Mana -->
            <div class="mt-3">
              <label class="fw-600 fz-14 mb-2 d-block">Tau Dari Mana?</label>
              <div class="d-flex flex-wrap gap-1">
                <span
                  v-for="ch in acquisitionChannels"
                  :key="ch"
                  class="badge rounded-pill cursor-pointer fz-12 py-1 px-2"
                  :class="acquisitionChannel === ch ? 'bg-primary' : 'bg-light text-dark border'"
                  @click="acquisitionChannel = ch"
                  style="cursor:pointer"
                >
                  {{ ch }}
                </span>
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

const additionalsList = ref([])
const activePromos = ref([])

const defaultItem = () => ({ size: null, topping_ids: [], bumbu: [], spicy_level: 2, additionals: [] })

const currentItem = ref(defaultItem())
const orderItems = ref([])
const customerName = ref('')
const paymentMethod = ref(null)
const notes = ref('')
const acquisitionChannel = ref('Pembeli Lama')
const acquisitionChannels = [
  'Pembeli Lama', 'Kebetulan Lewat', 'Teman', 'Sering Lewat',
  'TikTok', 'Instagram', 'Banner', 'KOL', 'Pembeli Baru',
]
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

const isCurrentSizeFood = computed(() => {
  if (!currentItem.value.size) return true
  return sizeMap.value[currentItem.value.size]?.category !== 'DRINK'
})

const isToppingLimitReached = computed(() => {
  if (!maxToppings.value) return false
  return currentItem.value.topping_ids.length >= maxToppings.value
})

const isCurrentItemValid = computed(() => {
  if (!currentItem.value.size) return false
  // Drinks only need a size selected
  if (!isCurrentSizeFood.value) return true
  // Food needs bumbu + spicy
  return currentItem.value.bumbu.length > 0 && currentItem.value.spicy_level
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
    let itemTotal = sizeMap.value[item.size]?.price || 0
    for (const add of (item.additionals || [])) {
      const addData = additionalsList.value.find(a => a.id === add.additional_id)
      if (addData) itemTotal += addData.price * (add.qty || 1)
    }
    return sum + itemTotal
  }, 0)
})

const totalPrice = computed(() => {
  const disc = promoApplied.value?.discount_amount || 0
  return Math.max(0, subtotal.value - disc)
})

// Default bumbu names (most popular: 94% Asin, 81% Minyak Bawang, 81% Daun Jeruk)
const defaultBumbuNames = ['Asin', 'Minyak Bawang', 'Daun Jeruk']

const selectSize = (key) => {
  const prevSize = currentItem.value.size
  currentItem.value.size = key
  const sizeData = sizeMap.value[key]
  if (sizeData?.category === 'DRINK') {
    currentItem.value.topping_ids = []
    currentItem.value.bumbu = []
    currentItem.value.spicy_level = 0
  } else {
    if (currentItem.value.spicy_level === 0) currentItem.value.spicy_level = 2
    // Auto-select default bumbu if bumbu is empty (new item or switching from drink)
    if (currentItem.value.bumbu.length === 0 || sizeMap.value[prevSize]?.category === 'DRINK') {
      const available = bumbuList.value.map(b => b.name)
      currentItem.value.bumbu = defaultBumbuNames.filter(b => available.includes(b))
    }
    const limit = sizeData?.max_toppings
    if (limit && currentItem.value.topping_ids.length > limit) {
      currentItem.value.topping_ids = currentItem.value.topping_ids.slice(0, limit)
    }
  }
}

// Upsell: suggest Thinwall when ordering Medium
const showUpsell = computed(() => {
  if (!currentItem.value.size) return false
  const sizeData = sizeMap.value[currentItem.value.size]
  if (!sizeData) return false
  // Show upsell for sizes that are not the biggest food size and are FOOD category
  return sizeData.category === 'FOOD' && sizeData.key === 'MEDIUM'
})

const upsellPriceDiff = computed(() => {
  const medium = sizeMap.value['MEDIUM']
  const thinwall = sizeMap.value['THINWALL']
  if (!medium || !thinwall) return 0
  return thinwall.price - medium.price
})

const upgradeToThinwall = () => {
  if (sizeMap.value['THINWALL']) {
    selectSize('THINWALL')
  }
}

// Get quantity of a specific topping
const getToppingQty = (id) => {
  return currentItem.value.topping_ids.filter(tid => tid === id).length
}

const toggleTopping = (id) => {
  const qty = getToppingQty(id)
  if (qty > 0) {
    // Remove all instances of this topping
    currentItem.value.topping_ids = currentItem.value.topping_ids.filter(tid => tid !== id)
  } else {
    if (isToppingLimitReached.value) return
    currentItem.value.topping_ids.push(id)
  }
}

const incrementTopping = (id) => {
  if (isToppingLimitReached.value) return
  currentItem.value.topping_ids.push(id)
}

const decrementTopping = (id) => {
  const idx = currentItem.value.topping_ids.lastIndexOf(id)
  if (idx > -1) {
    currentItem.value.topping_ids.splice(idx, 1)
  }
}

const addItem = () => {
  orderItems.value.push({
    ...currentItem.value,
    topping_ids: [...currentItem.value.topping_ids],
    bumbu: [...currentItem.value.bumbu],
    additionals: [...currentItem.value.additionals],
  })
  currentItem.value = defaultItem()
  if (promoApplied.value) clearPromo()
}

const removeItem = (index) => {
  orderItems.value.splice(index, 1)
  if (promoApplied.value) clearPromo()
}

const getSizeLabel = (key) => sizeMap.value[key]?.label || key
const getSizePrice = (key) => sizeMap.value[key]?.price || 0
const isItemDrink = (item) => sizeMap.value[item.size]?.category === 'DRINK'

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

// Calculate gram for a single topping in the current item form (total gram for all portions of this topping)
const calcToppingGram = (topping) => {
  const totalPortions = currentItem.value.topping_ids.length // includes duplicates
  if (!totalPortions) return 0
  const qty = getToppingQty(topping.id)
  if (!qty) return 0

  const totalGram = currentTotalGram.value
  const max = maxToppings.value

  // Sizes with total_topping_gram (e.g. Large/Thinwall): divide total gram equally among all portions
  if (totalGram) {
    return Math.round((totalGram / totalPortions) * qty)
  }

  // Limited sizes (Small/Medium) with multiplier: gram_per_portion * multiplier * qty
  if (!topping.gram_per_portion) return 0
  if (max) {
    const multiplier = Math.floor(max / totalPortions)
    return Math.round(topping.gram_per_portion * multiplier * qty * 10) / 10
  }

  // Fallback (unlimited, no total_gram set): gram_per_portion * qty
  return Math.round(topping.gram_per_portion * qty * 10) / 10
}

// Calculate gram for a topping in a saved order item (order summary)
const calcItemToppingGram = (item, toppingId) => {
  const totalPortions = item.topping_ids.length
  if (!totalPortions) return 0
  const qty = item.topping_ids.filter(id => id === toppingId).length

  const sizeData = sizeMap.value[item.size]

  // Sizes with total_topping_gram: divide equally among all portions
  if (sizeData?.total_topping_gram) {
    return Math.round((sizeData.total_topping_gram / totalPortions) * qty)
  }

  // Fallback: gram_per_portion based
  const topping = toppings.value.find(t => t.id === toppingId)
  if (!topping?.gram_per_portion) return 0
  const max = sizeData?.max_toppings
  if (max) {
    const multiplier = Math.floor(max / totalPortions)
    return Math.round(topping.gram_per_portion * multiplier * qty * 10) / 10
  }
  return Math.round(topping.gram_per_portion * qty * 10) / 10
}

// Topping names with gram info and quantity for order summary
const getToppingNamesWithGram = (item) => {
  if (!item.topping_ids || item.topping_ids.length === 0) return '-'
  // Group by unique topping IDs with count
  const countMap = {}
  item.topping_ids.forEach(id => { countMap[id] = (countMap[id] || 0) + 1 })
  return Object.entries(countMap).map(([id, qty]) => {
    const t = toppings.value.find((tp) => tp.id === Number(id))
    if (!t) return id
    const gram = calcItemToppingGram(item, Number(id))
    let label = t.name
    if (qty > 1) label += ` x${qty}`
    if (gram > 0) label += ` (${gram}g)`
    return label
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

const quickApplyPromo = (code) => {
  promoCode.value = code
  applyPromo()
}

// Additional helpers
const getAdditionalQty = (id) => {
  const found = currentItem.value.additionals.find(a => a.additional_id === id)
  return found?.qty || 0
}

const toggleAdditional = (id) => {
  const idx = currentItem.value.additionals.findIndex(a => a.additional_id === id)
  if (idx > -1) {
    currentItem.value.additionals.splice(idx, 1)
  } else {
    currentItem.value.additionals.push({ additional_id: id, qty: 1 })
  }
}

const incrementAdditional = (id) => {
  const found = currentItem.value.additionals.find(a => a.additional_id === id)
  if (found) found.qty++
}

const decrementAdditional = (id) => {
  const found = currentItem.value.additionals.find(a => a.additional_id === id)
  if (!found) return
  if (found.qty <= 1) {
    currentItem.value.additionals = currentItem.value.additionals.filter(a => a.additional_id !== id)
  } else {
    found.qty--
  }
}

const getAdditionalSummary = (item) => {
  if (!item.additionals || item.additionals.length === 0) return '-'
  return item.additionals.map(a => {
    const data = additionalsList.value.find(ad => ad.id === a.additional_id)
    let label = data?.name || `#${a.additional_id}`
    if (a.qty > 1) label += ` x${a.qty}`
    return label
  }).join(', ')
}

const getItemAdditionalTotal = (item) => {
  if (!item.additionals || item.additionals.length === 0) return 0
  return item.additionals.reduce((sum, a) => {
    const data = additionalsList.value.find(ad => ad.id === a.additional_id)
    return sum + (data?.price || 0) * (a.qty || 1)
  }, 0)
}

const submitOrder = async () => {
  submitting.value = true
  try {
    const payload = {
      items: orderItems.value,
      customer_name: customerName.value.trim(),
      acquisition_channel: acquisitionChannel.value || undefined,
      payment_method: paymentMethod.value,
      notes: notes.value || undefined,
      member_phone: memberPhone.value || undefined,
      member_name: memberName.value || undefined,
      promo_code: promoApplied.value?.promo?.code || undefined,
    }
    const result = await store.createOrder(payload)
    lastOrder.value = result.content

    // Auto-print both receipts (Bluetooth or browser fallback)
    await nextTick()
    btPrint(lastOrder.value, sizes.value, toppings.value)
    showReceipt.value = true

    // Reset form
    orderItems.value = []
    customerName.value = ''
    paymentMethod.value = null
    notes.value = ''
    acquisitionChannel.value = 'Pembeli Lama'
    currentItem.value = defaultItem()
    clearMember()
    clearPromo()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal membuat pesanan')
  } finally { submitting.value = false }
}

const { printReceipt: btPrint } = usePrinter()
const printReceipt = () => { btPrint(lastOrder.value, sizes.value, toppings.value) }
const closeReceipt = () => { showReceipt.value = false; lastOrder.value = null }

onMounted(async () => {
  try {
    const [toppingRes, bumbuRes, sizeRes, additionalRes, promoRes] = await Promise.all([
      store.fetchToppings(),
      store.fetchBumbu(),
      store.fetchSizes(),
      store.fetchAdditionals(),
      store.fetchActivePromos(),
    ])
    toppings.value = toppingRes.content
    bumbuList.value = bumbuRes.content
    sizes.value = sizeRes.content
    additionalsList.value = additionalRes.content
    activePromos.value = promoRes.content
  } catch (err) {
    console.error('Failed to load master data:', err)
  }
})
</script>
