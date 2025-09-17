type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  type?: ToastType;
}

class ToastManager {
  private toasts: Array<{ id: string; options: ToastOptions }> = [];
  private listeners: Array<(toasts: typeof this.toasts) => void> = [];

  subscribe(listener: (toasts: typeof this.toasts) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }

  show(options: ToastOptions) {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, options };
    
    this.toasts.push(toast);
    this.notify();

    // Auto remove after duration
    const duration = options.duration || 5000;
    setTimeout(() => {
      this.remove(id);
    }, duration);

    return id;
  }

  remove(id: string) {
    const index = this.toasts.findIndex(toast => toast.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notify();
    }
  }

  success(description: string, title?: string) {
    return this.show({ type: 'success', title, description });
  }

  error(description: string, title?: string) {
    return this.show({ type: 'error', title, description });
  }

  info(description: string, title?: string) {
    return this.show({ type: 'info', title, description });
  }

  warning(description: string, title?: string) {
    return this.show({ type: 'warning', title, description });
  }
}

export const toast = new ToastManager();