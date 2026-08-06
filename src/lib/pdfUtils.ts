/**
 * Converts OKLCH color strings to fallback sRGB (rgb/rgba) strings so html2canvas
 * can parse CSS styles without throwing "Attempting to parse an unsupported color function 'oklch'".
 */
export function oklchToRgb(oklchStr: string): string {
  // 1. Try native canvas conversion first if document context is available
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = oklchStr;
        const res = ctx.fillStyle;
        if (res && !res.includes('oklch') && res !== '#000000') {
          return res;
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. Pure Mathematical OKLCH -> sRGB fallback
  const match = oklchStr.match(
    /oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i
  );
  if (!match) return '#64748b'; // Fallback slate-500

  const [, lStr, cStr, hStr, aStr] = match;

  let L = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
  let C = cStr.endsWith('%') ? (parseFloat(cStr) / 100) * 0.4 : parseFloat(cStr);
  let H = parseFloat(hStr);
  let A = aStr ? (aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr)) : 1;

  if (isNaN(L)) L = 0.5;
  if (isNaN(C)) C = 0;
  if (isNaN(H)) H = 0;
  if (isNaN(A)) A = 1;

  // OKLCH -> OKLAB
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLAB -> Linear LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;

  // LMS -> Linear sRGB
  const rLin = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  const gLin = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  const bLin = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.707614701 * s_3;

  // Gamma correction
  const gamma = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const R = Math.round(gamma(rLin) * 255);
  const G = Math.round(gamma(gLin) * 255);
  const B = Math.round(gamma(bLin) * 255);

  if (A < 1) {
    return `rgba(${R}, ${G}, ${B}, ${A.toFixed(2)})`;
  }
  return `rgb(${R}, ${G}, ${B})`;
}

/**
 * Sanitizes a cloned Document before html2canvas processes it.
 * Strips/replaces all oklch and oklab functions from style tags, inline styles, CSS rules, and getComputedStyle.
 */
export function sanitizeClonedDocForPdf(clonedDoc: Document): void {
  const replaceColor = (match: string) => oklchToRgb(match);

  const cleanCssString = (css: string) => {
    if (!css) return css;
    return css
      .replace(/oklch\([^)]+\)/gi, replaceColor)
      .replace(/oklab\([^)]+\)/gi, replaceColor);
  };

  // 1. Proxy getComputedStyle on cloned window if defaultView exists
  if (clonedDoc.defaultView) {
    const win = clonedDoc.defaultView;
    const origGetComputedStyle = win.getComputedStyle.bind(win);
    win.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
      const style = origGetComputedStyle(el, pseudoElt);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === 'getPropertyValue') {
            return (propertyName: string) => {
              const rawVal = target.getPropertyValue(propertyName);
              if (typeof rawVal === 'string' && (rawVal.includes('oklch') || rawVal.includes('oklab'))) {
                return cleanCssString(rawVal);
              }
              return rawVal;
            };
          }
          const val = Reflect.get(target, prop, receiver);
          if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
            return cleanCssString(val);
          }
          return val;
        },
      });
    } as typeof win.getComputedStyle;
  }

  // 2. Replace and recreate all <style> elements in the cloned DOM to force browser stylesheet re-parse
  const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
  styleElements.forEach((oldStyle) => {
    if (oldStyle.textContent && (oldStyle.textContent.includes('oklch') || oldStyle.textContent.includes('oklab'))) {
      const cleanedCss = cleanCssString(oldStyle.textContent);
      const newStyle = clonedDoc.createElement('style');
      newStyle.textContent = cleanedCss;

      if (oldStyle.parentNode) {
        oldStyle.parentNode.replaceChild(newStyle, oldStyle);
      }
    }
  });

  // 3. Iterate through all elements and clean inline styles and style attributes
  const allElements = Array.from(clonedDoc.querySelectorAll('*'));
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style && htmlEl.style.cssText) {
      if (htmlEl.style.cssText.includes('oklch') || htmlEl.style.cssText.includes('oklab')) {
        htmlEl.style.cssText = cleanCssString(htmlEl.style.cssText);
      }
    }
  });
}
