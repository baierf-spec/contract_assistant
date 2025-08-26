export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-foreground/70">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <p className="text-sm text-foreground/80">
        We respect your privacy. This Privacy Policy explains how we handle information when you use AI Contract Assistant.
      </p>

      <h2 className="text-xl font-semibold">Information We Process</h2>
      <p className="text-sm text-foreground/80">
        When you upload a document or type text, that content is processed to generate summaries, risks, and answers. We may temporarily store content in memory during processing. We do not sell personal data.
      </p>

      <h2 className="text-xl font-semibold">Data Storage</h2>
      <p className="text-sm text-foreground/80">
        Uploaded files and derived text may be processed transiently. Unless explicitly stated otherwise in the product, we do not persist your files long‑term. If you require stricter controls, use a self‑hosted or offline deployment.
      </p>

      <h2 className="text-xl font-semibold">Third‑Party Services</h2>
      <p className="text-sm text-foreground/80">
        We may use third‑party AI, OCR, storage, or analytics providers to operate features. Those providers may process data on our behalf subject to their terms.
      </p>

      <h2 className="text-xl font-semibold">Security</h2>
      <p className="text-sm text-foreground/80">
        We use commercially reasonable safeguards to protect information. However, no method of transmission or storage is 100% secure. You are responsible for selecting what you upload.
      </p>

      <h2 className="text-xl font-semibold">Your Choices</h2>
      <ul className="list-disc pl-6 text-sm text-foreground/80 space-y-2">
        <li>Do not upload sensitive or confidential documents you are not permitted to share.</li>
        <li>Use anonymized samples where possible.</li>
        <li>Contact us to request deletion if persistent storage is introduced.</li>
      </ul>

      <h2 className="text-xl font-semibold">No Legal Advice; No Warranties; No Liability</h2>
      <p className="text-sm text-foreground/80">
        The service provides automated analyses for informational purposes only and does not constitute legal advice. We make no representations or warranties of any kind, express or implied, including accuracy, reliability, or fitness for a particular purpose. To the maximum extent permitted by law, we disclaim all liability for any loss, damage, or consequences arising from use of or reliance on the service or its outputs.
      </p>

      <h2 className="text-xl font-semibold">International Users</h2>
      <p className="text-sm text-foreground/80">
        If you access the service from outside your jurisdiction, you are responsible for compliance with local laws.
      </p>

      <h2 className="text-xl font-semibold">Changes</h2>
      <p className="text-sm text-foreground/80">
        We may update this Privacy Policy from time to time. Material changes will be reflected by updating the date above. Your continued use constitutes acceptance.
      </p>

      <h2 className="text-xl font-semibold">Contact</h2>
      <p className="text-sm text-foreground/80">
        For questions about this policy, contact the site operator.
      </p>
    </div>
  );
}


