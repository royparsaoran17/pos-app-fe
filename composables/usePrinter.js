import { ref, computed, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { formatRupiah, formatDate } from '~/utils/format'

const FEEDBACK_URL = 'http://linktr.ee/ohmytongue'

// Module-level cache — loaded once, shared across all composable instances
let logoBase64Cache = null
let qrBase64Cache = null

const loadLogoBase64 = async () => {
  if (logoBase64Cache !== null) return logoBase64Cache
  try {
    const res = await fetch('/logo.png')
    const blob = await res.blob()
    logoBase64Cache = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return logoBase64Cache
  } catch (err) {
    console.error('Failed to load logo for receipt:', err)
    logoBase64Cache = ''
    return ''
  }
}

const loadQrBase64 = async () => {
  if (qrBase64Cache !== null) return qrBase64Cache
  try {
    qrBase64Cache = await QRCode.toDataURL(FEEDBACK_URL, {
      width: 200, margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
    return qrBase64Cache
  } catch (err) {
    console.error('Failed to generate QR code:', err)
    qrBase64Cache = ''
    return ''
  }
}

/**
 * Composable for printing receipts.
 * Detects if running inside Android WebView app (with Bluetooth printer)
 * or falls back to browser window.print().
 */
export function usePrinter() {
  const isAndroidApp = computed(() => !!window.AndroidPrinter?.isAvailable())
  const printerConnected = ref(false)
  const printerName = ref('')

  const checkStatus = () => {
    if (window.AndroidPrinter) {
      printerConnected.value = window.AndroidPrinter.isConnected()
      printerName.value = window.AndroidPrinter.getPrinterName() || ''
    }
  }

  const onPrinterConnected = (e) => {
    printerConnected.value = true
    printerName.value = e.detail?.name || ''
  }

  const onPrinterError = () => {
    checkStatus()
  }

  const logoBase64 = ref('')
  const qrDataUrl = ref('')

  onMounted(async () => {
    checkStatus()
    window.addEventListener('printer-connected', onPrinterConnected)
    window.addEventListener('printer-error', onPrinterError)
    // Eagerly load logo + QR so they're ready before the user prints
    const [logo, qr] = await Promise.all([loadLogoBase64(), loadQrBase64()])
    logoBase64.value = logo
    qrDataUrl.value = qr
  })

  onUnmounted(() => {
    window.removeEventListener('printer-connected', onPrinterConnected)
    window.removeEventListener('printer-error', onPrinterError)
  })

  /**
   * Build order JSON payload for the Android printer bridge.
   */
  const buildPrintPayload = (order, sizes, toppings) => {
    const getSizeLabel = (key) => {
      const found = sizes?.find(s => s.key === key)
      return found?.label || key
    }

    const getSizeData = (key) => sizes?.find(s => s.key === key)

    const resolveToppingName = (entry) => {
      if (entry?.topping?.name) return entry.topping.name
      const id = entry?.topping_id ?? entry?.topping?.id
      if (id != null && toppings?.length) {
        const found = toppings.find((m) => m.id === id)
        if (found?.name) return found.name
      }
      return '-'
    }

    const isFood = (item) => getSizeData(item.menu_size_key)?.category !== 'DRINK'

    const calcGram = (item, toppingEntry) => {
      const selectedCount = item.toppings?.length || 1
      const sizeData = getSizeData(item.menu_size_key)
      if (!sizeData?.max_toppings && sizeData?.total_topping_gram) {
        return Math.round(sizeData.total_topping_gram / selectedCount)
      }
      const gram = toppingEntry.topping?.gram_per_portion
      if (!gram) return 0
      const maxToppings = sizeData?.max_toppings || 0
      const multiplier = (maxToppings && selectedCount) ? Math.floor(maxToppings / selectedCount) : 1
      return Math.round(gram * multiplier * 10) / 10
    }

    const getPortionInfo = (item) => {
      const sizeData = getSizeData(item.menu_size_key)
      const selectedCount = item.toppings?.length || 1
      const maxToppings = sizeData?.max_toppings || 0

      if (maxToppings) {
        const multiplier = Math.floor(maxToppings / selectedCount)
        if (multiplier > 1) {
          return `porsi x${multiplier} (${selectedCount} dari ${maxToppings} topping)`
        }
      } else if (sizeData?.total_topping_gram) {
        return `${sizeData.total_topping_gram}g / ${selectedCount} topping`
      }
      return ''
    }

    return JSON.stringify({
      logoBase64: logoBase64Cache || '',
      storeName: order.store?.name || 'Oh My Tongue',
      storeAddress: order.store?.address || '',
      storePhone: order.store?.phone || '',
      queueNumber: order.queue_number ? String(order.queue_number) : '',
      customerName: order.customer_name || '',
      orderNumber: order.order_number || '-',
      staffName: order.staff?.name || '-',
      paymentMethod: order.payment_method || '-',
      memberName: order.member?.name || order.member?.phone || '',
      items: (order.order_items || []).map(item => ({
        name: getSizeLabel(item.menu_size_key),
        price: item.price || 0,
        isFood: isFood(item),
        isDrink: !isFood(item),
        toppings: isFood(item)
          ? (item.toppings || []).map(t => ({
              name: resolveToppingName(t),
              gram: calcGram(item, t),
            }))
          : [],
        bumbu: isFood(item) ? (item.bumbu || '-') : '',
        spicyLevel: isFood(item) ? (item.spicy_level || 0) : 0,
        portionInfo: isFood(item) ? getPortionInfo(item) : '',
        additionals: (item.additionals || []).map(a => ({
          name: a.additional?.name || '-',
          qty: a.qty || 1,
          price: (a.price || 0) * (a.qty || 1),
        })),
      })),
      subtotal: order.subtotal || 0,
      discountAmount: order.discount_amount || 0,
      promoCode: order.promo?.code || '',
      totalPrice: order.total_price || 0,
      instagram: order.store?.instagram || '',
      tiktok: order.store?.tiktok || '',
      notes: order.notes || '',
      createdAt: formatDate(order.created_at),
      feedbackQrUrl: qrBase64Cache || FEEDBACK_URL,
      feedbackQrMessage: 'Berikan kami saran dengan scan QR diatas',
    })
  }

  /** Delay between customer and kitchen receipt (ms) — gives staff time to cut/wrap */
  const RECEIPT_DELAY_MS = 3000

  /**
   * Print both customer + kitchen receipts with a delay between them.
   * Customer receipt prints first, then after RECEIPT_DELAY_MS the kitchen receipt prints.
   * This gives staff time to cut/wrap the customer receipt before the kitchen one starts.
   *
   * Uses Android Bluetooth if available, falls back to browser window.print().
   */
  const printReceipt = async (order, sizes, toppings) => {
    if (window.AndroidPrinter?.isConnected()) {
      await loadLogoBase64()
      const payload = buildPrintPayload(order, sizes, toppings)
      // Print customer receipt first
      window.AndroidPrinter.printCustomerReceipt(payload)
      // Delay then print kitchen receipt
      setTimeout(() => {
        window.AndroidPrinter.printKitchenReceipt(payload)
      }, RECEIPT_DELAY_MS)
      return true
    }
    // Fallback: browser print — print customer first, then kitchen after delay
    // Show only customer receipt first
    document.body.classList.add('print-customer-only')
    window.print()
    // After delay, switch to kitchen receipt and print again
    setTimeout(() => {
      document.body.classList.remove('print-customer-only')
      document.body.classList.add('print-kitchen-only')
      window.print()
      document.body.classList.remove('print-kitchen-only')
    }, RECEIPT_DELAY_MS)
    return false
  }

  /**
   * Print only customer receipt.
   */
  const printCustomerReceipt = async (order, sizes, toppings) => {
    if (window.AndroidPrinter?.isConnected()) {
      await loadLogoBase64()
      const payload = buildPrintPayload(order, sizes, toppings)
      window.AndroidPrinter.printCustomerReceipt(payload)
      return true
    }
    document.body.classList.add('print-customer-only')
    window.print()
    document.body.classList.remove('print-customer-only')
    return false
  }

  /**
   * Print only kitchen receipt.
   */
  const printKitchenReceipt = async (order, sizes, toppings) => {
    if (window.AndroidPrinter?.isConnected()) {
      await loadLogoBase64()
      const payload = buildPrintPayload(order, sizes, toppings)
      window.AndroidPrinter.printKitchenReceipt(payload)
      return true
    }
    document.body.classList.add('print-kitchen-only')
    window.print()
    document.body.classList.remove('print-kitchen-only')
    return false
  }

  /**
   * Show Bluetooth device picker (Android only).
   */
  const showDevicePicker = () => {
    if (window.AndroidPrinter) {
      const devicesJson = window.AndroidPrinter.getPairedDevices()
      return JSON.parse(devicesJson || '[]')
    }
    return []
  }

  /**
   * Connect to a Bluetooth printer (Android only).
   */
  const connectPrinter = (macAddress) => {
    if (window.AndroidPrinter) {
      window.AndroidPrinter.connect(macAddress)
    }
  }

  return {
    isAndroidApp,
    printerConnected,
    printerName,
    logoBase64,
    qrDataUrl,
    printReceipt,
    printCustomerReceipt,
    printKitchenReceipt,
    showDevicePicker,
    connectPrinter,
    checkStatus,
  }
}
