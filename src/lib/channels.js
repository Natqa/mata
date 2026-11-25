// Kanały YouTube, z których AI dobiera treningi.
// Żeby dodać kanał, dopisz tu link i kliknij "Pobierz filmy" w Bibliotece.
export const DEFAULT_CHANNELS = [
  'https://www.youtube.com/@mayaradnaiyoga',
  'https://www.youtube.com/@BasiaTworekNinjaYogi',
  'https://www.youtube.com/@bognayoga',
]

/** "https://www.youtube.com/@nazwa/videos" → "@nazwa" (do wyświetlania). */
export function channelLabel(link) {
  return link.match(/@[\w.-]+/)?.[0] ?? link
}
