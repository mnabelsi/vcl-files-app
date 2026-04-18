export default function SetupPage() {
  return (
    <div>
      <h1>Setup</h1>
      <div className="card">
        <h2>1. Connect Microsoft account</h2>
        <p>Start OAuth to grant read access to your OneDrive.</p>
        <a href="/api/ms/authorize"><button>Connect Microsoft</button></a>
      </div>
      <div className="card">
        <h2>2. Add OneDrive share URLs</h2>
        <form action="/api/shares" method="post" style={{ display: 'grid', gap: 8 }}>
          <textarea
            name="urls"
            rows={6}
            placeholder="One share URL per line"
          />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
}
