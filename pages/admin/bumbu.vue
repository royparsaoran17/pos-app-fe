<template>
  <AdminCrud
    title="Bumbu"
    :column-count="4"
    :fetch-fn="store.adminFetchBumbu"
    :create-fn="store.adminCreateBumbu"
    :update-fn="store.adminUpdateBumbu"
    :delete-fn="store.adminDeleteBumbu"
    :default-form-data="() => ({ name: '' })"
    :map-row-to-form="(r) => ({ name: r.name })"
    :map-form-to-payload="(f) => ({ name: f.name })"
  >
    <template #table-head>
      <th>Nama Bumbu</th>
    </template>
    <template #table-row="{ row }">
      <td class="fw-600">{{ row.name }}</td>
    </template>
    <template #form="{ form }">
      <div class="mb-3">
        <label class="form-label fw-600 fz-14">Nama Bumbu</label>
        <input v-model="form.name" class="form-control" placeholder="Masukkan nama bumbu" />
      </div>
    </template>
  </AdminCrud>
</template>

<script setup>
import { useMainStore } from '~/stores'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()
</script>
