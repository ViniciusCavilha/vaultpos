<template>
  <teleport to="body">
    <div v-if="file" class="crop-overlay" role="dialog" aria-modal="true" aria-label="Ajustar foto de perfil">
      <section class="crop-card">
        <header><div><h2>Ajustar foto</h2><p>Arraste e use o zoom para enquadrar.</p></div><button type="button" aria-label="Fechar" @click="cancel">×</button></header>
        <div
          class="crop-viewport"
          @pointerdown="startDrag"
          @pointermove="drag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <img ref="imageElement" :src="source" alt="Prévia da foto" draggable="false" :style="imageStyle" @load="handleImageLoad" @error="handleImageError" />
          <div class="crop-mask" />
        </div>
        <label class="zoom-control"><span>Zoom</span><input v-model.number="zoom" type="range" min="1" max="3" step="0.01" @input="constrainOffsets" /></label>
        <p v-if="errorMessage" class="crop-error">{{ errorMessage }}</p>
        <footer><button class="cancel-button" type="button" @click="cancel">Cancelar</button><button class="confirm-button" type="button" :disabled="!loaded || processing" @click="confirm">{{ processing ? 'Preparando...' : 'Usar esta foto' }}</button></footer>
      </section>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ file: File | null }>()
const emit = defineEmits<{ cancel: []; confirm: [photo: string] }>()
const viewportSize = 280
const outputSize = 360
const maxDataUrlLength = 700_000
const imageElement = ref<HTMLImageElement | null>(null)
const source = ref('')
const imageWidth = ref(0)
const imageHeight = ref(0)
const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const loaded = ref(false)
const processing = ref(false)
const errorMessage = ref('')
let dragging = false
let startPointerX = 0
let startPointerY = 0
let startOffsetX = 0
let startOffsetY = 0

const baseScale = computed(() => imageWidth.value && imageHeight.value
  ? Math.max(viewportSize / imageWidth.value, viewportSize / imageHeight.value)
  : 1)
const renderedWidth = computed(() => imageWidth.value * baseScale.value * zoom.value)
const renderedHeight = computed(() => imageHeight.value * baseScale.value * zoom.value)
const imageStyle = computed(() => ({
  width: `${renderedWidth.value}px`,
  height: `${renderedHeight.value}px`,
  transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px))`,
}))

function reset() {
  zoom.value = 1
  offsetX.value = 0
  offsetY.value = 0
  imageWidth.value = 0
  imageHeight.value = 0
  loaded.value = false
  processing.value = false
  errorMessage.value = ''
}

function releaseSource() {
  if (source.value) URL.revokeObjectURL(source.value)
  source.value = ''
}

function constrainOffsets() {
  const maxX = Math.max(0, (renderedWidth.value - viewportSize) / 2)
  const maxY = Math.max(0, (renderedHeight.value - viewportSize) / 2)
  offsetX.value = Math.max(-maxX, Math.min(maxX, offsetX.value))
  offsetY.value = Math.max(-maxY, Math.min(maxY, offsetY.value))
}

function handleImageLoad() {
  const image = imageElement.value
  if (!image) return
  imageWidth.value = image.naturalWidth
  imageHeight.value = image.naturalHeight
  loaded.value = imageWidth.value > 0 && imageHeight.value > 0
  constrainOffsets()
}

function handleImageError() {
  errorMessage.value = 'Não foi possível abrir esta imagem.'
  loaded.value = false
}

function startDrag(event: PointerEvent) {
  if (!loaded.value) return
  dragging = true
  startPointerX = event.clientX
  startPointerY = event.clientY
  startOffsetX = offsetX.value
  startOffsetY = offsetY.value
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function drag(event: PointerEvent) {
  if (!dragging) return
  offsetX.value = startOffsetX + event.clientX - startPointerX
  offsetY.value = startOffsetY + event.clientY - startPointerY
  constrainOffsets()
}

function endDrag() {
  dragging = false
}

function cancel() {
  emit('cancel')
}

async function confirm() {
  const image = imageElement.value
  if (!image || !loaded.value || processing.value) return
  processing.value = true
  errorMessage.value = ''
  await nextTick()
  try {
    const scale = baseScale.value * zoom.value
    const sourceSide = viewportSize / scale
    const centerX = imageWidth.value / 2 - offsetX.value / scale
    const centerY = imageHeight.value / 2 - offsetY.value / scale
    const sourceX = Math.max(0, Math.min(imageWidth.value - sourceSide, centerX - sourceSide / 2))
    const sourceY = Math.max(0, Math.min(imageHeight.value - sourceSide, centerY - sourceSide / 2))
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível processar a imagem neste dispositivo.')
    canvas.width = outputSize
    canvas.height = outputSize
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, outputSize, outputSize)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, sourceX, sourceY, sourceSide, sourceSide, 0, 0, outputSize, outputSize)
    for (const quality of [0.82, 0.7, 0.58]) {
      const photo = canvas.toDataURL('image/jpeg', quality)
      if (photo.length <= maxDataUrlLength) {
        emit('confirm', photo)
        return
      }
    }
    throw new Error('A imagem ficou grande demais. Escolha outra foto.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível preparar a foto.'
  } finally {
    processing.value = false
  }
}

watch(() => props.file, (file) => {
  releaseSource()
  reset()
  if (file) source.value = URL.createObjectURL(file)
}, { immediate: true })

onBeforeUnmount(releaseSource)
</script>

<style scoped>
.crop-overlay{position:fixed;z-index:10000;inset:0;display:grid;place-items:center;padding:20px;background:rgba(2,6,23,.72);backdrop-filter:blur(5px)}.crop-card{width:min(420px,100%);border-radius:20px;padding:20px;background:var(--vault-color-surface);color:var(--vault-color-text-1);box-shadow:0 24px 70px rgba(0,0,0,.35)}header{display:flex;align-items:flex-start;justify-content:space-between}header h2{margin:0;font-size:20px}header p{margin:5px 0 0;color:var(--vault-color-text-2);font-size:13px}header button{display:grid;width:32px;height:32px;place-items:center;border:0;border-radius:50%;background:var(--vault-color-surface-muted);color:var(--vault-color-text-1);font-size:24px;line-height:1}.crop-viewport{position:relative;width:280px;height:280px;margin:20px auto 0;overflow:hidden;border-radius:16px;background:#020617;cursor:grab;touch-action:none;user-select:none}.crop-viewport:active{cursor:grabbing}.crop-viewport img{position:absolute;top:50%;left:50%;max-width:none;pointer-events:none;will-change:transform}.crop-mask{position:absolute;inset:0;border:2px solid rgba(255,255,255,.9);border-radius:50%;box-shadow:0 0 0 80px rgba(2,6,23,.58);pointer-events:none}.zoom-control{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:12px;margin-top:20px;color:var(--vault-color-text-2);font-size:13px}.zoom-control input{width:100%;accent-color:#991B1B}.crop-error{margin:12px 0 0;color:#EF4444;font-size:12px;text-align:center}footer{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}footer button{height:46px;border:0;border-radius:11px;font:600 14px Inter}.cancel-button{background:var(--vault-color-surface-muted);color:var(--vault-color-text-1)}.confirm-button{background:#991B1B;color:#FFFFFF}.confirm-button:disabled{opacity:.6}@media(max-width:360px){.crop-card{padding:16px}}
</style>
