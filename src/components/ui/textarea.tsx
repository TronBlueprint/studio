
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[100px] w-full rounded-xl border text-foreground placeholder:text-muted-foreground ring-offset-background transition-all duration-200 ease-in-out shadow-glass-soft',
          // Pearl white message UI inspired style
          "bg-white/[.18] dark:bg-black/[.18] backdrop-blur-xl",
          "border-white/[.25] dark:border-white/[.15]",
          "ring-1 ring-inset ring-white/40 dark:ring-1 dark:ring-inset dark:ring-white/20",

          // Focus state
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus-visible:border-primary/50",
          "focus-visible:bg-white/25 dark:focus-visible:bg-black/25",
          
          'disabled:cursor-not-allowed disabled:opacity-50',
          'px-4 py-2.5 text-base md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
