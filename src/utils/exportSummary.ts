export function exportSummary(counts: number[]): string {
  if (!counts.length) return 'Готовим изображения…';
  if (counts.length === 1) return `Готово 1 изображение с ${counts[0]} позициями.`;
  const word = counts.length < 5 ? 'изображения' : 'изображений';
  return `Готово ${counts.length} ${word}. Распределение позиций по изображениям: ${counts.join(' + ')}.`;
}
