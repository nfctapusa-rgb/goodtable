import { Legal } from "../legal";
export const metadata = { title: "Terms of Service | Lokly" };

export default function Terms() {
  return (
    <Legal title="Terms of Service" updated="November 19, 2026">
      <p>These terms govern your use of lokly.pro and the services offered by Lokly ("we", "us"). By using the site or buying a plan, you agree to them.</p>
      <h2>Our services</h2>
      <p>Lokly provides local marketing services, including website creation, Google Business Profile management, and related tools, as described on our <a href="/pricing">pricing page</a> at the time you purchase. Features marked "coming soon" are not yet available and are not part of what you're paying for until they launch.</p>
      <h2>No guaranteed results</h2>
      <p>Search rankings, map placement, traffic, calls and sales are controlled by Google and other third parties and depend on many factors outside our control. <b>We do not guarantee any specific ranking, placement or result.</b> Free reports and website previews are estimates based on publicly available information and may contain errors.</p>
      <h2>Your responsibilities and authorization</h2>
      <ul>
        <li>You confirm you own or are authorized to manage the business and any Google Business Profile, domain or accounts you ask us to work on, and you authorize us to act on your behalf for the services you buy.</li>
        <li>You're responsible for the accuracy of business information, offers, prices and hours you give us, and you approve offers and promotions before they're published.</li>
        <li>You must have the rights to any logos, photos and content you provide.</li>
      </ul>
      <h2>Reviews</h2>
      <p>We reply to reviews on your behalf. We will never write, buy or post fake reviews, or offer incentives in exchange for reviews, and you agree not to ask us to. We follow Google's policies.</p>
      <h2>Payments, cancellation and refunds</h2>
      <ul>
        <li>Monthly plans renew automatically each month until canceled. You can cancel anytime, effective at the end of the current billing period. We don't refund partial months.</li>
        <li>The one-time website fee covers the build described at purchase. Once work has started, it is non-refundable unless we fail to deliver.</li>
        <li>For Lokly Pro with point-of-sale ordering, a 5% fee applies to online orders placed directly through your Lokly site. No fee applies to orders placed through third-party links such as DoorDash or Uber Eats.</li>
        <li>Payments are processed by Stripe.</li>
      </ul>
      <h2>Third-party services</h2>
      <p>Our services rely on third parties such as Google, Stripe, DoorDash, Uber Eats and hosting providers. We are not affiliated with or endorsed by them and are not responsible for their actions, outages or policy changes.</p>
      <h2>Ownership</h2>
      <p>You own your business information, domain, Google Business Profile and customer data. Upon cancellation, we'll help you transfer your website content and domain.</p>
      <h2>Limitation of liability</h2>
      <p>To the maximum extent allowed by law, our total liability for any claim is limited to the amount you paid us in the three months before the claim, and we are not liable for indirect or consequential damages, such as lost profits.</p>
      <h2>Changes and contact</h2>
      <p>We may update these terms and will post the new date above. These terms are governed by the laws of California. Questions: <a href="mailto:hello@lokly.pro">hello@lokly.pro</a>.</p>
    </Legal>
  );
}
