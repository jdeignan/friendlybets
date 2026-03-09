import { useState, useEffect } from "react";

const API = "https://friendlybets-backend-production.up.railway.app/api";

const MOCK_USER = { id: 1, username: "jdeignan", balance: 340 };
const MOCK_BETS = [
  { id: 1, title: "Duke vs UNC Spread", category: "factual", description: "Duke -4.5 vs North Carolina. Bet resolves at final buzzer. DraftKings line as of tip-off. Both teams must play for bet to be valid.", type: "spread", isPublic: true, admin: null, startTime: "2026-03-08T19:00:00", endTime: "2026-03-08T21:30:00", amount: 50, participants: ["jdeignan","mikeb","sarah_k","tomh"], myPick: "Duke -4.5", status: "live", result: null, odds: { home: "Duke -4.5", away: "UNC +4.5" } },
  { id: 2, title: "March Weight Loss Challenge", category: "admin", description: "Whoever loses the highest % of body weight by March 31st wins the pot. Each participant must submit weekly weigh-ins via photo to admin. Starting weights confirmed by March 8th. Admin (jdeignan) resolves on April 1st.", type: "custom", isPublic: false, admin: "jdeignan", startTime: "2026-03-08T00:00:00", endTime: "2026-03-31T23:59:00", amount: 100, participants: ["jdeignan","mikeb","sarah_k","tomh","lizz","pauld"], myPick: "Entered", status: "active", result: null },
  { id: 3, title: "Celtics ML Tonight", category: "factual", description: "Boston Celtics moneyline vs Miami Heat. -180 favorite. Bet resolves at final whistle of regulation or OT.", type: "moneyline", isPublic: true, admin: null, startTime: "2026-03-08T20:00:00", endTime: "2026-03-08T22:30:00", amount: 25, participants: ["jdeignan","tomh"], myPick: "Celtics ML", status: "live", result: null, odds: { home: "Celtics -180", away: "Heat +155" } },
  { id: 4, title: "Super Bowl MVP Prop", category: "admin", description: "Who will win Super Bowl MVP? Admin resolves after game ends.", type: "custom", isPublic: true, admin: "mikeb", startTime: "2026-02-09T18:00:00", endTime: "2026-02-09T22:00:00", amount: 20, participants: ["jdeignan","mikeb","sarah_k"], myPick: "Mahomes", status: "settled", result: "mikeb won $40" },
];
const MOCK_INVITES = [
  { id: 5, title: "NCAA Tournament Bracket Challenge", from: "sarah_k", amount: 25, expires: "2026-03-20T12:00:00", participants: 8 },
  { id: 6, title: "Golf Weekend Closest to Pin", from: "pauld", amount: 50, expires: "2026-03-15T08:00:00", participants: 4 },
];

const C = { bg: "#0d0f14", card: "#13161e", border: "#1e2330", green: "#00e676", red: "#ff4d6d", gold: "#ffd166", blue: "#4cc9f0", purple: "#a78bfa", text: "#e8eaf0", muted: "#4a5068" };

function Avatar({ name, size = 36, color = C.green }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${color}33,${color}11)`, border: `1.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color, flexShrink: 0 }}>{name?.[0]?.toUpperCase()}</div>;
}

function Pill({ status }) {
  const m = { live: [C.red, "● LIVE"], active: [C.green, "● ACTIVE"], settled: [C.muted, "✓ SETTLED"], pending: [C.gold, "◎ PENDING"] }[status] || [C.muted, status];
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: m[0], background: m[0]+"18", border: `1px solid ${m[0]}30`, padding: "3px 8px", borderRadius: 20 }}>{m[1]}</span>;
}

function CatBadge({ category }) {
  const isA = category === "admin";
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: isA ? C.purple : C.blue, background: isA ? C.purple+"18" : C.blue+"18", border: `1px solid ${isA ? C.purple : C.blue}30`, padding: "2px 7px", borderRadius: 20 }}>{isA ? "👑 ADMIN" : "⚡ FACTUAL"}</span>;
}

function Modal({ bet, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, maxWidth: 420, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>BET DETAILS</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 16 }}>{bet.title}</div>
        <div style={{ fontSize: 13, color: "#9aa0b8", lineHeight: 1.7, marginBottom: 20 }}>{bet.description}</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[["STARTS", bet.startTime], ["ENDS", bet.endTime]].map(([l, t]) => (
            <div key={l} style={{ flex: 1, background: "#0d0f14", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 11, color: C.text }}>{new Date(t).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>PARTICIPANTS ({bet.participants.length})</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{bet.participants.map(p => <span key={p} style={{ fontSize: 11, color: C.text, background: "#1e2330", padding: "4px 10px", borderRadius: 20 }}>@{p}</span>)}</div>
        </div>
        <button onClick={onClose} style={{ width: "100%", padding: 12, borderRadius: 12, background: C.green+"15", border: `1px solid ${C.green}30`, color: C.green, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
      </div>
    </div>
  );
}

function BetCard({ bet }) {
  const [show, setShow] = useState(false);
  const pot = bet.amount * bet.participants.length;
  const diff = new Date(bet.endTime) - new Date();
  const timeLeft = diff < 0 ? "Ended" : diff < 3600000 ? `${Math.floor(diff/60000)}m left` : diff < 86400000 ? `${Math.floor(diff/3600000)}h left` : `${Math.floor(diff/86400000)}d left`;
  return (
    <>
      {show && <Modal bet={bet} onClose={() => setShow(false)} />}
      <div style={{ background: C.card, border: `1px solid ${bet.status==="live" ? C.red+"44" : C.border}`, borderRadius: 16, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              <Pill status={bet.status} />
              <CatBadge category={bet.category} />
              {!bet.isPublic && <span style={{ fontSize: 9, color: C.gold, background: C.gold+"18", border: `1px solid ${C.gold}30`, padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>🔒 PRIVATE</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{bet.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{bet.description.slice(0, 60)}...</div>
              <button onClick={e => { e.stopPropagation(); setShow(true); }} style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "#1e2330", border: `1px solid ${C.border}`, color: C.blue, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "inherit" }}>i</button>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>${pot}</div>
            <div style={{ fontSize: 9, color: C.muted }}>POT</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 16 }}>
            {[["MY PICK", bet.myPick, C.blue], ["PLAYERS", bet.participants.length, C.text], ["WAGER", "$"+bet.amount, C.text]].map(([l,v,c]) => (
              <div key={l}><div style={{ fontSize: 9, color: C.muted }}>{l}</div><div style={{ fontSize: 12, fontWeight: 600, color: c }}>{v}</div></div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: bet.status === "settled" ? C.muted : C.gold }}>{timeLeft}</div>
        </div>
        {bet.result && <div style={{ marginTop: 10, padding: "8px 12px", background: C.gold+"10", borderRadius: 8, border: `1px solid ${C.gold}20`, fontSize: 11, color: C.gold }}>🏆 {bet.result}</div>}
      </div>
    </>
  );
}

function CreateModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", category: "", isPublic: true, amount: "", endDate: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: C.card, borderRadius: "24px 24px 0 0", padding: "28px 24px 44px", width: "100%", maxWidth: 480, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>New Bet</div><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>STEP {step} OF 3</div></div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e2330", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>{[1,2,3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.green : C.border }} />)}</div>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>What kind of bet?</div>
            {[["factual","⚡","Factual Result","Sports game, election — outcome is automatic"],["admin","👑","Admin Decides","Weight loss, golf, custom — you pick the winner"]].map(([k,icon,label,desc]) => (
              <div key={k} onClick={() => { set("category", k); setStep(2); }} style={{ padding: "16px 18px", borderRadius: 14, cursor: "pointer", background: form.category===k ? C.green+"10" : "#0d0f14", border: `1.5px solid ${form.category===k ? C.green : C.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{icon} {label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Bet Details</div>
            <input placeholder="Bet title" value={form.title} onChange={e => set("title", e.target.value)} style={{ padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
            <textarea placeholder="Description — terms, rules, how it resolves..." value={form.description} onChange={e => set("description", e.target.value)} rows={4} style={{ padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none" }} />
            <div style={{ display: "flex", gap: 10 }}>
              {["Public","Private"].map(opt => (
                <button key={opt} onClick={() => set("isPublic", opt==="Public")} style={{ flex: 1, padding: 10, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12, background: (opt==="Public")===form.isPublic ? C.green+"15" : "#0d0f14", border: `1px solid ${(opt==="Public")===form.isPublic ? C.green : C.border}`, color: (opt==="Public")===form.isPublic ? C.green : C.muted }}>
                  {opt === "Public" ? "🌐 Public" : "🔒 Private"}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(3)} disabled={!form.title} style={{ padding: 14, borderRadius: 12, background: form.title ? C.green+"20" : "#1e2330", border: `1px solid ${form.title ? C.green : C.border}`, color: form.title ? C.green : C.muted, fontWeight: 700, fontSize: 14, cursor: form.title ? "pointer" : "not-allowed", fontFamily: "inherit" }}>Continue →</button>
          </div>
        )}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Wager & Timing</div>
            <div><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>WAGER PER PERSON ($)</div><input type="number" placeholder="25" value={form.amount} onChange={e => set("amount", e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} /></div>
            <div><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>END DATE & TIME</div><input type="datetime-local" value={form.endDate} onChange={e => set("endDate", e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} /></div>
            <button onClick={onClose} style={{ padding: 14, borderRadius: 12, background: C.green+"20", border: `1px solid ${C.green}`, color: C.green, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>🎯 Create Bet</button>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeScreen({ user, onLogout }) {
  const active = MOCK_BETS.filter(b => b.status !== "settled");
  return (
    <div style={{ padding: "20px 16px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>My Bets</div><div style={{ fontSize: 11, color: C.muted }}>{active.length} active · ${active.reduce((s,b)=>s+b.amount*b.participants.length,0)} in play</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={user?.username || "?"} size={42} color={user?.avatarColor || C.green} /><button onClick={onLogout} style={{ background: "none", border: "1px solid #1e2330", borderRadius: 8, color: "#4a5068", fontSize: 10, padding: "4px 8px", cursor: "pointer", fontFamily: "inherit" }}>Sign out</button></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[["$"+MOCK_USER.balance,"Balance",C.green],[active.length,"Active",C.blue],[MOCK_INVITES.length,"Invites",C.gold]].map(([v,l,c]) => (
          <div key={l} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MOCK_BETS.map(bet => <BetCard key={bet.id} bet={bet} />)}
      </div>
    </div>
  );
}

function InvitesScreen() {
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Invites</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>{MOCK_INVITES.length} pending</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK_INVITES.map(inv => (
          <div key={inv.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{inv.title}</div><div style={{ fontSize: 11, color: C.muted }}>from <span style={{ color: C.blue }}>@{inv.from}</span> · {inv.participants} joined</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>${inv.amount}</div><div style={{ fontSize: 9, color: C.muted }}>WAGER</div></div>
            </div>
            <div style={{ fontSize: 10, color: C.gold, marginBottom: 12 }}>Expires {new Date(inv.expires).toLocaleDateString()}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: 10, borderRadius: 10, background: C.green+"15", border: `1px solid ${C.green}30`, color: C.green, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✓ Accept</button>
              <button style={{ flex: 1, padding: 10, borderRadius: 10, background: C.red+"10", border: `1px solid ${C.red}30`, color: C.red, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕ Decline</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveScreen() {
  const live = MOCK_BETS.filter(b => b.status === "live");
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Live Now</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>{live.length} bets in progress</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {live.map(bet => (
          <div key={bet.id} style={{ background: C.card, border: `1px solid ${C.red}33`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{bet.title}</div><Pill status="live" /></div>
            {bet.odds && <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>{[bet.odds.home, bet.odds.away].map((o,i) => <div key={i} style={{ flex: 1, background: "#0d0f14", borderRadius: 10, padding: "8px 12px", textAlign: "center" }}><div style={{ fontSize: 12, fontWeight: 700, color: i===0?C.blue:C.text }}>{o}</div></div>)}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}><span>My pick: <span style={{ color: C.blue }}>{bet.myPick}</span></span><span style={{ color: C.green }}>${bet.amount * bet.participants.length} pot</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// All unique users across all bets except current user
const ALL_USERS = [...new Set(MOCK_BETS.flatMap(b => b.participants))].filter(u => u !== MOCK_USER.username);

// Per-user head to head stats (mock)
const USER_STATS = {
  mikeb:   { wins: 3, losses: 2, net: +75,  bets: 5 },
  sarah_k: { wins: 1, losses: 3, net: -40,  bets: 4 },
  tomh:    { wins: 4, losses: 1, net: +120, bets: 5 },
  lizz:    { wins: 2, losses: 2, net: 0,    bets: 4 },
  pauld:   { wins: 1, losses: 1, net: -20,  bets: 2 },
};

function HistoryScreen() {
  const [filterUser, setFilterUser] = useState(null);
  const months = ["Oct","Nov","Dec","Jan","Feb","Mar"];
  const amounts = [80, 120, 95, 210, 145, 340];
  const max = Math.max(...amounts);

  const settled = MOCK_BETS.filter(b => b.status === "settled");
  const filtered = filterUser
    ? settled.filter(b => b.participants.includes(filterUser))
    : settled;

  const h2h = filterUser ? USER_STATS[filterUser] : null;

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>History</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Your betting record</div>

      {/* User filter pills */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>FILTER BY OPPONENT</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setFilterUser(null)}
            style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${!filterUser ? C.green : C.border}`, background: !filterUser ? C.green+"15" : "transparent", color: !filterUser ? C.green : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            All
          </button>
          {ALL_USERS.map(u => {
            const st = USER_STATS[u];
            const isSelected = filterUser === u;
            const netColor = !st ? C.muted : st.net > 0 ? C.green : st.net < 0 ? C.red : C.muted;
            return (
              <button key={u} onClick={() => setFilterUser(isSelected ? null : u)}
                style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${isSelected ? C.blue : C.border}`, background: isSelected ? C.blue+"15" : "transparent", color: isSelected ? C.blue : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                @{u}
                {st && <span style={{ fontSize: 9, color: netColor }}>{st.net > 0 ? "+" : ""}{st.net === 0 ? "±" : ""}{st.net !== 0 ? "$"+Math.abs(st.net) : "$0"}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* H2H stats when user is selected */}
      {h2h && (
        <div style={{ background: C.card, border: `1px solid ${C.blue}22`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.blue, letterSpacing: 1, marginBottom: 10 }}>HEAD TO HEAD vs @{filterUser}</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              [h2h.wins+"-"+h2h.losses, "Record", h2h.wins > h2h.losses ? C.green : h2h.wins < h2h.losses ? C.red : C.muted],
              [h2h.bets, "Bets", C.text],
              [(h2h.net >= 0 ? "+" : "") + "$" + h2h.net, "Net", h2h.net > 0 ? C.green : h2h.net < 0 ? C.red : C.muted],
            ].map(([v,l,c]) => (
              <div key={l} style={{ flex: 1, textAlign: "center", background: "#0d0f14", borderRadius: 10, padding: "10px 8px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly chart — only show when no filter */}
      {!filterUser && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 16 }}>$ IN PLAY — MONTHLY</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
            {months.map((m,i) => (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${(amounts[i]/max)*70}px`, background: i===months.length-1 ? `linear-gradient(180deg,${C.green},${C.green}88)` : `linear-gradient(180deg,${C.blue}88,${C.blue}44)` }} />
                <div style={{ fontSize: 8, color: C.muted }}>{m}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            {[["$340","This Month",C.green],["18-12","Record",C.blue],["$180","Net +",C.gold]].map(([v,l,c]) => (
              <div key={l} style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 9, color: C.muted }}>{l}</div></div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>
        {filterUser ? `BETS WITH @${filterUser.toUpperCase()} (${filtered.length})` : `ALL SETTLED BETS (${filtered.length})`}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted, fontSize: 13 }}>No settled bets with @{filterUser} yet</div>
          : filtered.map(bet => <BetCard key={bet.id} bet={bet} />)
        }
      </div>
    </div>
  );
}

const AVATAR_COLORS = ["#00e676","#4cc9f0","#ffd166","#ff4d6d","#a78bfa","#f97316","#ec4899","#14b8a6"];

function Input({ label, type="text", value, onChange, placeholder, error }) {
  return (
    <div>
      {label && <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "13px 16px", borderRadius: 12, background: "#0a0c12",
          border: `1px solid ${error ? C.red : C.border}`, color: C.text, fontSize: 14,
          fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }} />
      {error && <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function SplashScreen({ onLogin, onSignup }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, position: "relative", overflow: "hidden" }}>
      {/* Background decoration */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.green}08, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 250, height: 250, borderRadius: "50%", background: `radial-gradient(circle, ${C.blue}08, transparent 70%)`, pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🤝</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.text, letterSpacing: -1, marginBottom: 8 }}>FriendlyBets</div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Bet on anything with your crew.<br/>Spreads, props, or pure chaos.</div>
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 48 }}>
        {["⚡ Sports Spreads","👑 Custom Bets","🔒 Private Rooms","📊 Live Tracking"].map(f => (
          <span key={f} style={{ fontSize: 11, color: C.muted, background: C.card, border: `1px solid ${C.border}`, padding: "6px 12px", borderRadius: 20 }}>{f}</span>
        ))}
      </div>

      {/* CTA buttons */}
      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={onSignup} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#00b050)`, color: "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit", boxShadow: `0 6px 24px ${C.green}30` }}>
          Create Account
        </button>
        <button onClick={onLogin} style={{ width: "100%", padding: "15px", borderRadius: 14, cursor: "pointer", background: "transparent", border: `1px solid ${C.border}`, color: C.text, fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
          Sign In
        </button>
      </div>

      <div style={{ marginTop: 24, fontSize: 10, color: C.muted, textAlign: "center" }}>
        For entertainment purposes · No real money transfers
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onSignup, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API + "/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      localStorage.setItem("fb_token", data.token);
      onLogin({ ...data.user, avatarColor: data.user.avatar_color });
    } catch { setError("Connection error - try again"); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", alignSelf: "flex-start", padding: "4px 0", fontFamily: "inherit", marginBottom: 32 }}>←</button>

      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 13, color: C.muted }}>Sign in to your FriendlyBets account</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        <Input label="USERNAME" value={username} onChange={setUsername} placeholder="your_username" />
        <Input label="PASSWORD" type="password" value={password} onChange={setPassword} placeholder="••••••••" error={error} />
      </div>

      {/* Remember me */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, cursor: "pointer" }} onClick={() => setRemember(r => !r)}>
        <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${remember ? C.green : C.border}`, background: remember ? C.green+"20" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {remember && <span style={{ fontSize: 11, color: C.green }}>✓</span>}
        </div>
        <span style={{ fontSize: 13, color: C.muted }}>Remember me</span>
      </div>

      <button onClick={handleLogin} disabled={loading}
        style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", background: loading ? C.border : `linear-gradient(135deg,${C.green},#00b050)`, color: loading ? C.muted : "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit", marginBottom: 20, transition: "all 0.2s" }}>
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div style={{ textAlign: "center", fontSize: 13, color: C.muted }}>
        Don't have an account?{" "}
        <span onClick={onSignup} style={{ color: C.green, fontWeight: 700, cursor: "pointer" }}>Sign up</span>
      </div>


    </div>
  );
}

function SignupScreen({ onSignup, onLogin, onBack }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "", avatarColor: C.green });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = "At least 3 characters";
    if (form.username.includes(" ")) e.username = "No spaces allowed";
    if (!form.email || !form.email.includes("@")) e.email = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.password || form.password.length < 6) e.password = "At least 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const res = await fetch(API + "/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.username, email: form.email, password: form.password, avatarColor: form.avatarColor }) });
      const data = await res.json();
      if (!res.ok) { setErrors({ confirm: data.error || "Signup failed" }); setLoading(false); return; }
      localStorage.setItem("fb_token", data.token);
      onSignup({ ...data.user, avatarColor: data.user.avatar_color });
    } catch { setErrors({ confirm: "Connection error - try again" }); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: 24 }}>
      <button onClick={step === 1 ? onBack : () => setStep(s => s-1)} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", alignSelf: "flex-start", padding: "4px 0", fontFamily: "inherit", marginBottom: 32 }}>←</button>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 6 }}>
          {step === 1 ? "Create account" : step === 2 ? "Set password" : "Pick your avatar"}
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>Step {step} of 3</div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
        {[1,2,3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.green : C.border }} />)}
      </div>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="USERNAME" value={form.username} onChange={v => set("username", v.toLowerCase().replace(/\s/g,""))} placeholder="your_username" error={errors.username} />
          <Input label="EMAIL" type="email" value={form.email} onChange={v => set("email", v)} placeholder="you@email.com" error={errors.email} />
          <button onClick={() => validateStep1() && setStep(2)}
            style={{ marginTop: 8, width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#00b050)`, color: "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="PASSWORD" type="password" value={form.password} onChange={v => set("password", v)} placeholder="Min 6 characters" error={errors.password} />
          <Input label="CONFIRM PASSWORD" type="password" value={form.confirm} onChange={v => set("confirm", v)} placeholder="Same as above" error={errors.confirm} />
          <button onClick={() => validateStep2() && setStep(3)}
            style={{ marginTop: 8, width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#00b050)`, color: "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>
            Continue →
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Avatar preview */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Avatar name={form.username || "?"} size={72} color={form.avatarColor} />
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>@{form.username}</div>
          </div>
          {/* Color picker */}
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>CHOOSE AVATAR COLOR</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {AVATAR_COLORS.map(color => (
                <div key={color} onClick={() => set("avatarColor", color)}
                  style={{ width: 40, height: 40, borderRadius: "50%", background: color+"33", border: `2.5px solid ${form.avatarColor === color ? color : "transparent"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", boxShadow: form.avatarColor === color ? `0 0 12px ${color}66` : "none" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: color }} />
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleCreate} disabled={loading}
            style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", background: loading ? C.border : `linear-gradient(135deg,${C.green},#00b050)`, color: loading ? C.muted : "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit", transition: "all 0.2s" }}>
            {loading ? "Creating account..." : "🎯 Create Account"}
          </button>
        </div>
      )}

      {step === 1 && (
        <div style={{ marginTop: "auto", textAlign: "center", fontSize: 13, color: C.muted, paddingTop: 24 }}>
          Already have an account?{" "}
          <span onClick={onLogin} style={{ color: C.green, fontWeight: 700, cursor: "pointer" }}>Sign in</span>
        </div>
      )}
    </div>
  );
}

export default function FriendlyBets() {
  const [authScreen, setAuthScreen] = useState("splash"); // splash | login | signup
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [showCreate, setShowCreate] = useState(false);

  const handleLogin = (user) => { setCurrentUser(user); setAuthScreen(null); };
  const handleLogout = () => { setCurrentUser(null); setAuthScreen("splash"); setScreen("home"); };

  const nav = [["home","⬡","Bets"],["live","●","Live"],["invites","✉","Invites"],["history","◈","History"]];

  return (
    <div style={{ maxWidth: 390, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',system-ui,sans-serif", color: C.text, position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{display:none} input::placeholder,textarea::placeholder{color:#4a5068}`}</style>

      {/* Auth screens */}
      {!currentUser && authScreen === "splash" && <SplashScreen onLogin={() => setAuthScreen("login")} onSignup={() => setAuthScreen("signup")} />}
      {!currentUser && authScreen === "login" && <LoginScreen onLogin={handleLogin} onSignup={() => setAuthScreen("signup")} onBack={() => setAuthScreen("splash")} />}
      {!currentUser && authScreen === "signup" && <SignupScreen onSignup={handleLogin} onLogin={() => setAuthScreen("login")} onBack={() => setAuthScreen("splash")} />}

      {/* Main app */}
      {currentUser && (
        <>
          <div style={{ overflowY: "auto", height: "100vh", paddingBottom: 90 }}>
            {screen === "home" && <HomeScreen user={currentUser} onLogout={handleLogout} />}
            {screen === "live" && <LiveScreen />}
            {screen === "invites" && <InvitesScreen />}
            {screen === "history" && <HistoryScreen />}
          </div>
          {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 390, background: "rgba(13,15,20,0.97)", borderTop: `1px solid ${C.border}`, backdropFilter: "blur(20px)", padding: "8px 8px 24px", display: "flex", alignItems: "center", gap: 2, zIndex: 100 }}>
            {nav.map(([k,icon,label]) => (
              <button key={k} onClick={() => setScreen(k)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px", borderRadius: 12, border: "none", cursor: "pointer", background: screen===k ? C.green+"10" : "transparent", color: screen===k ? C.green : C.muted, fontFamily: "inherit" }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
              </button>
            ))}
            <button onClick={() => setShowCreate(true)} style={{ width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#00b050)`, color: "#000", fontSize: 26, fontWeight: 700, flexShrink: 0, boxShadow: `0 4px 20px ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
          </div>
        </>
      )}
    </div>
  );
}
