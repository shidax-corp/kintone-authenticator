import { useEffect, useRef } from 'react';

export type SettableAttributeKey = 'style' | 'textContent';

const entries = Object.entries as <K extends string, V>(
  o: Partial<Record<K, V>>
) => [K, V][];

const getOriginalValues = (elm: HTMLElement) => {
  return JSON.parse(elm.dataset.originalValues || '{}') as Partial<
    Record<SettableAttributeKey, string>
  >;
};

/** Reactの外側にあるDOM要素の属性を一時的に変更するためのカスタムフック。
 *
 * @param selector 変更対象の要素を指定するセレクタ。
 * @returns 指定した要素の属性を変更する関数。属性名と値を引数に取る。値に`null`を指定すると元の値に戻す。
 */
export default function useElementsAttributeSetter(
  selector: string
): (name: SettableAttributeKey, value: string | null) => void {
  const elements = useRef<HTMLElement[]>([]);

  const setter = (name: SettableAttributeKey, value: string | null) => {
    elements.current.forEach((elm) => {
      const originalValues = getOriginalValues(elm);

      if (value === null) {
        if (originalValues[name] !== undefined) {
          value = originalValues[name];
        } else {
          return;
        }
      }

      if (name === 'style') {
        if (originalValues[name] === undefined) {
          originalValues[name] = elm.style.cssText;
        }
        elm.style.cssText = value;
      } else {
        if (originalValues[name] === undefined) {
          originalValues[name] = elm[name];
        }
        Object.assign(elm, { [name]: value });
      }
      elm.dataset.originalValues = JSON.stringify(originalValues);
    });
  };

  useEffect(() => {
    elements.current = [...document.querySelectorAll(selector)].filter(
      (elm): elm is HTMLElement => elm instanceof HTMLElement
    );
    elements.current.forEach((elm) => {
      elm.dataset.originalValues = '{}';
    });

    return () => {
      elements.current.forEach((elm) => {
        const originalValues = getOriginalValues(elm);

        for (const [prop, value] of entries(originalValues)) {
          setter(prop, value);
        }
      });
    };
  }, [selector]);

  return setter;
}
