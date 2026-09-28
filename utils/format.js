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

// Convert a date/ISO string into a Jakarta wall-clock value for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
export function toJakartaDatetimeLocal(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d).reduce((acc, p) => { acc[p.type] = p.value; return acc }, {})
  let hour = parts.hour
  if (hour === '24') hour = '00'
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`
}

// Convert a datetime-local value (Jakarta wall-clock) into an ISO string with +07:00 offset
export function jakartaDatetimeLocalToISO(value) {
  if (!value) return null
  return `${value}:00+07:00`
}

export function todayJakarta() {
  const now = new Date()
  const jkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const y = jkt.getFullYear()
  const m = String(jkt.getMonth() + 1).padStart(2, '0')
  const d = String(jkt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
