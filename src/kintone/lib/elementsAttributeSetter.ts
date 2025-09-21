import { useEffect, useRef } from 'react';

/** Reactの外側にあるDOM要素の属性を一時的に変更するためのカスタムフック。
 *
 * @param selector 変更対象の要素を指定するセレクタ。
 * @returns 指定した要素の属性を変更する関数。属性名と値を引数に取る。値に`null`を指定すると元の値に戻す。
 */
export default function useElementsAttributeSetter(
  selector: string
): (name: string, value: string | null) => void {
  const elements = useRef<HTMLElement[]>([]);

  useEffect(() => {
    elements.current = [...document.querySelectorAll(selector)].filter(
      (elm): elm is HTMLElement => elm instanceof HTMLElement
    );
    elements.current.forEach((elm) => {
      elm.dataset.originalValues = '{}';
    });

    return () => {
      elements.current.forEach((elm) => {
        const originalValues = JSON.parse(
          elm.dataset.originalStyles || '{}'
        ) as Record<string, string>;
        for (const [prop, value] of Object.entries(originalValues)) {
          elm.setAttribute(prop, value);
        }
      });
    };
  }, [selector]);

  return (name: string, value: string | null) => {
    elements.current.forEach((elm) => {
      const originalValues = JSON.parse(
        elm.dataset.originalValues || '{}'
      ) as Record<string, string>;

      if (value === null) {
        if (name in originalValues) {
          value = originalValues[name];
        } else {
          return;
        }
      }

      if (name === 'style') {
        if (!(name in originalValues)) {
          originalValues[name] = elm.style.cssText;
        }
        elm.style.cssText = value;
      } else {
        if (!(name in originalValues)) {
          originalValues[name] = elm.getAttribute(name) || '';
        }
        elm.setAttribute(name, value);
      }
      elm.dataset.originalValues = JSON.stringify(originalValues);
    });
  };
}
