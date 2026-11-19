import { Legal } from "../legal";
export const metadata = { title: "Privacy Policy | Lokly" };

export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="November 19, 2026">
      <p>This policy explains what information Lokly ("we", "us") collects through lokly.pro and our services, how we use it, and the choices you have.</p>
      <h2>Information we collect</h2>
      <ul>
        <li><b>Information you give us:</b> your name, email, business name, website, city, phone number, and anything you type into our forms.</li>
        <li><b>Account information:</b> your email and a securely hashed password if you create an account.</li>
        <li><b>Business information from public sources:</b> when you request a free report, we look up publicly available information about your business, such as your public website and your Google Business Profile listing (name, address, hours, rating, review count and photos), using Google's official APIs.</li>
        <li><b>Payment information:</b> payments are processed by Stripe. We do not see or store your full card number.</li>
        <li><b>Usage information:</b> basic technical data such as pages visited, browser type, and how you arrived (for example, a QR code on a business card).</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>To create your free report and website preview.</li>
        <li>To provide the services you buy, such as managing your Google Business Profile, publishing posts and replying to reviews on your behalf.</li>
        <li>To bill you, provide support, and send you service-related messages.</li>
        <li>To follow up about your report, which you can opt out of at any time.</li>
        <li>To keep our services secure and improve them.</li>
      </ul>
      <h2>How we share information</h2>
      <p>We do not sell your personal information. We share information only with service providers that help us run Lokly (such as hosting, payments, email and Google's APIs), when you direct us to (for example, to publish to your Google profile), or when required by law.</p>
      <h2>Your California privacy rights</h2>
      <p>If you are a California resident, you have the right to know what personal information we collect, to request deletion or correction of it, and to not be discriminated against for exercising these rights. We do not sell or share personal information for cross-context behavioral advertising. To make a request, email <a href="mailto:hello@lokly.pro">hello@lokly.pro</a>.</p>
      <h2>Data retention and security</h2>
      <p>We keep information for as long as needed to provide our services and meet legal obligations, and use reasonable safeguards to protect it. No method of transmission or storage is 100% secure.</p>
      <h2>Children</h2>
      <p>Lokly is a business service and is not directed to children under 16.</p>
      <h2>Changes and contact</h2>
      <p>We may update this policy and will post the new date above. Questions: <a href="mailto:hello@lokly.pro">hello@lokly.pro</a>.</p>
    </Legal>
  );
}
