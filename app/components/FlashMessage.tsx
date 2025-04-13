import { Text } from "@radix-ui/themes";
import { useEffect, useState, type PropsWithChildren } from "react";
import type { FlashMessageColor } from "~/libs/flash-message";

export default function FlashMessage(
  props: PropsWithChildren<{
    color: FlashMessageColor;
  }>
) {
  const [isTimeOut, setIsTimeOut] = useState(false);
  useEffect(() => {
    setIsTimeOut(true);
    const timeoutId = setTimeout(() => {
      setIsTimeOut(false);
    }, 2000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className={`z-50 absolute left-1/2 -translate-x-1/2 duration-700 ease-in-out w-full ${
        isTimeOut ? "top-0" : "-top-[50vh]"
      }`}
    >
      <Text {...props} />
    </div>
  );
}
