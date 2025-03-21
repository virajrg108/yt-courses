interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export default function ProgressCircle({
  percentage,
  size = 24,
  strokeWidth = 2,
  showText = false,
  className = '',
}: ProgressCircleProps) {
  // Default to 0% if percentage is not defined or is invalid
  const validPercentage = Number.isFinite(percentage) ? Math.max(0, Math.min(percentage, 100)) : 0;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="text-muted-foreground/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        
        {/* Progress circle */}
        <circle
          className="text-primary transition-all duration-300 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      
      {/* Percentage text */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center font-medium text-[10px]">
          {Math.round(validPercentage)}%
        </div>
      )}
    </div>
  );
}