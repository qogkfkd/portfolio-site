import { useEffect, useRef } from "react";

// 저장하지 않은 변경이 있으면 페이지를 떠날 때 브라우저 경고를 띄운다. 돌려주는 함수를 부르면 경고 없이 떠날 수 있다.
export function useUnsavedWarning(dirty: boolean): () => void {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return () => {
    dirtyRef.current = false;
  };
}
