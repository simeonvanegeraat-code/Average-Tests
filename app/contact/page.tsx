// app/contact/page.tsx
export const metadata = {
  title: "Contact • HumanAverage",
  description:
    "Get in touch with HumanAverage for questions, feedback, or correction requests. We value your input.",
  alternates: { canonical: "https://www.humanaverage.com/contact" },
};

export default function ContactPage() {
  const email = "firenature23@gmail.com";

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Contact</h1>
        <p className="mt-3 text-gray-700">
          Have a question, spotted an error, or want to suggest a new quiz or poll? We’d love to hear from you.
        </p>
        <p className="mt-3 text-gray-700">
          Email us at{" "}
          <a
            href={`mailto:${email}`}
            className="underline hover:no-underline"
          >
            {email}
          </a>
          .
        </p>
        <p className="mt-3 text-gray-700">
          We aim to respond within a few business days. Your feedback helps us improve and keep the content accurate.
        </p>
      </section>
    </main>
  );
}
