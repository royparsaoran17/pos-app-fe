export function formatRupiah(value) {
  if (!value && value !== 0) return 'Rp 0'
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatOrderNumber(num) {
  return num || '-'
}

export function todayJakarta() {
  const now = new Date()
  const jkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const y = jkt.getFullYear()
  const m = String(jkt.getMonth() + 1).padStart(2, '0')
  const d = String(jkt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
