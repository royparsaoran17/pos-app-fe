<template>
  <div class="receipt-print-area">
    <div class="receipt">
      <!-- Header with store info -->
      <div class="receipt-header">
        <img src="/logo.png" alt="OMT" style="width:48px;height:48px;object-fit:contain;margin-bottom:4px" />
        <div style="font-size: 16px; font-weight: bold">{{ order?.store?.name || 'Oh My Tongue' }}</div>
        <div v-if="order?.store?.address" style="font-size: 10px; margin-top: 2px; line-height: 1.4">{{ order.store.address }}</div>
        <div v-if="order?.store?.phone" style="font-size: 10px">Tel: {{ order.store.phone }}</div>
        <div style="font-size: 11px; margin-top: 4px">Struk Pembelian</div>
        <div style="font-size: 10px; margin-top: 4px">{{ formatDate(order?.created_at) }}</div>
      </div>

      <!-- Queue Number -->
      <div v-if="order?.queue_number" style="text-align:center; margin: 8px 0; border: 2px solid #000; padding: 6px; border-radius: 4px">
        <div style="font-size: 11px; font-weight: bold">NOMOR ANTRIAN</div>
        <div style="font-size: 32px; font-weight: bold; line-height: 1.2">{{ order.queue_number }}</div>
      </div>

      <!-- Customer Name -->
      <div v-if="order?.customer_name" style="text-align:center; margin: 6px 0; padding: 4px; border: 1px dashed #000; border-radius: 4px">
        <div style="font-size: 10px">NAMA CUSTOMER</div>
        <div style="font-size: 14px; font-weight: bold">{{ order.customer_name }}</div>
      </div>

      <div class="receipt-row">
        <span>No. Order</span>
        <span>{{ order?.order_number }}</span>
      </div>
      <div class="receipt-row">
        <span>Kasir</span>
        <span>{{ order?.staff?.name }}</span>
      </div>
      <div class="receipt-row">
        <span>Pembayaran</span>
        <span>{{ order?.payment_method }}</span>
      </div>
      <div v-if="order?.member" class="receipt-row">
        <span>Member</span>
        <span>{{ order.member.name || order.member.phone }}</span>
      </div>

      <div class="receipt-divider"></div>

      <div v-for="(item, idx) in order?.order_items" :key="idx" style="margin-bottom: 8px">
        <div class="receipt-row" style="font-weight: bold">
          <span>{{ idx + 1 }}. {{ getSizeLabel(item.menu_size_key) }}</span>
          <span>{{ formatRupiah(item.price) }}</span>
        </div>
        <div v-if="isFood(item)" style="font-size: 10px; padding-left: 16px; line-height: 1.5">
          <div>Topping: {{ getToppingNames(item) }}</div>
          <div>Bumbu: {{ item.bumbu }}</div>
          <div>Pedas: {{ item.spicy_level }}</div>
        </div>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-row">
        <span>Subtotal</span>
        <span>{{ formatRupiah(order?.subtotal) }}</span>
      </div>
      <div v-if="order?.discount_amount > 0" class="receipt-row">
        <span>Diskon{{ order?.promo ? ' (' + order.promo.code + ')' : '' }}</span>
        <span>-{{ formatRupiah(order?.discount_amount) }}</span>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-row receipt-total">
        <span>TOTAL</span>
        <span>{{ formatRupiah(order?.total_price) }}</span>
      </div>

      <div class="receipt-divider"></div>

      <!-- Footer with social media CTA -->
      <div style="text-align: center; font-size: 10px; margin-top: 8px; line-height: 1.6">
        <div>Terima kasih atas pembelian Anda!</div>
        <div v-if="order?.store?.instagram || order?.store?.tiktok" style="margin-top: 6px; border-top: 1px dashed #000; padding-top: 6px">
          <div style="font-weight: bold; font-size: 11px">Follow kami yuk!</div>
          <div v-if="order?.store?.instagram" style="margin-top: 2px">
            IG: @{{ order.store.instagram }}
          </div>
          <div v-if="order?.store?.tiktok" style="margin-top: 2px">
            TikTok: @{{ order.store.tiktok }}
          </div>
          <div style="margin-top: 4px; font-size: 9px; font-style: italic">Tag kami & dapatkan kesempatan repost!</div>
        </div>
        <div style="margin-top: 6px">--- Oh My Tongue ---</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatRupiah, formatDate } from '~/utils/format'

const props = defineProps({
  order: Object,
  toppings: Array,
  sizes: Array,
})

const getSizeLabel = (key) => {
  const found = props.sizes?.find(s => s.key === key)
  return found?.label || key
}

const getToppingNames = (item) => {
  if (!item.toppings || item.toppings.length === 0) return '-'
  return item.toppings.map((t) => t.topping?.name || '-').join(', ')
}

const isFood = (item) => {
  const size = props.sizes?.find(s => s.key === item.menu_size_key)
  return size?.category !== 'DRINK'
}
</script>
