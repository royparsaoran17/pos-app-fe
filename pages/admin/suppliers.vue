<template>
  <div>
    <AdminCrud
      title="Supplier"
      :column-count="7"
      :fetch-fn="store.adminFetchSuppliers"
      :create-fn="store.adminCreateSupplier"
      :update-fn="store.adminUpdateSupplier"
      :delete-fn="store.adminDeleteSupplier"
      :default-form-data="() => ({ name: '', phone: '', address: '', email: '', contact_person: '', notes: '' })"
      :map-row-to-form="(r) => ({ name: r.name, phone: r.phone || '', address: r.address || '', email: r.email || '', contact_person: r.contact_person || '', notes: r.notes || '' })"
    >
      <template #table-head>
        <th>Nama</th>
        <th>Telepon</th>
        <th>Contact Person</th>
        <th>Email</th>
        <th>Alamat</th>
      </template>
      <template #table-row="{ row }">
        <td class="fw-600">{{ row.name }}</td>
        <td>{{ row.phone || '-' }}</td>
        <td>{{ row.contact_person || '-' }}</td>
        <td>{{ row.email || '-' }}</td>
        <td class="fz-13">{{ row.address ? row.address.substring(0, 40) + (row.address.length > 40 ? '...' : '') : '-' }}</td>
      </template>
      <template #form="{ form }">
        <div class="mb-3">
          <label class="form-label fw-600 fz-14">Nama Supplier *</label>
          <input v-model="form.name" class="form-control" placeholder="Nama supplier" />
        </div>
        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="form-label fw-600 fz-14">Telepon</label>
            <input v-model="form.phone" class="form-control" placeholder="08xxx" />
          </div>
          <div class="col-6">
            <label class="form-label fw-600 fz-14">Email</label>
            <input v-model="form.email" type="email" class="form-control" placeholder="email@supplier.com" />
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label fw-600 fz-14">Contact Person</label>
          <input v-model="form.contact_person" class="form-control" placeholder="Nama PIC" />
        </div>
        <div class="mb-3">
          <label class="form-label fw-600 fz-14">Alamat</label>
          <textarea v-model="form.address" class="form-control" rows="2" placeholder="Alamat lengkap"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label fw-600 fz-14">Catatan</label>
          <textarea v-model="form.notes" class="form-control" rows="2" placeholder="Catatan tambahan"></textarea>
        </div>
      </template>
    </AdminCrud>
  </div>
</template>

<script setup>
import { useMainStore } from '~/stores'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const store = useMainStore()
</script>
