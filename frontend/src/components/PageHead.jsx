export default function PageHead({ judul, children }) {
  return (
    <section className="pagehead">
      <h1>{judul}</h1>
      {children && <p>{children}</p>}
    </section>
  );
}
