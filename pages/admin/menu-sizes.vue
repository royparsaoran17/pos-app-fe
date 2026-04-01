<template>
  <AdminCrud
    title="Menu / Ukuran"
    :column-count="9"
    :fetch-fn="store.adminFetchMenuSizes"
    :create-fn="store.adminCreateMenuSize"
    :update-fn="store.adminUpdateMenuSize"
    :delete-fn="store.adminDeleteMenuSize"
    :default-form-data="() => ({ key: '', label: '', price: 0, hpp: 0, max_toppings: null, total_topping_gram: null, sort_order: 0 })"
    :map-row-to-form="(r) => ({ key: r.key, label: r.label, price: r.price, hpp: r.hpp || 0, max_toppings: r.max_toppings, total_topping_gram: r.total_topping_gram, sort_order: r.sort_order })"
    :map-form-to-payload="mapPayload"
  >
    <template #table-head>
      <th>Key</th>
      <th>Label</th>
      <th>Harga</th>
      <th>HPP</th>
      <th>Margin</th>
      <th>Maks Topping</th>
      <th>Total Gram Topping</th>
    </template>
    <template #table-row="{ row }">
      <td><code>{{ row.key }}</code></td>
      <td class="fw-600">{{ row.label }}</td>
      <td class="text-primary fw-600">{{ formatRupiah(row.price) }}</td>
      <td class="text-danger fw-600">{{ formatRupiah(row.hpp || 0) }}</td>
      <td>
        <span v-if="row.hpp" :class="(row.price - row.hpp) >= 0 ? 'text-success fw-600' : 'text-danger fw-600'">
          {{ formatRupiah(row.price - row.hpp) }}
          <span class="fz-11">({{ Math.round(((row.price - row.hpp) / row.price) * 100) }}%)</span>
        </span>
        <span v-else class="text-muted fz-12">-</span>
      </td>
      <td>{{ row.max_toppings ?? 'Tanpa batas' }}</td>
      <td>{{ row.total_topping_gram ? row.total_topping_gram + 'g' : '-' }}</td>
    </template>
    <template #form="{ form, isEditing }">
      <div class="mb-3" v-if="!isEditing">
        <label class="form-label fw-600 fz-14">Key (unik, huruf besar)</label>
        <input v-model="form.key" class="form-control" placeholder="cth: JUMBO" />
        <div class="fz-12 text-muted mt-1">Key digunakan sebagai identifier unik, tidak bisa diubah setelah dibuat</div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-600 fz-14">Label</label>
        <input v-model="form.label" class="form-control" placeholder="cth: Jumbo" />
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6">
          <label class="form-label fw-600 fz-14">Harga Jual (Rp)</label>
          <input v-model.number="form.price" type="number" class="form-control" placeholder="cth: 20000" />
        </div>
        <div class="col-6">
          <label class="form-label fw-600 fz-14">HPP (Rp)</label>
          <input v-model.number="form.hpp" type="number" class="form-control" placeholder="cth: 8000" />
          <div class="fz-12 text-muted mt-1">Harga Pokok Penjualan per item</div>
        </div>
      </div>
      <div v-if="form.price && form.hpp" class="alert fz-13 py-2 mb-3" :class="(form.price - form.hpp) >= 0 ? 'alert-success' : 'alert-danger'">
        Margin: <strong>{{ formatRupiah(form.price - form.hpp) }}</strong>
        ({{ Math.round(((form.price - form.hpp) / form.price) * 100) }}%)
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6">
          <label class="form-label fw-600 fz-14">Maks Topping</label>
          <input v-model.number="form.max_toppings" type="number" class="form-control" placeholder="Kosongkan untuk tanpa batas" />
          <div class="fz-12 text-muted mt-1">Kosongkan atau 0 untuk tanpa batas</div>
        </div>
        <div class="col-6">
          <label class="form-label fw-600 fz-14">Total Gram Topping</label>
          <input v-model.number="form.total_topping_gram" type="number" class="form-control" placeholder="cth: 150" />
          <div class="fz-12 text-muted mt-1">Total gram topping untuk ukuran ini (misal Thinwall=150g, Large=250g). Gram dibagi rata ke semua topping yg dipilih.</div>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-600 fz-14">Urutan Tampil</label>
        <input v-model.number="form.sort_order" type="number" class="form-control" />
      </div>
    </template>
  </AdminCrud>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah } from '~/utils/format'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()

const mapPayload = (f) => {
  const payload = { label: f.label, price: f.price, hpp: f.hpp || 0, sort_order: f.sort_order }
  payload.max_toppings = f.max_toppings || null
  payload.total_topping_gram = f.total_topping_gram || null
  if (f.key) payload.key = f.key
  return payload
}
</script>
