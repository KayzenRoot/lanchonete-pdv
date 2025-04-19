/**
 * Event bus hook for communication between components
 */
import { useMemo } from 'react';

type EventCallback = (...args: any[]) => void;

interface EventMap {
  [eventName: string]: EventCallback[];
}

class EventBus {
  private events: EventMap = {};

  // Register an event handler
  on(eventName: string, callback: EventCallback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);

    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  // Unregister an event handler
  off(eventName: string, callback: EventCallback) {
    if (!this.events[eventName]) return;
    
    this.events[eventName] = this.events[eventName].filter(
      (cb) => cb !== callback
    );
  }

  // Emit an event
  emit(eventName: string, ...args: any[]) {
    if (!this.events[eventName]) return;
    
    this.events[eventName].forEach((callback) => {
      callback(...args);
    });
  }
}

// Create a singleton instance
const eventBus = new EventBus();

// Define event names as constants
export const EVENT_SALE_COMPLETED = 'SALE_COMPLETED';

// Bind event methods once to avoid creating new function references
const boundOn = eventBus.on.bind(eventBus);
const boundOff = eventBus.off.bind(eventBus);
const boundEmit = eventBus.emit.bind(eventBus);

// Hook for components to use the event bus
export function useEventBus() {
  // Use useMemo to ensure the object reference stays stable between renders
  return useMemo(() => ({
    on: boundOn,
    off: boundOff,
    emit: boundEmit,
  }), []);
}

export default useEventBus; 