<template>
  <AdminCrud
    title="Topping"
    :column-count="5"
    :fetch-fn="store.adminFetchToppings"
    :create-fn="store.adminCreateTopping"
    :update-fn="store.adminUpdateTopping"
    :delete-fn="store.adminDeleteTopping"
    :default-form-data="() => ({ name: '', gram_per_portion: 0 })"
    :map-row-to-form="(r) => ({ name: r.name, gram_per_portion: r.gram_per_portion || 0 })"
    :map-form-to-payload="(f) => ({ name: f.name, gram_per_portion: Number(f.gram_per_portion) || 0 })"
  >
    <template #table-head>
      <th>Nama Topping</th>
      <th>Gram / Porsi</th>
    </template>
    <template #table-row="{ row }">
      <td class="fw-600">{{ row.name }}</td>
      <td>
        <span v-if="row.gram_per_portion" class="badge bg-info">{{ row.gram_per_portion }}g</span>
        <span v-else class="text-muted fz-12">Belum diatur</span>
      </td>
    </template>
    <template #form="{ form }">
      <div class="mb-3">
        <label class="form-label fw-600 fz-14">Nama Topping</label>
        <input v-model="form.name" class="form-control" placeholder="Masukkan nama topping" />
      </div>
      <div class="mb-3">
        <label class="form-label fw-600 fz-14">Gram per Porsi</label>
        <input v-model.number="form.gram_per_portion" type="number" class="form-control" placeholder="cth: 25" min="0" step="0.5" />
        <div class="fz-12 text-muted mt-1">
          Berat (gram) untuk 1 porsi topping. Jika customer pilih lebih sedikit topping dari maks, porsi akan dibagi rata ke topping yang dipilih.
          <br />
          <strong>Contoh:</strong> Ukuran maks 4 topping, customer pilih 1 topping &rarr; topping tersebut dapat 4x gram porsi.
        </div>
      </div>
    </template>
  </AdminCrud>
</template>

<script setup>
import { useMainStore } from '~/stores'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()
</script>
