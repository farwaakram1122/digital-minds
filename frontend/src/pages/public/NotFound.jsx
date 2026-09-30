import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page container center narrow">
      <div className="eyebrow">404</div>
      <h1>That page is not at this market.</h1>
      <p className="lead">
        The link may have moved or no longer exists.
      </p>
      <Link
        className="btn btn-primary"
        to="/"
      >
        Back home
      </Link>
    </div>
  );
}
