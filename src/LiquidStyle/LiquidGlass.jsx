import React, { useEffect, useMemo } from "react";

/**
 * LiquidGlass
 * - Card/container với hiệu ứng Liquid Glass (blur + saturate + displacement)
 * - Dùng CSS variables để tùy chỉnh nhanh.
 *
 * Props:
 *  - as: thẻ HTML (mặc định 'div')
 *  - className: thêm class ngoài
 *  - style: inline style (ghi đè/tăng cường)
 *  - blur: px (mặc định 16)
 *  - saturate: hệ số (mặc định 1.35)
 *  - scale: cường độ bẻ cong (mặc định 45; 25–70 là đẹp)
 *  - radius: bo góc px (mặc định 14)
 *  - overlay: rgba(...) nền phủ (mặc định 'rgba(255,255,255,.14)')
 *  - border: rgba(...) viền (mặc định 'rgba(255,255,255,.35)')
 *  - lightBackground: boolean — nếu true sẽ dùng overlay tối hơn để nổi trên nền sáng
 */
export default function LiquidGlass({
  as: Tag = "div",
  className = "",
  style,
  children,
  blur = 16,
  saturate = 1.35,
  scale = 45,
  radius = 14,
  overlay,
  border,
  lightBackground = false,
  ...rest
}) {
  // Chỉ chèn <svg> filter 1 lần vào document
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("lg-filter-defs")) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("style", "position:absolute");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("id", "lg-filter-defs");
    svg.innerHTML = `
      <defs>
        <filter id="lg-displace" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="8" result="noise"/>
          <feGaussianBlur in="noise" stdDeviation="2" result="map"/>
          <feDisplacementMap in="SourceGraphic" in2="map" scale="45" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);
  }, []);

  // Build CSS variables
  const vars = useMemo(() => {
    const ov =
      overlay ??
      (lightBackground ? "rgba(0,0,0,.10)" : "rgba(255,255,255,.14)");
    const bd = border ?? "rgba(255,255,255,.35)";

    return {
      "--lg-blur": `${blur}px`,
      "--lg-sat": String(saturate),
      "--lg-scale": String(scale),
      "--lg-radius": `${radius}px`,
      "--lg-overlay": ov,
      "--lg-border": bd,
    };
  }, [blur, saturate, scale, radius, overlay, border, lightBackground]);

  // Ghi scale vào filter (đổi nhanh mà không phải thay innerHTML)
  useEffect(() => {
    const node = document.querySelector("#lg-filter-defs feDisplacementMap");
    if (node) node.setAttribute("scale", String(scale));
  }, [scale]);

  return (
    <Tag
      className={`lg-card lg-liquid ${className}`.trim()}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {/* highlight viền kính */}
      <span className="lg-highlight" aria-hidden="true" />
      {children}
    </Tag>
  );
}
