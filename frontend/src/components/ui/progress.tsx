import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  className?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}
        {...props}
      >
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${Math.min(value || 0, 100)}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
