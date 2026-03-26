import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function PageWrapper({
  children,
  className = "",
}: PageWrapperProps) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>
      {children}
    </div>
  );
}