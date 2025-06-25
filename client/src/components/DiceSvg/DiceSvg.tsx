import React from "react";

interface DiceSvgProps {
  value?: number;
  size?: number;
  className?: string;
}

const DiceSvg: React.FC<DiceSvgProps> = ({ 
  value = 5, 
  size = 60, 
  className = "" 
}) => {
  const getDots = (num: number) => {
    const dotConfigs: Record<number, Array<{ cx: string; cy: string }>> = {
      1: [{ cx: "50%", cy: "50%" }],
      2: [
        { cx: "30%", cy: "30%" },
        { cx: "70%", cy: "70%" }
      ],
      3: [
        { cx: "30%", cy: "30%" },
        { cx: "50%", cy: "50%" },
        { cx: "70%", cy: "70%" }
      ],
      4: [
        { cx: "30%", cy: "30%" },
        { cx: "70%", cy: "30%" },
        { cx: "30%", cy: "70%" },
        { cx: "70%", cy: "70%" }
      ],
      5: [
        { cx: "30%", cy: "30%" },
        { cx: "70%", cy: "30%" },
        { cx: "50%", cy: "50%" },
        { cx: "30%", cy: "70%" },
        { cx: "70%", cy: "70%" }
      ],
      6: [
        { cx: "30%", cy: "25%" },
        { cx: "70%", cy: "25%" },
        { cx: "30%", cy: "50%" },
        { cx: "70%", cy: "50%" },
        { cx: "30%", cy: "75%" },
        { cx: "70%", cy: "75%" }
      ]
    };

    return dotConfigs[num] || dotConfigs[5];
  };

  const dots = getDots(value);

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      style={{
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
      }}
    >
      {/* Dice background */}
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="12"
        ry="12"
        fill="url(#diceGradient)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="diceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
        </linearGradient>
        <radialGradient id="dotGradient" cx="50%" cy="30%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.8)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
        </radialGradient>
      </defs>
      
      {/* Dots */}
      {dots.map((dot, index) => (
        <circle
          key={index}
          cx={dot.cx}
          cy={dot.cy}
          r="6"
          fill="url(#dotGradient)"
        />
      ))}
    </svg>
  );
};

export default DiceSvg;
