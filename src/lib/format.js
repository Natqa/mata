export function minutes(sec) {
  return `${Math.max(1, Math.round((sec ?? 0) / 60))} min`
}

export function dateLabel(iso) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export const youtubeUrl = (id) => `https://www.youtube.com/watch?v=${id}`
export const isMockVideo = (id) => String(id).startsWith('mock-')
