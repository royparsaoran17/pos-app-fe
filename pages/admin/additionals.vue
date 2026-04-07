<template>
  <AdminCrud
    title="Additional"
    :column-count="5"
    :fetch-fn="store.adminFetchAdditionals"
    :create-fn="store.adminCreateAdditional"
    :update-fn="store.adminUpdateAdditional"
    :delete-fn="store.adminDeleteAdditional"
    :default-form-data="() => ({ name: '', price: 0, sort_order: 0 })"
    :map-row-to-form="(r) => ({ name: r.name, price: r.price, sort_order: r.sort_order || 0 })"
    :map-form-to-payload="(f) => ({ name: f.name, price: Number(f.price), sort_order: Number(f.sort_order) || 0 })"
  >
    <template #table-head>
      <th>Nama</th>
      <th>Harga</th>
      <th>Urutan</th>
    </template>
    <template #table-row="{ row }">
      <td class="fw-600">{{ row.name }}</td>
      <td>{{ formatRupiah(row.price) }}</td>
      <td>{{ row.sort_order }}</td>
    </template>
    <template #form="{ form }">
      <div class="mb-3">
        <label class="form-label fw-600 fz-14">Nama Additional</label>
        <input v-model="form.name" class="form-control" placeholder="Contoh: Keju, Chili Oil" />
      </div>
      <div class="mb-3">
        <label class="form-label fw-600 fz-14">Harga (Rp)</label>
        <input v-model.number="form.price" type="number" class="form-control" placeholder="3000" />
      </div>
      <div class="mb-3">
        <label class="form-label fw-600 fz-14">Urutan Tampil</label>
        <input v-model.number="form.sort_order" type="number" class="form-control" placeholder="0" />
      </div>
    </template>
  </AdminCrud>
</template>

<script setup>
import { useMainStore } from '~/stores'
import { formatRupiah } from '~/utils/format'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()
</script>
