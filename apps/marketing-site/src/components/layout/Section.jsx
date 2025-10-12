export default function Section({ muted = false, className = "", children }) {
  return (
    <section className={`${muted ? "section-muted" : ""}`}>
      <div className={`section container-app ${className}`}>{children}</div>
    </section>
  );
}
