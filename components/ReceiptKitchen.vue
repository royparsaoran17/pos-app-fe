<template>
  <div class="receipt-print-area">
    <div class="receipt">
      <div class="receipt-header">
        <div style="font-size: 16px; font-weight: bold">KITCHEN ORDER</div>
        <div style="font-size: 10px; margin-top: 4px">{{ formatDate(order?.created_at) }}</div>
      </div>

      <!-- Queue Number -->
      <div v-if="order?.queue_number" style="text-align:center; margin: 8px 0; border: 2px solid #000; padding: 6px; border-radius: 4px">
        <div style="font-size: 11px; font-weight: bold">ANTRIAN</div>
        <div style="font-size: 36px; font-weight: bold; line-height: 1.2">{{ order.queue_number }}</div>
      </div>

      <!-- Customer Name - prominent for staff to call -->
      <div v-if="order?.customer_name" style="text-align:center; margin: 6px 0; padding: 6px; border: 2px solid #000; border-radius: 4px; background: #000; color: #fff">
        <div style="font-size: 10px; font-weight: bold; letter-spacing: 1px">CUSTOMER</div>
        <div style="font-size: 18px; font-weight: bold; letter-spacing: 0.5px">{{ order.customer_name }}</div>
      </div>

      <div class="receipt-row">
        <span>No. Order</span>
        <span>{{ order?.order_number }}</span>
      </div>
      <div class="receipt-row">
        <span>Kasir</span>
        <span>{{ order?.staff?.name }}</span>
      </div>

      <div class="receipt-divider" style="border-top: 2px dashed #000"></div>

      <div v-for="(item, idx) in order?.order_items" :key="idx" style="margin-bottom: 12px">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px">
          {{ idx + 1 }}. {{ getSizeLabel(item.menu_size_key) }}{{ isFood(item) ? '' : ' (Minuman)' }}
        </div>
        <div v-if="isFood(item)" style="padding-left: 4px; line-height: 1.6">
          <!-- Topping with gram -->
          <div style="font-weight: bold; font-size: 12px; margin-top: 4px">Topping:</div>
          <div v-if="!item.toppings || item.toppings.length === 0" style="padding-left: 8px; font-size: 12px">-</div>
          <div v-for="t in item.toppings" :key="t.id" style="padding-left: 8px; font-size: 12px; display: flex; justify-content: space-between; align-items: center">
            <span>&bull; {{ t.topping?.name }}</span>
            <span v-if="calcGram(item, t)" style="font-weight: bold; font-size: 13px; border: 2px solid #000; padding: 1px 6px; border-radius: 4px; min-width: 50px; text-align: center">
              {{ calcGram(item, t) }}g
            </span>
          </div>

          <!-- Multiplier info - limited sizes -->
          <div v-if="getMaxToppings(item) && getMultiplier(item) > 1" style="font-size: 10px; padding-left: 8px; font-style: italic; margin-top: 2px">
            * porsi x{{ getMultiplier(item) }} ({{ item.toppings?.length }} dari {{ getMaxToppings(item) }} topping)
          </div>
          <!-- Gram info - unlimited sizes -->
          <div v-if="!getMaxToppings(item) && getSizeData(item)?.total_topping_gram" style="font-size: 10px; padding-left: 8px; font-style: italic; margin-top: 2px">
            * {{ getSizeData(item).total_topping_gram }}g &divide; {{ item.toppings?.length }} topping
          </div>

          <div style="margin-top: 4px"><span style="font-weight: bold; font-size: 12px">Bumbu:</span> {{ item.bumbu }}</div>
          <div><span style="font-weight: bold; font-size: 12px">Pedas:</span> {{ item.spicy_level }} <span v-for="n in Math.floor(item.spicy_level)" :key="n">🌶️</span></div>
        </div>
        <div v-if="item.additionals?.length" style="padding-left: 4px; margin-top: 4px">
          <div style="font-weight: bold; font-size: 12px">Additional:</div>
          <div v-for="add in item.additionals" :key="add.id" style="padding-left: 8px; font-size: 12px">
            &bull; {{ add.additional?.name }}{{ add.qty > 1 ? ' x' + add.qty : '' }}
          </div>
        </div>
      </div>

      <div class="receipt-divider" style="border-top: 2px dashed #000"></div>

      <div v-if="order?.notes" style="font-size: 11px; margin-bottom: 4px">
        <strong>Catatan:</strong> {{ order.notes }}
      </div>

      <!-- Repeat customer name at bottom for easy reference -->
      <div v-if="order?.customer_name" style="text-align: center; margin-top: 8px; padding: 4px; border: 1px dashed #000; font-size: 12px">
        <strong>Panggil: {{ order.customer_name }}</strong>
      </div>

      <div style="text-align: center; font-size: 10px; margin-top: 8px">
        --- KITCHEN COPY ---
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '~/utils/format'

const props = defineProps({
  order: Object,
  sizes: Array,
})

const getSizeLabel = (key) => {
  const found = props.sizes?.find(s => s.key === key)
  return found?.label || key
}

const getSizeData = (item) => {
  return props.sizes?.find(s => s.key === item.menu_size_key)
}

const isFood = (item) => {
  return getSizeData(item)?.category !== 'DRINK'
}

const getMaxToppings = (item) => {
  return getSizeData(item)?.max_toppings || 0
}

const getMultiplier = (item) => {
  const maxToppings = getMaxToppings(item)
  const selectedCount = item.toppings?.length || 1
  return (maxToppings && selectedCount) ? Math.floor(maxToppings / selectedCount) : 1
}

const calcGram = (item, toppingEntry) => {
  const selectedCount = item.toppings?.length || 1
  const sizeData = getSizeData(item)

  // Unlimited sizes (Large/Thinwall): total_topping_gram / number of toppings
  if (!sizeData?.max_toppings && sizeData?.total_topping_gram) {
    return Math.round(sizeData.total_topping_gram / selectedCount)
  }

  // Limited sizes (Small/Medium): gram_per_portion * multiplier
  const gram = toppingEntry.topping?.gram_per_portion
  if (!gram) return 0
  const multiplier = getMultiplier(item)
  return Math.round(gram * multiplier * 10) / 10
}
</script>
