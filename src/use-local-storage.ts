import React, { useEffect } from "react";

let lsBus: any = {};

/**
 * Redraw all components that have a hook to localStorage with the given key.
 * @param {string} key
 * @param {*} newValue
 */
const notifyLSBus = (key: string, newValue: any) => {
  if (!lsBus || !lsBus[key]) {
    return;
  }
  Object.values(lsBus[key]).forEach((u: any) => u(newValue));
};

/**
 * Hooks into localStorage. The value will be taken from localStorage, if the key exists there.
 * If not, the value will use the `initialValue` data. Use the setFunction to update the value inside
 * localStorage _and_ notify all components that use the same hook that the value behind the key has changed.
 *
 * You can pass whatever is JSON encodable to the setFunction - it will take care of storing it correctly.
 * @param {string} key
 * @param {*} [initialValue=null]
 * @returns {Array} [value, setFunction]
 */
export const useLocalStorage = (key: string, initialValue: any = null) => {
  let defaultValue;
  try {
    defaultValue = localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : initialValue;
  } catch (e) {
    defaultValue = initialValue;
  }
  const [value, setValue] = React.useState(defaultValue);
  const componentId = React.useState(Math.random().toString())[0];

  useEffect(() => {
    lsBus[key] = lsBus[key] || {};
    lsBus[key][componentId] = setValue;
    return () => {
      delete lsBus[componentId];
    };
  }, []);

  return [
    value,
    (newValue: any) => {
      localStorage.setItem(key, JSON.stringify(newValue));
      notifyLSBus(key, newValue);
    },
  ];
};
