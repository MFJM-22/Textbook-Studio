import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to CDN matching pdfjs-dist version
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface PageUploadItem {
  image_data?: string;
  raw_text?: string;
}

export function compressImage(file: File, maxWidth = 1400, maxHeight = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.onerror = () => resolve(e.target?.result as string || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export async function convertPdfToPageImages(file: File): Promise<PageUploadItem[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pages: PageUploadItem[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const defaultViewport = page.getViewport({ scale: 1.0 });
        let desiredScale = 2.0;
        if (defaultViewport.width * desiredScale > 1400) {
          desiredScale = 1400 / defaultViewport.width;
        }
        if (defaultViewport.height * desiredScale > 1800) {
          desiredScale = Math.min(desiredScale, 1800 / defaultViewport.height);
        }
        const viewport = page.getViewport({ scale: Math.max(1.0, desiredScale) });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvas: canvas as any, canvasContext: ctx, viewport }).promise;
          const imageData = canvas.toDataURL('image/jpeg', 0.80);

          // Extract text layer if present in PDF
          let pageText = '';
          try {
            const textContent = await page.getTextContent();
            pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
              .trim();
          } catch (tErr) {
            console.warn('PDF text content extraction info:', tErr);
          }

          pages.push({
            image_data: imageData,
            raw_text: pageText || undefined,
          });
        }
      } catch (pageErr) {
        console.error(`Error rendering PDF page ${i}:`, pageErr);
      }
    }

    return pages;
  } catch (err) {
    console.error('Failed to parse uploaded PDF file:', err);
    throw new Error('Unable to parse the uploaded scanned PDF. Please ensure it is a valid PDF file.');
  }
}

export async function processUploadedFiles(files: File[]): Promise<PageUploadItem[]> {
  const resultPages: PageUploadItem[] = [];

  for (const file of files) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      const pdfPages = await convertPdfToPageImages(file);
      resultPages.push(...pdfPages);
    } else {
      const compressedData = await compressImage(file);
      if (compressedData) {
        resultPages.push({ image_data: compressedData });
      }
    }
  }

  return resultPages;
}
