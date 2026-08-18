export default function ExploreLoading() {
  return (
    <section className="me-home" aria-busy="true" aria-label="Loading Motif Explorer">
      <div className="me-loading me-loading--hero" />
      <div className="me-loading me-loading--section" />
      <div className="me-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="me-loading me-loading--card" />
        ))}
      </div>
    </section>
  );
}
