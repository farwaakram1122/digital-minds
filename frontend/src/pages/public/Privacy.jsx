const privacySections = [
  {
    title: 'Information we collect',
    text:
      'Account details may include name, email address, phone number ' +
      'and address. Reservation data may include selected products, ' +
      'market, pickup date and pickup window.',
  },
  {
    title: 'How information is used',
    text:
      'Information is used to provide account access, support pre-orders, ' +
      'show order status, remember favorites and communicate pickup-related ' +
      'updates.',
  },
  {
    title: 'Location data',
    text:
      'Market and farmer locations may be displayed through OpenStreetMap. ' +
      'Exact device location is not required to browse markets.',
  },
  {
    title: 'Security',
    text:
      'A production deployment should use secure authentication, encrypted ' +
      'transport, server-side validation, role-based authorization and ' +
      'protected secrets.',
  },
  {
    title: 'Data retention',
    text:
      'Production retention periods should be documented according to ' +
      'operational and legal requirements.',
  },
  {
    title: 'Your choices',
    text:
      'Users should be able to review profile information, manage favorites ' +
      'and contact the platform about account data.',
  },
  {
    title: 'Contact',
    text:
      'Questions can be submitted through the Contact page.',
  },
];

export default function Privacy() {
  return (
    <div className="page container narrow policy">
      <div className="eyebrow">PRIVACY</div>

      <h1>Privacy policy</h1>

      <p className="lead">
        This policy explains the kinds of information the
        application is designed to handle. It is not legal advice.
      </p>

      {privacySections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.text}</p>
        </section>
      ))}
    </div>
  );
}
