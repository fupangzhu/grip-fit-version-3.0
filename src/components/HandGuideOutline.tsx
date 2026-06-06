type Props = {
  className?: string;
};

// 虚线手掌轮廓 —— 直接用美术做好的 PNG。PNG 本身是「拇指在右」的左手形，
// 在 CSS 里用 scaleX(-1) 翻成右手（镜像自拍视角下举右手时拇指在左）。
// SVG 自绘版本在测试中画出来的形状不像手，回退到 PNG。
export default function HandGuideOutline({ className }: Props) {
  return (
    <img
      className={className}
      src="/assets/hand-guide-outline.png"
      alt=""
      aria-hidden
      draggable={false}
    />
  );
}
