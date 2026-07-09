// Shared bits between the big Plaza (canvas) and the sidebar mini-plaza (DOM).

// stable hue per name — a provider/mask always wears the same color
export function hueOf(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

// perceived luminance of a resolved CSS color ("rgb(30, 30, 30)", "#f5f5f5",
// "white"). Used to detect dark themes from the actual --white variable
// instead of guessing from body classes (which lied to us once already).
export function colorLuminance(c: string): number {
  c = c.trim().toLowerCase();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3)
      h = h
        .split("")
        .map((x) => x + x)
        .join("");
    const v = parseInt(h.slice(0, 6), 16);
    if (!isNaN(v))
      return (
        (((v >> 16) & 255) * 0.299 +
          ((v >> 8) & 255) * 0.587 +
          (v & 255) * 0.114) /
        255
      );
  }
  const m = c.match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)/);
  if (m) return (+m[1] * 0.299 + +m[2] * 0.587 + +m[3] * 0.114) / 255;
  return c === "black" ? 0 : 1; // keyword fallback: assume light unless black
}
