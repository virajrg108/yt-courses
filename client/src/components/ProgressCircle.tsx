import React from "react";

interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export default function ProgressCircle({
  percentage,
  size = 40,
  strokeWidth = 3,
  showText = true,
  className = ""
}: ProgressCircleProps) {
  // Ensure percentage is between 0-100
  const normalizedPercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate circle properties
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference;
  
  // Determine color based on percentage
  let color = "#E0E0E0"; // not started
  if (normalizedPercentage > 0) {
    color = normalizedPercentage >= 100 ? "#4CAF50" : "#FFC107";
  }
  
  return (
    <svg width={size} height={size} className={`bg-white rounded-full shadow-md ${className}`}>
      <circle 
        cx={size / 2} 
        cy={size / 2} 
        r={radius} 
        fill="white" 
        stroke="#E0E0E0" 
        strokeWidth={strokeWidth} 
      />
      <circle 
        cx={size / 2} 
        cy={size / 2} 
        r={radius} 
        fill="transparent" 
        stroke={color} 
        strokeWidth={strokeWidth} 
        strokeDasharray={circumference} 
        strokeDashoffset={strokeDashoffset} 
        style={{ 
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 0.35s"
        }} 
      />
      {showText && (
        <text 
          x={size / 2} 
          y={size / 2 + 4} 
          textAnchor="middle" 
          fontSize={size / 4} 
          fontWeight="500"
        >
          {normalizedPercentage}%
        </text>
      )}
    </svg>
  );
}
