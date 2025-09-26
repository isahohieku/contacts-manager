const deepMapObject = <T>(
  data: T,
  callback: (value: unknown, key: string | number) => void,
): T => {
  const map = (value: unknown, key: string | number): void => {
    if (value !== undefined && value !== null && typeof value === 'object') {
      callback(value, key);

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          map(value[i], i);
        }
      } else {
        for (const k in value as Record<string, unknown>) {
          if (Object.prototype.hasOwnProperty.call(value, k)) {
            map((value as Record<string, unknown>)[k], k);
          }
        }
      }
    }
  };

  map(data, 'root');
  return data;
};

export default deepMapObject;
