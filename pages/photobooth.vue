<template>
  <div class="photobooth-page">
    <div class="d-flex gap-4">
      <!-- LEFT: Camera + Controls -->
      <div class="camera-side flex-grow-1">
        <div class="camera-wrapper">
          <!-- Camera Feed -->
          <div class="camera-frame position-relative">
            <video ref="videoEl" autoplay playsinline class="camera-video"></video>
            <canvas ref="canvasEl" style="display:none"></canvas>

            <!-- B&W filter overlay label -->
            <div class="bw-badge">B&W</div>

            <!-- Countdown overlay -->
            <div v-if="countdown > 0" class="countdown-overlay">
              <div class="countdown-number">{{ countdown }}</div>
              <div class="countdown-label">Foto {{ currentCaptureIndex + 1 }} dari 3</div>
            </div>

            <!-- Flash effect -->
            <div v-if="flashOn" class="flash-overlay"></div>

            <!-- Status: which photo is being captured -->
            <div v-if="autoCapturing" class="capture-status">
              <div class="d-flex gap-2 justify-content-center">
                <span v-for="i in 3" :key="i" class="capture-dot" :class="{
                  done: photos[i - 1],
                  active: currentCaptureIndex === i - 1 && countdown > 0,
                }">{{ i }}</span>
              </div>
            </div>
          </div>

          <!-- Photo Thumbnails with Retry -->
          <div class="photo-slots mt-3">
            <div v-for="(slot, i) in 3" :key="i" class="photo-slot" :class="{ active: currentCaptureIndex === i && autoCapturing }">
              <div class="slot-inner">
                <img v-if="photos[i]" :src="photos[i]" class="slot-img" />
                <div v-else class="slot-empty">
                  <i class="bi bi-camera"></i>
                  <span class="fz-11">Foto {{ i + 1 }}</span>
                </div>
              </div>
              <!-- Retry button per photo -->
              <button
                v-if="photos[i] && !autoCapturing && !showResult"
                class="retry-btn"
                @click="retryPhoto(i)"
                title="Ambil ulang foto ini"
              >
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          <!-- Controls -->
          <div class="mt-3 text-center">
            <!-- Initial: Start auto-capture -->
            <button
              v-if="!autoCapturing && !allPhotosTaken && !retryingIndex !== null && retryingIndex === null"
              class="btn-capture"
              :disabled="autoCapturing"
              @click="startAutoCapture"
            >
              <i class="bi bi-camera-fill me-2"></i>
              {{ photos.some(p => p) ? 'Lanjut Foto' : 'Mulai Foto' }}
            </button>

            <!-- Retrying single photo -->
            <div v-if="retryingIndex !== null && !autoCapturing" class="text-center">
              <div class="fz-13 text-muted mb-2">Siap ambil ulang Foto {{ retryingIndex + 1 }}...</div>
              <button class="btn-capture btn-capture-sm" @click="captureRetry">
                <i class="bi bi-camera-fill me-2"></i> Ambil Foto {{ retryingIndex + 1 }}
              </button>
              <button class="btn btn-outline-secondary btn-sm ms-2" @click="cancelRetry">Batal</button>
            </div>

            <!-- All done: Confirm or Reset -->
            <div v-if="allPhotosTaken && !autoCapturing && retryingIndex === null && !showResult" class="d-flex justify-content-center gap-2">
              <button class="btn btn-success btn-lg px-4 fw-600" @click="generateResult">
                <i class="bi bi-check-lg me-2"></i> Selesai & Cetak
              </button>
              <button class="btn btn-outline-secondary" @click="resetAll">
                <i class="bi bi-arrow-counterclockwise me-1"></i> Ulang Semua
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Live Strip Preview + QR -->
      <div class="preview-side no-print">
        <!-- Strip Preview (always visible once any photo taken) -->
        <div ref="printArea" class="photobooth-print-area">
          <div ref="stripEl" class="photobooth-strip">
            <div class="strip-header">
              <img src="/logo.png" alt="OMT" class="strip-logo" />
              <div class="strip-brand">Oh My Tongue</div>
              <div class="strip-tagline">Racik Sesuai Selera</div>
            </div>
            <div v-for="(slot, idx) in 3" :key="idx" class="strip-photo">
              <img v-if="photos[idx]" :src="photos[idx]" />
              <div v-else class="strip-photo-empty">
                <i class="bi bi-image"></i>
              </div>
            </div>
            <div class="strip-footer">
              <div class="strip-brand-sm">Oh My Tongue</div>
              <div class="strip-date">{{ todayFormatted }}</div>
            </div>
          </div>
        </div>

        <!-- Action buttons when result is ready -->
        <div v-if="showResult" class="mt-3 text-center">
          <div class="d-flex justify-content-center gap-2 mb-3">
            <button class="btn btn-dark btn-sm" @click="printResult">
              <i class="bi bi-printer me-1"></i> Cetak
            </button>
            <button class="btn btn-outline-secondary btn-sm" @click="resetAll">
              <i class="bi bi-arrow-counterclockwise me-1"></i> Foto Baru
            </button>
          </div>
        </div>

        <!-- QR Code Section -->
        <div v-if="showResult" class="qr-card mt-3">
          <div v-if="uploading" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-dark mb-2"></div>
            <p class="fz-13 text-muted mb-0">Menyimpan foto...</p>
          </div>

          <div v-else-if="qrDataUrl" class="text-center">
            <div class="fw-700 fz-14 mb-2">
              <i class="bi bi-qr-code me-1"></i> Scan untuk Download
            </div>
            <img :src="qrDataUrl" alt="QR Code" class="qr-image mb-2" />
            <p class="fz-12 text-muted mb-1">Arahkan kamera HP ke QR</p>
            <p class="fz-11 text-muted mb-0">
              <i class="bi bi-clock me-1"></i> Berlaku {{ expiryHours }} jam
            </p>
          </div>

          <div v-else-if="uploadError" class="text-center py-3">
            <p class="fz-13 text-danger mb-2">{{ uploadError }}</p>
            <button class="btn btn-outline-dark btn-sm" @click="uploadStrip">
              <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { todayJakarta } from '~/utils/format'
