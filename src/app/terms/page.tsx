export default function TermsOfUse() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Use</h1>
      <p className="text-sm text-foreground/70">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <p className="text-sm text-foreground/80">
        These Terms of Use ("Terms") govern your access to and use of AI Contract Assistant (the "Service"). By using the Service, you agree to be bound by these Terms.
      </p>

      <h2 className="text-xl font-semibold">License</h2>
      <p className="text-sm text-foreground/80">
        We grant you a limited, revocable, non‑exclusive, non‑transferable license to access and use the Service for informational purposes.
      </p>

      <h2 className="text-xl font-semibold">Acceptable Use</h2>
      <ul className="list-disc pl-6 text-sm text-foreground/80 space-y-2">
        <li>Do not upload content you lack rights to share.</li>
        <li>Do not attempt to reverse engineer, scrape, or overload the Service.</li>
        <li>Do not use outputs as a substitute for professional legal advice.</li>
      </ul>

      <h2 className="text-xl font-semibold">No Legal Advice</h2>
      <p className="text-sm text-foreground/80">
        The Service provides automated analyses for educational and informational purposes only and does not constitute legal advice. Consult a qualified attorney for legal matters.
      </p>

      <h2 className="text-xl font-semibold">No Warranties</h2>
      <p className="text-sm text-foreground/80">
        The Service and all outputs are provided "as is" and "as available" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, non‑infringement, accuracy, or reliability.
      </p>

      <h2 className="text-xl font-semibold">Limitation of Liability</h2>
      <p className="text-sm text-foreground/80">
        To the maximum extent permitted by law, in no event shall we be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or any loss of profits, revenues, data, goodwill, or other intangible losses, arising from or relating to your use of or reliance on the Service or its outputs, even if advised of the possibility of such damages. Our aggregate liability shall be zero to the fullest extent allowed by law.
      </p>

      <h2 className="text-xl font-semibold">Indemnity</h2>
      <p className="text-sm text-foreground/80">
        You agree to defend, indemnify, and hold us harmless from any claims, liabilities, damages, losses, and expenses arising from your use of the Service or violation of these Terms.
      </p>

      <h2 className="text-xl font-semibold">Termination</h2>
      <p className="text-sm text-foreground/80">
        We may suspend or terminate access at any time without notice for any reason. Upon termination, your right to use the Service will immediately cease.
      </p>

      <h2 className="text-xl font-semibold">Governing Law</h2>
      <p className="text-sm text-foreground/80">
        These Terms are governed by applicable law in the operator’s jurisdiction, without regard to conflict of laws provisions.
      </p>

      <h2 className="text-xl font-semibold">Changes</h2>
      <p className="text-sm text-foreground/80">
        We may modify these Terms at any time. Material changes will be reflected by updating the date above. Continued use constitutes acceptance of the updated Terms.
      </p>

      <h2 className="text-xl font-semibold">Contact</h2>
      <p className="text-sm text-foreground/80">
        For questions about these Terms, contact the site operator.
      </p>
    </div>
  );
}


