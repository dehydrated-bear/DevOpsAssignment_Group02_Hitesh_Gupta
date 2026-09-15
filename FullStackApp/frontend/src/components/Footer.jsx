export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>
        DevOps Task Manager &copy; {year} — Full stack application running on Docker.
      </p>
    </footer>
  );
}