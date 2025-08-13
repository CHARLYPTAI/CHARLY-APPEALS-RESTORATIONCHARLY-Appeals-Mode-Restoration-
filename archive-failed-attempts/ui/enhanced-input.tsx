import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle } from "lucide-react";

export interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  touched?: boolean;
  label?: string;
  helperText?: string;
  required?: boolean;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    type, 
    error, 
    success, 
    touched, 
    label, 
    helperText, 
    required,
    id,
    ...props 
  }, ref) => {
    const hasError = touched && error;
    const hasSuccess = touched && success && !error;
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={inputId}
            className="flex items-center gap-1 text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500">*</span>}
            {hasSuccess && <CheckCircle className="w-4 h-4 text-green-500" />}
          </label>
        )}
        
        <input
          type={type}
          id={inputId}
          className={cn(
            // Base styles
            "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            // Dynamic border and focus colors based on validation state
            hasError
              ? "border-red-500 focus-visible:ring-red-500"
              : hasSuccess
              ? "border-green-500 focus-visible:ring-green-500"
              : "border-zinc-200 focus-visible:ring-zinc-400",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Error message */}
        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        )}
        
        {/* Helper text (only show if no error) */}
        {!hasError && helperText && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);
EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };