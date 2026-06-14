import { AlertTriangle, ArrowLeft, Cloud, Code2, Crown, Database, Globe, Mail, Phone, Server, ShieldCheck, Sparkles, UserRound, Users, Zap } from "lucide-react"
import { FiGithub } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import "./Team.css"

export default function Team() {
  const navigate = useNavigate()
  const members = [
    {
      name: "Sanket Prashant Padhyal",
      role: "Team Leader",
      detail: "Full Stack Developer • CSE • First Year",
      phone: "9284024617",
      email: "sanket99e@gmail.com",
      leader: true
    },
    {
      name: "Jidnyasa Chandrakant Nil",
      role: "Research Stuff",
      detail: "Images generation • CSE • First Year",
      phone: "9699599123",
      email: "jcnil1312@gmail.com"
    },
    {
      name: "Aarushi Mahendra Chaudhari",
      role: "UI/UX Support",
      detail: "Helped in UI/UX • CSE • First Year",
      phone: "9146914380",
      email: "aarushic083@gmail.com"
    },
    {
      name: "Harshada Avinash Patil",
      role: "Backend Hosting",
      detail: "Hosted and managed backend • DS • First Year",
      phone: "9423943155",
      email: "pharshada994@gmail.com"
    }
  ]

  const leader = members.find((member) => member.leader)
  const teamMembers = members.filter((member) => !member.leader)
  const techStack = [
    {
      title: "Frontend",
      detail: "React + CSS",
      icon: <Code2 size={18} strokeWidth={2.2} />,
      tone: "blue"
    },
    {
      title: "Backend",
      detail: "Node.js + Express",
      icon: <Server size={18} strokeWidth={2.2} />,
      tone: "emerald"
    },
    {
      title: "Auth & Database",
      detail: "Firebase Auth + Firestore",
      icon: <Database size={18} strokeWidth={2.2} />,
      tone: "amber"
    },
    {
      title: "Cloud Storage",
      detail: "Firebase Storage on Blaze plan",
      icon: <Cloud size={18} strokeWidth={2.2} />,
      tone: "sky"
    },
    {
      title: "Backend Hosting",
      detail: "Google Cloud",
      icon: <Server size={18} strokeWidth={2.2} />,
      tone: "violet"
    },
    {
      title: "Frontend Hosting",
      detail: "Netlify with DNS, domain, and SSL",
      icon: <Globe size={18} strokeWidth={2.2} />,
      tone: "rose"
    }
  ]

  return (
    <div className="team-page">
      <Navbar />

      <div className="team-container">
        <section className="team-hero">
          <button type="button" className="team-back-button" onClick={() => navigate("/home")}>
            <ArrowLeft size={16} strokeWidth={2.3} />
          </button>
          <br></br>

          <div className="team-badge">
            <Sparkles size={14} strokeWidth={2.2} />
            <span>Hackathon Team</span>
          </div>

          <h1 className="team-title">Built by Stack Smashers</h1>
          <p className="team-subtitle">Meet the team behind Kiwi and the AdSync engine, designed with a clean product mindset and a strong collaborative build process.</p>

          <div className="team-highlights">
            <div className="team-highlight-item team-highlight-team">
              <Users size={16} strokeWidth={2.2} />
              <span>4 team members</span>
            </div>
            <div className="team-highlight-item team-highlight-shield">
              <ShieldCheck size={16} strokeWidth={2.2} />
              <span>Product + engine focused</span>
            </div>
          </div>
        </section>

        <section className="team-section">
          <div className="team-section-head">
            <span className="team-section-kicker">Team Direction</span>
            <h2 className="team-section-title">Leadership</h2>
            <p className="team-section-copy">Driving product direction, development pace, and execution across the Kiwi storefront and AdSync workflow.</p>
          </div>

          <div className="team-card team-card-leader">
            <div className="team-card-top">
              <div className="team-member-icon leader-icon">
                <Crown size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="team-role-tag">{leader.role}</p>
                <h3 className="team-name">{leader.name}</h3>
                <p className="team-role">{leader.detail}</p>
              </div>
            </div>

                <div className="team-contact-list">
                  <div className="team-contact-item">
                    <Phone size={15} strokeWidth={2.2} className="team-contact-phone-icon" />
                    <span>{leader.phone}</span>
                  </div>
                  <div className="team-contact-item">
                    <Mail size={15} strokeWidth={2.2} className="team-contact-mail-icon" />
                    <span>{leader.email}</span>
                  </div>
                </div>
          </div>
        </section>

        <section className="team-section">
          <div className="team-section-head">
            <span className="team-section-kicker">Execution Team</span>
            <h2 className="team-section-title">Core Team</h2>
            <p className="team-section-copy">Supporting research, interface refinement, backend hosting, and the broader delivery of the hackathon product.</p>
          </div>

          <div className="team-grid">
            {teamMembers.map((member) => (
              <div key={member.email} className="team-card">
                <div className="team-card-top">
                  <div className="team-member-icon member-icon-pink">
                    <UserRound size={17} strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="team-role-tag">{member.role}</p>
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.detail}</p>
                  </div>
                </div>

                <div className="team-contact-list">
                  <div className="team-contact-item">
                    <Phone size={15} strokeWidth={2.2} className="team-contact-phone-icon" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="team-contact-item">
                    <Mail size={15} strokeWidth={2.2} className="team-contact-mail-icon" />
                    <span>{member.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="team-section">
          <div className="team-section-head">
            <span className="team-section-kicker">Hackathon Problem</span>
            <h2 className="team-section-title">Problem & Our Solution</h2>
            <p className="team-section-copy">
              Addressing real-world challenges in digital customer targeting and engagement.
            </p>
          </div>

          <div className="team-problem-solution">
            <div className="team-problem-card">
              <div className="team-problem-heading">
                <div className="team-problem-icon team-problem-icon-alert">
                  <AlertTriangle size={18} strokeWidth={2.2} />
                </div>
                <h3>Problem (BA-1: Improve Customer Reach)</h3>
              </div>
              <p>
                Businesses struggle to reach the right audience in today&apos;s competitive market.
                Traditional digital marketing shows generic products without understanding user
                behavior, leading to low engagement, poor conversions, and inefficient targeting.
              </p>
            </div>

            <div className="team-solution-card">
              <div className="team-problem-heading">
                <div className="team-problem-icon team-problem-icon-solution">
                  <Zap size={18} strokeWidth={2.2} />
                </div>
                <h3>Our Solution (Kiwi AdSync Engine)</h3>
              </div>
              <p>
                We built a real-time behavior-driven system that tracks user interactions like
                clicks, views, and cart actions. Based on this data, the system dynamically adapts
                product recommendations and pricing to target users more effectively and improve
                engagement.
              </p>
            </div>
          </div>
        </section>

        <section className="team-section">
          <div className="team-section-head">
            <span className="team-section-kicker">Architecture</span>
            <h2 className="team-section-title">Tech Stack</h2>
            <p className="team-section-copy">The core technologies used to design, run, secure, and host the Kiwi shopping experience.</p>
          </div>

          <div className="team-stack-grid">
            {techStack.map((item) => (
              <div key={item.title} className="team-stack-card">
                <div className={`team-stack-icon team-stack-icon-${item.tone}`}>
                  {item.icon}
                </div>
                <div className="team-stack-copy">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