import { useMainStore } from '~/stores'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const store = useMainStore()

const videoEl = ref(null)
const canvasEl = ref(null)
const printArea = ref(null)
const stripEl = ref(null)

// Photos array: [null, null, null] → filled as captured
const photos = ref([null, null, null])
const autoCapturing = ref(false)
const currentCaptureIndex = ref(0)
const countdown = ref(0)
const flashOn = ref(false)
const showResult = ref(false)
const retryingIndex = ref(null)
let stream = null
let countdownTimer = null

// QR/Upload state
const uploading = ref(false)
const uploadError = ref('')
const qrDataUrl = ref('')
const downloadUrl = ref('')
const expiryHours = 48

const allPhotosTaken = computed(() => photos.value.every(p => p !== null))

const todayFormatted = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
})

// ===== Camera =====
const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    })
    if (videoEl.value) videoEl.value.srcObject = stream
  } catch (e) {
    alert('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.')
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
}

// ===== B&W Capture =====
const captureFrame = () => {
  const video = videoEl.value
  const canvas = canvasEl.value
  if (!video || !canvas) return null

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')

  // Mirror
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  // Convert to grayscale
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL('image/jpeg', 0.92)
}

// ===== Auto Capture: 1 click → 3 photos =====
const startAutoCapture = () => {
  // Find first empty slot
  const firstEmpty = photos.value.findIndex(p => p === null)
  if (firstEmpty === -1) return

  autoCapturing.value = true
  currentCaptureIndex.value = firstEmpty
  runCountdown(firstEmpty)
}

const runCountdown = (index) => {
  countdown.value = 3
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      takePhotoAt(index)
    }
  }, 1000)
}

const takePhotoAt = (index) => {
  const dataUrl = captureFrame()
  if (dataUrl) {
    photos.value[index] = dataUrl
    // Trigger reactivity
    photos.value = [...photos.value]
  }

  // Flash
  flashOn.value = true
  setTimeout(() => { flashOn.value = false }, 300)

  // Check if more to capture
  const nextEmpty = photos.value.findIndex(p => p === null)
  if (nextEmpty !== -1) {
    currentCaptureIndex.value = nextEmpty
    // Brief pause then next countdown
    setTimeout(() => runCountdown(nextEmpty), 800)
  } else {
    // All done
    autoCapturing.value = false
    currentCaptureIndex.value = 0
  }
}

// ===== Retry Single Photo =====
const retryPhoto = (index) => {
  retryingIndex.value = index
}

const captureRetry = () => {
  const index = retryingIndex.value
  if (index === null) return

  countdown.value = 3
  currentCaptureIndex.value = index
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      const dataUrl = captureFrame()
      if (dataUrl) {
        photos.value[index] = dataUrl
        photos.value = [...photos.value]
      }
      flashOn.value = true
      setTimeout(() => { flashOn.value = false }, 300)
      retryingIndex.value = null
    }
  }, 1000)
}

const cancelRetry = () => {
  retryingIndex.value = null
}

// ===== Result & Upload =====
const generateResult = () => {
  showResult.value = true
  stopCamera()
  nextTick(() => {
    setTimeout(() => uploadStrip(), 500)
  })
}

