export const metadata = { title: "Free digital menu for restaurants & bars | Lokly Menu", description: "Put your menu online free: live link, QR code and NFC tap card, your logo and banner, specials and events. No app, no fees." };
export default async function MenuLanding({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <main>
      <section className="sc-hero"><div className="wrap ml-split">
        <div>
          <h1 className="sh-title sm">Your menu online. Free.</h1>
          <p className="sh-lead">Restaurants, cafés and bars: get a live menu page with your logo, banner, prices, specials and events. Share it with a QR code or a tap-to-open NFC card. Free forever, no app, no fees.</p>
          <ul className="sc-check" style={{ marginBottom: 20 }}>
            <li>Live link like lokly.pro/m/your-place</li><li>Your logo, banner and colors</li><li>Specials and events at the top</li>
            <li>Printable QR code for tables and windows</li><li>Call, directions and order buttons</li><li>Update prices anytime from your phone</li>
          </ul>
        </div>
        <form className="card form mn-signup" method="post" action="/api/menu">
          <b style={{ fontSize: 20 }}>Create your free menu</b>
          {err && <p className="err">Add your business name and a valid email.</p>}
          <label>Business name<input name="name" required maxLength={80} placeholder="Joe's Tacos" /></label>
          <label>Type<select name="kind" defaultValue="restaurant"><option value="restaurant">Restaurant</option><option value="cafe">Café / coffee</option><option value="bar">Bar / lounge</option><option value="food-truck">Food truck</option><option value="other">Other</option></select></label>
          <label>City<input name="city" maxLength={60} placeholder="Los Angeles" /></label>
          <label>Email (we send your private edit link)<input name="email" type="email" required autoComplete="email" /></label>
          <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" /></label>
          <button className="btn dark">Create my menu</button>
          <small className="muted">Free forever. Want tap-to-open menus? Add <a href="/features">Lokly NFC menu cards</a> anytime.</small>
        </form>
      </div></section>
      <section className="wrap sc-group"><h2 className="sh-h2">Live in 5 minutes.</h2>
        <div className="sc-feats">
          <div className="card sc-feat"><h3>1. Sign up free</h3><p>Name, city and email. Your page goes live instantly.</p></div>
          <div className="card sc-feat"><h3>2. Add your menu</h3><p>Sections, items, prices and photos, plus your logo and banner, right from your phone.</p></div>
          <div className="card sc-feat"><h3>3. Share it</h3><p>Print the QR code, add it to Instagram and Google, or put it on a tap-to-open NFC card.</p></div>
        </div>
        <p style={{ marginTop: 24 }}><a href="/menus">Browse menus near you</a></p>
      </section>
    </main>
  );
}
