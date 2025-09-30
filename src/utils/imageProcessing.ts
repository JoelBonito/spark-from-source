export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 8 * 1024 * 1024; // 8MB

  if (!validTypes.includes(file.type)) {
    return 'Formato inválido. Use JPG, PNG ou WEBP.';
  }

  if (file.size > maxSize) {
    return `Arquivo muito grande (${formatFileSize(file.size)}). Máximo: 8MB.`;
  }

  return null;
}

export function downloadImage(base64: string, filename: string): void {
  const link = document.createElement('a');
  link.href = base64;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}
