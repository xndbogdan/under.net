export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
) {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;

    if (!timeout) {
      func.apply(context, args);
      timeout = setTimeout(() => {
        timeout = null;
        if (lastArgs) {
          func.apply(context, lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
}
