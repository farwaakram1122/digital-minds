import { Instagram, Linkedin, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-column">
          <Link className="brand brand-light" to="/">
            <span className="brand-mark" aria-hidden="true">
              🌳
            </span>
            <span className="brand-copy">
              <strong>MarketLink</strong>
              <small>Local market</small>
            </span>
          </Link>

          <p>
            Reserve fresh local food before market day and collect directly from
            independent farmers.
          </p>

          <div className="socials">
            <span aria-label="Instagram">
              <Instagram size={17} />
            </span>
            <span aria-label="LinkedIn">
              <Linkedin size={17} />
            </span>
          </div>
        </div>

        <div>
          <h4>Explore</h4>
          <Link to="/products">Products</Link>
          <Link to="/farmers">Farmers</Link>
          <Link to="/markets">Markets</Link>
          <Link to="/about">About</Link>
        </div>

        <div>
          <h4>Support</h4>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/login">Account</Link>
        </div>

        <div>
          <h4>Contact</h4>
          <p>
            <Mail size={15} />
            Contact the team
          </p>
          <p>
            <MapPin size={15} />
            Markets across Pakistan
          </p>
          <small>Reservations are paid at pickup.</small>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 MarketLink 🌳. All rights reserved.</span>
        <span>Fresh food · Local people · Simple pickup</span>
      </div>
    </footer>
  );
}
