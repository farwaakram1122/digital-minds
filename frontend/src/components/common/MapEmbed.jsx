export default function MapEmbed({
  lat = 33.6844,
  lng = 73.0479,
  title = 'Market location',
}) {
  const boundingBox = [
    lng - 0.03,
    lat - 0.02,
    lng + 0.03,
    lat + 0.02,
  ].join('%2C');

  const mapUrl =
    'https://www.openstreetmap.org/export/embed.html' +
    `?bbox=${boundingBox}` +
    '&layer=mapnik' +
    `&marker=${lat}%2C${lng}`;

  return (
    <div className="map-frame">
      <iframe
        title={title}
        src={mapUrl}
        loading="lazy"
      />
    </div>
  );
}
