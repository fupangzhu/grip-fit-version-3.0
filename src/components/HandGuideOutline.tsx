type Props = {
  className?: string;
};

// 虚线手掌轮廓 —— 直接用美术做好的 PNG（5 指清晰、拇指在画面右侧匹配自拍镜像视角）。
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
