type Props = {
  className?: string;
};

// 代码绘制的虚线手掌轮廓（右手掌心朝相机，自拍镜像视角 — 拇指在画面右侧）。
// 用 SVG 而不是 PNG，可任意缩放且分辨率自适应。
export default function HandGuideOutline({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 140"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="rgba(180, 197, 255, 0.48)"
      strokeWidth="0.7"
      strokeDasharray="2 2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* 单条闭合路径勾勒右手轮廓：从左手腕起，沿小指 → 无名指 → 中指 → 食指 → 拇指 → 右手腕回到起点 */}
      <path
        d="
          M 30 132
          L 24 110
          L 22 80
          Q 22 64 24 60
          L 24 32
          Q 24 23 28 23
          Q 32 23 32 32
          L 32 56
          L 38 54
          L 38 18
          Q 38 10 44 10
          Q 50 10 50 18
          L 50 52
          L 56 50
          L 56 12
          Q 56 4 62 4
          Q 68 4 68 12
          L 68 52
          L 74 54
          L 74 22
          Q 74 14 78 14
          Q 82 14 82 22
          L 82 58
          Q 84 62 84 72
          L 88 78
          Q 94 86 92 94
          Q 90 102 84 102
          L 80 100
          L 76 112
          L 70 132
          Z
        "
      />
      {/* 掌心提示线（短虚线） */}
      <line x1="36" y1="92" x2="68" y2="92" />
    </svg>
  );
}
