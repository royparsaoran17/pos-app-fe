<template>
  <div class="pie-chart-container">
    <svg :width="size" :height="size" viewBox="0 0 200 200">
      <g transform="translate(100, 100)">
        <template v-for="(slice, idx) in slices" :key="idx">
          <path
            :d="slice.path"
            :fill="slice.color"
            :stroke="'#fff'"
            stroke-width="2"
            class="pie-slice"
          />
        </template>
        <circle v-if="donut" cx="0" cy="0" :r="innerRadius" fill="#fff" />
      </g>
    </svg>
    <div class="pie-legend mt-3">
      <div v-for="(item, idx) in legendItems" :key="idx" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value fw-600">{{ item.displayValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Array, default: () => [] },
  size: { type: Number, default: 200 },
  donut: { type: Boolean, default: true },
  innerRadius: { type: Number, default: 50 },
  formatValue: { type: Function, default: (v) => v },
})

const colors = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac']

const slices = computed(() => {
  if (!props.data.length) return []
  const total = props.data.reduce((sum, d) => sum + (d.value || 0), 0)
  if (total === 0) return []

  const radius = 95
  let currentAngle = -Math.PI / 2
  return props.data.map((d, idx) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle = endAngle

    const x1 = radius * Math.cos(startAngle)
    const y1 = radius * Math.sin(startAngle)
    const x2 = radius * Math.cos(endAngle)
    const y2 = radius * Math.sin(endAngle)
    const largeArc = sliceAngle > Math.PI ? 1 : 0

    const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
    return { path, color: d.color || colors[idx % colors.length] }
  })
})

const legendItems = computed(() => {
  const total = props.data.reduce((sum, d) => sum + (d.value || 0), 0)
  return props.data.map((d, idx) => ({
    label: d.label,
    color: d.color || colors[idx % colors.length],
    displayValue: `${props.formatValue(d.value)} (${total > 0 ? Math.round((d.value / total) * 100) : 0}%)`,
  }))
})
</script>

<style scoped>
.pie-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pie-slice {
  transition: opacity 0.2s;
  cursor: pointer;
}
.pie-slice:hover {
  opacity: 0.8;
}
.pie-legend {
  width: 100%;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label {
  flex: 1;
  color: #666;
}
.legend-value {
  text-align: right;
}
</style>
