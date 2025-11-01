export const metadata = {
  title: "Contact — HumanAverage",
  description: "Get in touch with the editors."
};

export default function ContactPage() {
  return (
    <article className="space-y-4">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Contact</h1>
      <p>For general questions or correction requests, email: <a href="mailto:hello@humanaverage.com">hello@humanaverage.com</a></p>
      <p>We value feedback and ideas for new quizzes or polls.</p>
    </article>
  );
}
