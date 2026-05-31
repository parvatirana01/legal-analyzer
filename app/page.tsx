import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1C1917] font-sans text-[18px]">
      <h2 className="sr-only font-['Butler',serif]">
        Legal Document Analyzer — Clarius-themed single page homepage
      </h2>

      {/* Nav */}
      <nav className="flex items-center justify-between h-20 px-8 bg-[#FAFAF7]/90 border-b border-[#E5E0D5] backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-medium text-[#1C1917] text-[16px] font-montserrat">
          <i className="ti ti-scroll-text text-[16px] text-[#15803D]" aria-hidden="true"></i>
          Clarius
        </div>
        <div className="hidden md:flex gap-12">
          {["Products", "Solutions", "Industries", "Resources"].map((item) => (
            <a key={item} href="#" className="text-[18px] text-[#78716C] hover:text-[#1C1917] cursor-pointer">
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <SignInButton />
          <Link
            href="/dashboard"
            className="text-[14px] text-white bg-[#15803D] px-4 py-2 rounded-md font-medium inline-flex items-center font-lato"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#F5F0E8]/70 to-[#FAFAF7] pt-16 px-8 flex flex-col md:grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#15803D]/15 border border-[#15803D]/30 rounded-full px-4 py-1.5 text-[18px] font-medium text-[#15803D] mb-5">
            <i className="ti ti-sparkles text-[18px]" aria-hidden="true"></i>
            AI legal document analyzer
          </div>
          <h1 className="text-[32px] leading-[1.1] font-medium text-[#1C1917] mb-4 font-['Butler',serif]">
            Read your contract.<br />
            <span className="text-[#15803D]">In two minutes.</span>
          </h1>
          <p className="text-[16px] text-[#78716C] leading-[1.5] max-w-[800px] mb-7 font-montserrat">
            Upload any lease, NDA, employment agreement, or terms of service. Get a
            plain-English summary, a clause-by-clause risk breakdown, and answers
            to any question about it.
          </p>
          <div className="flex flex-wrap gap-4 mb-3">
            <Link
              href="/dashboard"
              className="bg-[#15803D] text-white border-none rounded-lg px-6 py-3 text-[14px] font-medium inline-flex items-center gap-2 transition-colors font-lato"
            >
              Try it free <i className="ti ti-arrow-right" aria-hidden="true"></i>
            </Link>
            <Link href="/dashboard" className="bg-white text-[#1C1917] border border-[#E5E0D5] rounded-lg px-6 py-3 text-[14px] transition-colors inline-flex items-center font-lato font-medium">
              Create an account
            </Link>
          </div>
          <p className="text-[18px] text-[#78716C]">
            No credit card · 3 free analyses per month
          </p>
        </div>

        {/* Hero Card */}
        <div className="relative pb-4 w-full max-w-lg mx-auto md:mx-0 mt-8 md:mt-0">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 rotate-1 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[18px] text-[#78716C] tracking-[0.08em] mb-1 uppercase font-montserrat">
                  Residential Lease
                </div>
                <div className="text-[16px] font-medium text-[#1C1917] font-montserrat">
                  apartment-lease.pdf
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[18px] font-medium border bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30">
                <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                Medium risk · 64/100
              </span>
            </div>
            
            <div className="flex items-start gap-4 bg-[#F5F0E8]/50 border border-[#E5E0D5] rounded-lg p-4 mb-3">
              <span className="flex-shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[18px] font-medium border bg-[#DC2626]/12 text-[#DC2626] border-[#DC2626]/25">
                <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                High
              </span>
              <div>
                <h4 className="text-[16px] font-medium text-[#1C1917] mb-1 font-montserrat">Automatic renewal</h4>
                <p className="text-[18px] text-[#78716C] leading-relaxed">Renews 12 months unless cancelled 60+ days in advance.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-[#F5F0E8]/50 border border-[#E5E0D5] rounded-lg p-4 mb-3">
              <span className="flex-shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[18px] font-medium border bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30">
                <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                Medium
              </span>
              <div>
                <h4 className="text-[16px] font-medium text-[#1C1917] mb-1 font-montserrat">Late fee</h4>
                <p className="text-[18px] text-[#78716C] leading-relaxed">$75 fee after 3-day grace period. Above market average.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-[#F5F0E8]/50 border border-[#E5E0D5] rounded-lg p-4">
              <span className="flex-shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[18px] font-medium border bg-[#15803D]/12 text-[#15803D] border-[#15803D]/25">
                <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                Low
              </span>
              <div>
                <h4 className="text-[16px] font-medium text-[#1C1917] mb-1 font-montserrat">Pet policy</h4>
                <p className="text-[18px] text-[#78716C] leading-relaxed">Pets allowed with $300 refundable deposit.</p>
              </div>
            </div>

            <div className="bg-[#F5F0E8] border border-[#E5E0D5] rounded-lg px-4 py-3 text-[18px] text-[#78716C] mt-4">
              <span className="text-[#1C1917] font-medium">You: </span>When can I terminate without penalty?
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-[#15803D]/10 translate-x-[14px] translate-y-[14px] -z-10"></div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-[#F5F0E8]/60 border-y border-[#E5E0D5] mt-12">
        {[
          { n: "50–70%", l: "Reduction in review time" },
          { n: "100%", l: "Consistent clause detection" },
          { n: "<5s", l: "First-pass analysis" },
          { n: "Full", l: "Audit trail & explainability" },
        ].map((stat, i) => (
          <div key={i} className="p-8 text-center border-b md:border-b-0 border-r border-[#E5E0D5] last:border-r-0">
            <span className="text-[32px] font-medium text-[#15803D] block mb-2 font-['Butler',serif]">{stat.n}</span>
            <span className="text-[18px] text-[#78716C]">{stat.l}</span>
          </div>
        ))}
      </div>

      {/* Section: The Challenge */}
      <section className="px-8 py-16 bg-[#F5F0E8]/60 border-y border-[#E5E0D5]">
        <div className="text-[18px] text-[#78716C] tracking-[0.09em] font-medium mb-3 uppercase font-montserrat">
          The Challenge
        </div>
        <h2 className="text-[32px] font-medium text-[#1C1917] mb-10 font-['Butler',serif]">
          Four major friction points in legal review
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { n: 1, c: "bg-[#15803D]/15 text-[#15803D]", t: "Document volume is increasing", d: "Organizations handle hundreds of agreements each year — procurement, HR, sales, vendor, compliance, and regulatory filings." },
            { n: 2, c: "bg-[#DC2626]/12 text-[#DC2626]", t: "Manual review consumes expert time", d: "Lawyers and compliance officers spend hours identifying clauses, obligations, or risks buried in complex documents." },
            { n: 3, c: "bg-[#D97706]/15 text-[#D97706]", t: "Lack of standardization", d: "Different reviewers interpret contracts differently, increasing organizational exposure and inconsistency across agreements." },
            { n: 4, c: "bg-[#15803D]/15 text-[#15803D]", t: "AI adoption is risky without guardrails", d: "Legal documents contain sensitive information, and unguided AI may produce hallucinated or unsafe interpretations." }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-[#E5E0D5] rounded-[20px] p-8">
              <div className={`w-10 h-10 rounded-lg bg-opacity-20 flex items-center justify-center text-[18px] font-medium mb-4 ${item.c}`}>
                {item.n}
              </div>
              <h3 className="text-[16px] font-medium text-[#1C1917] mb-3 font-montserrat">{item.t}</h3>
              <p className="text-[18px] text-[#78716C] leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: How it works */}
      <section className="px-8 py-16 bg-[#FAFAF7]">
        <div className="text-[18px] text-[#78716C] tracking-[0.09em] font-medium mb-3 uppercase font-montserrat">
          How it works
        </div>
        <h2 className="text-[32px] font-medium text-[#1C1917] mb-10 font-['Butler',serif]">
          From upload to insight in three steps
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "STEP 1", icon: "ti-upload", t: "Upload your document", d: "PDF or .docx, up to 25MB. Encrypted and isolated to your account. Never used for training." },
            { step: "STEP 2", icon: "ti-scan", t: "AI reads every clause", d: "Plain-English summary, party identification, pros and cons, and a per-clause risk score." },
            { step: "STEP 3", icon: "ti-messages", t: "Ask anything", d: "Chat with your contract using retrieval-augmented AI. Answers cite the document directly." },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-[#E5E0D5] rounded-[20px] p-8">
              <div className="w-16 h-16 rounded-full bg-[#15803D]/15 flex items-center justify-center text-[#15803D] text-[16px] mb-5">
                <i className={`ti ${item.icon}`} aria-hidden="true"></i>
              </div>
              <div className="text-[18px] text-[#78716C] tracking-[0.1em] font-medium mb-3">
                {item.step}
              </div>
              <h3 className="text-[16px] font-medium text-[#1C1917] mb-3 font-montserrat">{item.t}</h3>
              <p className="text-[18px] text-[#78716C] leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Capabilities */}
      <section className="px-8 py-16 bg-[#15803D]">
        <div className="text-[18px] text-white/60 tracking-[0.09em] font-medium mb-3 uppercase font-montserrat">
          Capabilities
        </div>
        <h2 className="text-[32px] font-medium text-white mb-10 font-['Butler',serif]">
          Extract and structure legal insights
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: "ti-file-text", t: "Document summary", d: "High-level overview of the contract or policy generated in seconds." },
            { icon: "ti-tag", t: "Key clause extraction", d: "Confidentiality, indemnity, liability limits, termination, IP ownership, and warranties." },
            { icon: "ti-users", t: "Obligations identification", d: "Responsibilities for each party, clearly categorized and attributed for easy review." },
            { icon: "ti-alert-triangle", t: "Risk assessment", d: "Surfaces vague clauses, unfavorable conditions, and missing provisions." },
            { icon: "ti-search", t: "Missing terms detection", d: "Clauses commonly expected but absent, flagged by document type." },
            { icon: "ti-shield-check", t: "Compliance indicators", d: "Alignment notes against internal guidelines or regulatory standards." },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 border border-white/20 rounded-[20px] p-8">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-white text-[16px]">
                  <i className={`ti ${item.icon}`} aria-hidden="true"></i>
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-white mb-3 font-montserrat">{item.t}</h3>
                  <p className="text-[18px] text-white/60 leading-relaxed">{item.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Workflow */}
      <section className="px-8 py-16 bg-[#F5F0E8]/60 border-y border-[#E5E0D5]">
        <div className="text-[18px] text-[#78716C] tracking-[0.09em] font-medium mb-3 uppercase font-montserrat">
          Workflow
        </div>
        <h2 className="text-[32px] font-medium text-[#1C1917] mb-10 font-['Butler',serif]">
          Governed, auditable, and explainable
        </h2>
        <div>
          {[
            { n: 1, t: "Document validation", d: "The system determines whether the uploaded text qualifies as a legal document before proceeding." },
            { n: 2, t: "AI-driven legal analysis", d: "Agent generates structured outputs with consistent, domain-specific interpretation for each document type." },
            { n: 3, t: "Governance & compliance", d: "Guardrails, model constraints, observability, policy enforcement, and full auditability on every output." },
          ].map((item, i) => (
            <div key={i} className="flex gap-6 items-start py-8 border-b border-[#E5E0D5] last:border-b-0">
              <div className="flex-shrink-0 mt-2 w-12 h-12 rounded-full bg-[#15803D]/10 text-[#15803D] text-[18px] font-medium flex items-center justify-center">
                {item.n}
              </div>
              <div>
                <h3 className="text-[16px] font-medium text-[#1C1917] mb-2 font-montserrat">{item.t}</h3>
                <p className="text-[18px] text-[#78716C] leading-relaxed">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Wrapper */}
      <div className="bg-[#15803D] py-20 px-8 text-center">
        <h2 className="text-[32px] font-medium text-white mb-4 font-['Butler',serif]">Try a contract right now.</h2>
        <p className="text-[18px] text-white/70 mb-10">Free. No signup. Under a minute.</p>
        <Link href="/dashboard" className="bg-white text-[#15803D] border-none rounded-lg px-8 py-4 text-[14px] font-medium inline-block font-lato">
          Analyze a document
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-[#F5F0E8] border-t border-[#E5E0D5] pt-16 px-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 pb-10 border-b border-[#E5E0D5]">
          <div>
            <div className="text-[16px] font-medium text-[#1C1917] flex items-center gap-3 mb-4 font-montserrat">
              <i className="ti ti-scroll-text text-[#15803D] text-[16px]" aria-hidden="true"></i>
              Clarius
            </div>
            <p className="text-[18px] text-[#78716C] leading-relaxed max-w-[400px]">
              <strong className="text-[#1C1917] font-medium">This tool does not provide legal advice.</strong> For decisions with material consequences, consult a qualified attorney in your jurisdiction.
            </p>
          </div>
          <div>
            <h4 className="text-[18px] font-medium text-[#78716C] tracking-[0.09em] mb-5 uppercase font-montserrat">Product</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">How it works</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">Capabilities</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">Pricing</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">Security</a>
            </div>
          </div>
          <div>
            <h4 className="text-[18px] font-medium text-[#78716C] tracking-[0.09em] mb-5 uppercase font-montserrat">Document Types</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">Leases</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">NDAs</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">Employment</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">SaaS contracts</a>
            </div>
          </div>
          <div>
            <h4 className="text-[18px] font-medium text-[#78716C] tracking-[0.09em] mb-5 uppercase font-montserrat">Company</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">About</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">Blog</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">Careers</a>
              <a href="#" className="text-[18px] text-[#78716C] hover:text-[#15803D]">Contact</a>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-8 text-[24px] text-[#78716C]">
          <span>© 2026 Clarius. All rights reserved.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#1C1917]">Privacy</a>
            <a href="#" className="hover:text-[#1C1917]">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
