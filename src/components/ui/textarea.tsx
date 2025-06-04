
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[100px] w-full rounded-xl border shadow-glass-soft text-foreground placeholder:text-muted-foreground ring-offset-background transition-all duration-200 ease-in-out',
          'bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/50 dark:border-white/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 focus-visible:bg-white/50 dark:focus-visible:bg-black/50',
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
