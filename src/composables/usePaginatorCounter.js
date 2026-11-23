import { computed, unref } from 'vue';

export function usePaginatorCounter(firstRef, rowsRef, totalRef, defaultRows = 5) {
  return computed(() => {
    const first = Number.isFinite(unref(firstRef)) ? unref(firstRef) : 0;
    const rows = Number.isFinite(unref(rowsRef)) ? unref(rowsRef) : defaultRows;
    const total = Number.isFinite(unref(totalRef)) ? unref(totalRef) : 0;

    if (total <= 0) {
      return 'Mostrando de 0 até 0 de 0 registros';
    }

    const inicio = first + 1;
    const fim = Math.min(first + rows, total);

    return `Mostrando de ${inicio} até ${fim} de ${total} registros`;
  });
}