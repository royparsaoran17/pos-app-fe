<template>
  <div class="p-4">
    <!-- Camera View -->
    <div v-if="!showResult" class="text-center">
      <div class="card d-inline-block">
        <div class="card-body p-3">
          <div class="position-relative d-inline-block" style="border-radius:12px;overflow:hidden">
            <video ref="videoEl" autoplay playsinline style="width:480px;max-width:100%;border-radius:12px;transform:scaleX(-1)"></video>
            <!-- Countdown overlay -->
            <div v-if="countdown > 0" class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background:rgba(0,0,0,0.4);border-radius:12px">
              <span style="font-size:80px;font-weight:bold;color:#fff">{{ countdown }}</span>
            </div>
            <!-- Flash effect -->
            <div v-if="flashOn" class="position-absolute top-0 start-0 w-100 h-100" style="background:#fff;border-radius:12px;animation:flash 0.3s ease-out"></div>
          </div>
          <canvas ref="canvasEl" style="display:none"></canvas>

          <div class="mt-3">
            <div class="fz-14 text-muted mb-2">Foto {{ photos.length }}/3 diambil</div>
            <div class="d-flex justify-content-center gap-2 mb-3">
              <div v-for="(p, i) in 3" :key="i" style="width:80px;height:60px;border-radius:8px;overflow:hidden;border:2px solid var(--gray-200)">
                <img v-if="photos[i]" :src="photos[i]" style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)" />
                <div v-else class="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                  <i class="bi bi-camera text-muted"></i>
                </div>
              </div>
            </div>
            <button v-if="photos.length < 3" class="btn btn-primary btn-lg px-5" :disabled="capturing" @click="startCapture">
              <i class="bi bi-camera-fill me-2"></i> {{ capturing ? 'Tunggu...' : `Foto ${photos.length + 1}` }}
            </button>
            <div v-else class="d-flex justify-content-center gap-2">
              <button class="btn btn-success btn-lg px-4" @click="generateResult">
                <i class="bi bi-check-lg me-2"></i> Cetak Foto
              </button>
              <button class="btn btn-outline-secondary" @click="resetAll">
                <i class="bi bi-arrow-counterclockwise me-1"></i> Ulang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Print Result -->
    <div v-if="showResult" class="text-center">
      <div class="d-flex justify-content-center gap-2 mb-3 no-print">
        <button class="btn btn-primary" @click="printResult">
          <i class="bi bi-printer me-1"></i> Cetak
        </button>
        <button class="btn btn-outline-secondary" @click="resetAll">
          <i class="bi bi-arrow-counterclockwise me-1"></i> Foto Baru
        </button>
      </div>

      <div ref="printArea" class="photobooth-print-area d-inline-block">
        <div class="photobooth-strip">
          <div class="strip-header">
            <img src="/logo.png" alt="OMT" class="strip-logo" />
            <div class="strip-brand">Oh My Tongue</div>
          </div>
          <div v-for="(photo, idx) in photos" :key="idx" class="strip-photo">
            <img :src="photo" />
          </div>
          <div class="strip-footer">
            <div class="strip-brand-sm">Oh My Tongue</div>
            <div class="strip-date">{{ todayFormatted }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { todayJakarta } from '~/utils/format'
definePageMeta({ layout: 'dashboard' })

const videoEl = ref(null)
const canvasEl = ref(null)
const printArea = ref(null)
const photos = ref([])
const capturing = ref(false)
const countdown = ref(0)
const flashOn = ref(false)
const showResult = ref(false)
let stream = null

const todayFormatted = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
})

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
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

const startCapture = () => {
  capturing.value = true
  countdown.value = 3
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      takePhoto()
    }
  }, 1000)
}

const takePhoto = () => {
  const video = videoEl.value
  const canvas = canvasEl.value
  if (!video || !canvas) return

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  // Mirror the image
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  photos.value.push(canvas.toDataURL('image/jpeg', 0.92))
  flashOn.value = true
  setTimeout(() => { flashOn.value = false }, 300)
  capturing.value = false
}

const generateResult = () => {
  showResult.value = true
  stopCamera()
}

const printResult = () => {
  window.print()
}

const resetAll = () => {
  photos.value = []
  showResult.value = false
  nextTick(() => startCamera())
}

onMounted(() => startCamera())
onUnmounted(() => stopCamera())
</script>

<style scoped>
.photobooth-strip {
  width: 300px;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  display: inline-block;
}

.strip-header {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px dashed #ccc;
}

.strip-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 4px;
}

.strip-brand {
  font-size: 18px;
  font-weight: 700;
  color: #e4412e;
}

.strip-photo {
  margin-bottom: 8px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #eee;
}

.strip-photo img {
  width: 100%;
  display: block;
}

.strip-footer {
  text-align: center;
  padding-top: 8px;
  border-top: 2px dashed #ccc;
}

.strip-brand-sm {
  font-size: 14px;
  font-weight: 700;
  color: #e4412e;
}

.strip-date {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

@keyframes flash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

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
  }
  .no-print { display: none !important; }
}
</style>
