export default function SectionHeader({
  eyebrow,
  title,
  copy,
  action,
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && (
          <div className="eyebrow">
            {eyebrow}
          </div>
        )}

        <h2>{title}</h2>

        {copy && <p>{copy}</p>}
      </div>

      {action}
    </div>
  );
}
