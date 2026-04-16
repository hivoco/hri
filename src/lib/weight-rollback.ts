type Listener = () => void;

let listener: Listener | null = null;

export function onWeightRollback(fn: Listener) {
  listener = fn;
  return () => { listener = null; };
}

export function triggerWeightRollback() {
  listener?.();
}
