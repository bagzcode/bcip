export default function MotifGalleryLoading() {
  return (
    <section className="me-gallery" aria-busy="true" aria-label="Loading motif gallery">
      <div className="me-loading me-loading--title" />
      <div className="me-loading me-loading--filters" />
      <div className="me-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="me-loading me-loading--card" />
        ))}
      </div>
    </section>
  );
}