const uploadStrip = async () => {
  uploading.value = true
  uploadError.value = ''
  qrDataUrl.value = ''
  downloadUrl.value = ''

  try {
    const el = stripEl.value
    if (!el) throw new Error('Strip element not found')

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)

    const res = await store.uploadPhotoStrip({ image: imageDataUrl })
    downloadUrl.value = res.content.download_url

    qrDataUrl.value = await QRCode.toDataURL(downloadUrl.value, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  } catch (err) {
    console.error('Upload failed:', err)
    uploadError.value = err.response?.data?.message || 'Gagal menyimpan foto.'
  } finally {
    uploading.value = false
  }
}

const printResult = () => { window.print() }

const resetAll = () => {
  if (countdownTimer) clearInterval(countdownTimer)
  photos.value = [null, null, null]
  autoCapturing.value = false
  currentCaptureIndex.value = 0
  countdown.value = 0
  showResult.value = false
  retryingIndex.value = null
  qrDataUrl.value = ''
  downloadUrl.value = ''
  uploadError.value = ''
  nextTick(() => startCamera())
}

onMounted(() => startCamera())
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  stopCamera()
})
</script>

<style scoped>
.photobooth-page {
  max-width: 1100px;
  margin: 0 auto;
}

/* ===== Camera Side ===== */
.camera-side {
  max-width: 560px;
}

.camera-frame {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  aspect-ratio: 4/3;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scaleX(-1);
  filter: grayscale(100%);
}

.bw-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

.countdown-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.countdown-number {
  font-size: 100px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  text-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

.countdown-label {
  font-size: 16px;
  color: rgba(255,255,255,0.8);
  margin-top: 8px;
  font-weight: 600;
}

.flash-overlay {
  position: absolute;
  inset: 0;
  background: #fff;
  animation: flash 0.35s ease-out forwards;
}

.capture-status {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  text-align: center;
}

.capture-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.5);
  border: 2px solid rgba(255,255,255,0.3);
  transition: all 0.3s;
}

.capture-dot.done {
  background: #fff;
  color: #000;
  border-color: #fff;
}

.capture-dot.active {
  background: rgba(255,255,255,0.4);
  color: #fff;
  border-color: #fff;
  transform: scale(1.15);
}

/* ===== Photo Slots ===== */
.photo-slots {
  display: flex;
  gap: 10px;
}

.photo-slot {
  flex: 1;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  aspect-ratio: 4/3;
  transition: border-color 0.3s;
}

.photo-slot.active {
  border-color: #e4412e;
  box-shadow: 0 0 0 2px rgba(228,65,46,0.3);
}

.slot-inner {
  width: 100%;
  height: 100%;
}

.slot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.slot-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #bbb;
  gap: 2px;
}

.slot-empty i { font-size: 20px; }

.retry-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.retry-btn:hover {
  background: rgba(228,65,46,0.9);
}

/* ===== Capture Button ===== */
.btn-capture {
  width: 180px;
  height: 56px;
  border-radius: 28px;
  border: 3px solid #e4412e;
  background: #e4412e;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-capture:hover {
  background: #c9352a;
  transform: scale(1.03);
}

.btn-capture:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-capture-sm {
  width: 160px;
  height: 44px;
  font-size: 14px;
}

/* ===== Preview Side (Strip) ===== */
.preview-side {
  width: 280px;
  flex-shrink: 0;
}

.photobooth-strip {
  width: 100%;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 14px;
}

.strip-header {
  text-align: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px dashed #ddd;
}

.strip-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-bottom: 2px;
}

.strip-brand {
  font-size: 16px;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: 0.5px;
}

.strip-tagline {
  font-size: 10px;
  color: #999;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.strip-photo {
  margin-bottom: 6px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #eee;
  aspect-ratio: 4/3;
  background: #f8f8f8;
}

.strip-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: grayscale(100%);
}

.strip-photo-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ddd;
  font-size: 24px;
}

.strip-footer {
  text-align: center;
  padding-top: 8px;
  border-top: 2px dashed #ddd;
}

.strip-brand-sm {
  font-size: 12px;
  font-weight: 700;
  color: #1a1a1a;
}

.strip-date {
  font-size: 10px;
  color: #999;
  margin-top: 1px;
}

/* ===== QR Card ===== */
.qr-card {
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px;
}

.qr-image {
  width: 180px;
  height: 180px;
}

/* ===== Animations ===== */
@keyframes flash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* ===== Print ===== */
@media print {
  body * { visibility: hidden; }
  .photobooth-print-area,
  .photobooth-print-area * {
    visibility: visible;
  }
  .photobooth-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 300px;
  }
  .no-print { display: none !important; }
  .strip-photo img { filter: grayscale(100%) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
