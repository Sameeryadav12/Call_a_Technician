export default function Container({ className = "", children }) {
  return <div className={`container-app ${className}`}>{children}</div>;
}
