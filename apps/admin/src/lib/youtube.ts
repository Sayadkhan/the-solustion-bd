export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function getYouTubeThumbnailUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
