'use client';

import * as React from 'react'

export interface RadioGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col gap-2 ${className || ''}`}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              checked: value === (child.props as any).value,
              onChange: () => onValueChange?.((child.props as any).value),
            })
          : child
      )}
    </div>
  )
)
RadioGroup.displayName = 'RadioGroup'

export interface RadioGroupItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => (
    <input
      ref={ref}
      type="radio"
      value={value}
      className={`h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${className || ''}`}
      {...props}
    />
  )
)
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
