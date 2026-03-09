import { useState, useEffect } from "react";

const API = "https://friendlybets-backend-production.up.railway.app/api";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("fb_token");
  const res = await fetch(API + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...opts.headers }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reload = () => {
    setLoading(true);
    apiFetch(path).then(d => { setData(d); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  };
  useEffect(reload, deps);
  return { data, loading, error, reload };
}



const C = { bg: "#0d0f14", card: "#13161e", border: "#1e2330", green: "#00e676", red: "#ff4d6d", gold: "#ffd166", blue: "#4cc9f0", purple: "#a78bfa", text: "#e8eaf0", muted: "#4a5068" };

function Avatar({ name, size = 36, color = C.green, animalId = null }) {
  if (animalId) {
    const animal = getAnimal(animalId);
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${animal.color}33,${animal.color}11)`, border: `1.5px solid ${animal.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.52, flexShrink: 0 }}>
        {animal.emoji}
      </div>
    );
  }
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

function Modal({ bet, onClose, onResolve }) {
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
        <div style={{ display: "flex", gap: 10 }}>
          {bet.category === "admin" && bet.status !== "settled" && (
            <button onClick={() => { onClose(); onResolve && onResolve(bet); }} style={{ flex: 1, padding: 12, borderRadius: 12, background: C.gold+"15", border: `1px solid ${C.gold}30`, color: C.gold, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>🏆 Settle</button>
          )}
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, background: C.green+"15", border: `1px solid ${C.green}30`, color: C.green, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function BetCard({ bet, onResolve }) {
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

function CreateModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", category: "", isPublic: true, amount: "", endDate: "" });
  const [inviteSearch, setInviteSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [invitees, setInvitees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const searchUsers = async (q) => {
    setInviteSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.filter(u => !invitees.find(i => i.id === u.id)));
    } catch {}
  };

  const addInvitee = (u) => { setInvitees(i => [...i, u]); setSearchResults([]); setInviteSearch(""); };
  const removeInvitee = (id) => setInvitees(i => i.filter(u => u.id !== id));

  const handleCreate = async () => {
    if (!form.amount) return;
    setSaving(true);
    try {
      const bet = await apiFetch("/bets", { method: "POST", body: JSON.stringify({ title: form.title, description: form.description, category: form.category, amount: Number(form.amount), endTime: form.endDate || null, isPublic: form.isPublic }) });
      if (invitees.length > 0) {
        await apiFetch(`/bets/${bet.id}/invite`, { method: "POST", body: JSON.stringify({ userIds: invitees.map(u => u.id) }) });
      }
      setDone(true);
      setTimeout(() => { onCreated && onCreated(); onClose(); }, 1200);
    } catch { setSaving(false); }
  };

  if (done) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 56, marginBottom: 12 }}>🎯</div><div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>Bet Created!</div></div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: C.card, borderRadius: "24px 24px 0 0", padding: "28px 24px 44px", width: "100%", maxWidth: 480, border: `1px solid ${C.border}`, maxHeight: "90vh", overflowY: "auto" }}>
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
            <textarea placeholder="Description — terms, rules, how it resolves..." value={form.description} onChange={e => set("description", e.target.value)} rows={3} style={{ padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none" }} />
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Wager, Timing & Invite</div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>WAGER PER PERSON ($)</div>
              <input type="number" placeholder="25" value={form.amount} onChange={e => set("amount", e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>END DATE & TIME</div>
              <input type="datetime-local" value={form.endDate} onChange={e => set("endDate", e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
            </div>

            {/* Invite by username */}
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>INVITE FRIENDS (optional)</div>
              <input placeholder="Search by username..." value={inviteSearch} onChange={e => searchUsers(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              {searchResults.length > 0 && (
                <div style={{ background: "#0a0c12", border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, overflow: "hidden" }}>
                  {searchResults.map(u => (
                    <div key={u.id} onClick={() => addInvitee(u)}
                      style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
                      <Avatar name={u.username} size={28} color={C.blue} />
                      <span style={{ fontSize: 13, color: C.text }}>@{u.username}</span>
                    </div>
                  ))}
                </div>
              )}
              {invitees.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {invitees.map(u => (
                    <span key={u.id} onClick={() => removeInvitee(u.id)}
                      style={{ fontSize: 11, color: C.green, background: C.green+"15", border: `1px solid ${C.green}30`, padding: "4px 10px", borderRadius: 20, cursor: "pointer" }}>
                      @{u.username} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleCreate} disabled={!form.amount || saving}
              style={{ padding: 14, borderRadius: 12, background: form.amount && !saving ? C.green+"20" : "#1e2330", border: `1px solid ${form.amount && !saving ? C.green : C.border}`, color: form.amount && !saving ? C.green : C.muted, fontWeight: 800, fontSize: 14, cursor: form.amount && !saving ? "pointer" : "not-allowed", fontFamily: "inherit", marginTop: 4 }}>
              {saving ? "Creating..." : "🎯 Create Bet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeScreen({ user, onLogout, onResolve }) {
  const { data: bets, loading, reload } = useApi("/bets");
  const [tab, setTab] = useState("active");
  const allBets = bets || [];
  const tabs = { active: allBets.filter(b => b.status === "active"), live: allBets.filter(b => b.status === "live"), settled: allBets.filter(b => b.status === "settled") };
  const shown = tabs[tab] || [];
  const inPlay = allBets.filter(b => b.status !== "settled").reduce((s, b) => s + b.amount * (b.participant_count || 1), 0);

  return (
    <div style={{ padding: "20px 16px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>My Bets</div>
          <div style={{ fontSize: 11, color: C.muted }}>{allBets.filter(b=>b.status!=="settled").length} active · ${inPlay} in play</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={user?.username || "?"} size={42} animalId={user?.animal_id} color={user?.avatarColor || C.green} />
          <button onClick={onLogout} style={{ background: "none", border: "1px solid #1e2330", borderRadius: 8, color: "#4a5068", fontSize: 10, padding: "4px 8px", cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[["$"+(user?.balance||0),"Balance",C.green],[tabs.active.length,"Active",C.blue],[tabs.live.length,"Live",C.red]].map(([v,l,c]) => (
          <div key={l} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.card, borderRadius: 12, padding: 4 }}>
        {[["active","Active"],["live","● Live"],["settled","Settled"]].map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700,
              background: tab===k ? (k==="live" ? C.red+"20" : C.green+"20") : "transparent",
              color: tab===k ? (k==="live" ? C.red : C.green) : C.muted }}>
            {label} {tabs[k]?.length > 0 ? `(${tabs[k].length})` : ""}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading bets...</div>}
      {!loading && shown.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{tab==="live" ? "📡" : tab==="settled" ? "📋" : "🎯"}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No {tab} bets yet</div>
          <div style={{ fontSize: 12 }}>Tap + to create one!</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.map(bet => <BetCard key={bet.id} bet={{
          ...bet,
          participants: Array(bet.participant_count || 1).fill(""),
          myPick: bet.my_pick,
          endTime: bet.end_time,
          startTime: bet.start_time,
          isPublic: bet.is_public,
        }} onResolve={(b) => { onResolve(b); }} onResolved={reload} />)}
      </div>
    </div>
  );
}

function InvitesScreen() {
  const { data: invites, loading, reload } = useApi("/invites");
  const list = invites || [];

  const respond = async (id, action) => {
    try {
      await apiFetch(`/invites/${id}/${action}`, { method: "POST" });
      reload();
    } catch {}
  };

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Invites</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>{list.length} pending</div>
      {loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading...</div>}
      {!loading && list.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No pending invites</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map(inv => (
          <div key={inv.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{inv.title}</div>
                <div style={{ fontSize: 11, color: C.muted }}>from <span style={{ color: C.blue }}>@{inv.from_username}</span> · {inv.participant_count} joined</div>
              </div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>${inv.amount}</div><div style={{ fontSize: 9, color: C.muted }}>WAGER</div></div>
            </div>
            {inv.end_time && <div style={{ fontSize: 10, color: C.gold, marginBottom: 12 }}>Ends {new Date(inv.end_time).toLocaleDateString()}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => respond(inv.id, "accept")} style={{ flex: 1, padding: 10, borderRadius: 10, background: C.green+"15", border: `1px solid ${C.green}30`, color: C.green, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✓ Accept</button>
              <button onClick={() => respond(inv.id, "decline")} style={{ flex: 1, padding: 10, borderRadius: 10, background: C.red+"10", border: `1px solid ${C.red}30`, color: C.red, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕ Decline</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveScreen() {
  const { data: bets, loading } = useApi("/bets");
  const live = (bets || []).filter(b => b.status === "live");
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Live Now</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>{live.length} bets in progress</div>
      {loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading...</div>}
      {!loading && live.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No live bets right now</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {live.map(bet => (
          <BetCard key={bet.id} bet={{
            ...bet,
            participants: Array(bet.participant_count || 1).fill(""),
            myPick: bet.my_pick,
            endTime: bet.end_time,
            startTime: bet.start_time,
            isPublic: bet.is_public,
          }} />
        ))}
      </div>
    </div>
  );
}



function HistoryScreen() {
  const { data: bets, loading } = useApi("/bets");
  const [filterUser, setFilterUser] = useState(null);
  const allBets = bets || [];

  // Get all settled bets
  const settled = allBets.filter(b => b.status === "settled");

  // Build opponent list from settled bets
  const opponents = [...new Set(
    settled.flatMap(b => (b.participants_list || []).filter(p => p !== b.my_username))
  )];

  // Filter by opponent if selected
  const filtered = filterUser
    ? settled.filter(b => (b.participants_list || []).includes(filterUser))
    : settled;

  // Compute H2H stats from real data
  const h2h = filterUser ? (() => {
    const shared = settled.filter(b => (b.participants_list || []).includes(filterUser));
    const wins = shared.filter(b => b.result && b.result.includes("won") && b.creator_name !== filterUser).length;
    const losses = shared.length - wins;
    return { wins, losses, bets: shared.length };
  })() : null;

  // Monthly chart from real data
  const monthlyData = (() => {
    const map = {};
    allBets.forEach(b => {
      if (!b.created_at) return;
      const d = new Date(b.created_at);
      const key = d.toLocaleString("default", { month: "short" });
      map[key] = (map[key] || 0) + b.amount;
    });
    const months = Object.keys(map).slice(-6);
    const amounts = months.map(m => map[m]);
    return { months, amounts };
  })();
  const max = Math.max(...(monthlyData.amounts.length ? monthlyData.amounts : [1]));

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>History</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Your betting record</div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading...</div>}

      {/* Opponent filter pills */}
      {opponents.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>FILTER BY OPPONENT</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setFilterUser(null)}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${!filterUser ? C.green : C.border}`, background: !filterUser ? C.green+"15" : "transparent", color: !filterUser ? C.green : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              All
            </button>
            {opponents.map(u => {
              const isSelected = filterUser === u;
              return (
                <button key={u} onClick={() => setFilterUser(isSelected ? null : u)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${isSelected ? C.blue : C.border}`, background: isSelected ? C.blue+"15" : "transparent", color: isSelected ? C.blue : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  @{u}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* H2H card */}
      {h2h && (
        <div style={{ background: C.card, border: `1px solid ${C.blue}22`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.blue, letterSpacing: 1, marginBottom: 10 }}>HEAD TO HEAD vs @{filterUser}</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              [h2h.wins+"-"+h2h.losses, "Record", h2h.wins > h2h.losses ? C.green : h2h.wins < h2h.losses ? C.red : C.muted],
              [h2h.bets, "Bets", C.text],
            ].map(([v,l,c]) => (
              <div key={l} style={{ flex: 1, textAlign: "center", background: "#0d0f14", borderRadius: 10, padding: "10px 8px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly chart */}
      {!filterUser && monthlyData.months.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 16 }}>$ WAGERED — MONTHLY</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
            {monthlyData.months.map((m, i) => (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${(monthlyData.amounts[i]/max)*70}px`, background: i===monthlyData.months.length-1 ? `linear-gradient(180deg,${C.green},${C.green}88)` : `linear-gradient(180deg,${C.blue}88,${C.blue}44)` }} />
                <div style={{ fontSize: 8, color: C.muted }}>{m}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            {[[settled.length + " bets","Settled",C.blue],[allBets.filter(b=>b.status!=="settled").length+" bets","Active",C.green]].map(([v,l,c]) => (
              <div key={l} style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 9, color: C.muted }}>{l}</div></div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>
        {filterUser ? `BETS WITH @${filterUser.toUpperCase()} (${filtered.length})` : `ALL SETTLED BETS (${filtered.length})`}
      </div>
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          {filterUser ? `No settled bets with @${filterUser} yet` : "No settled bets yet"}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(bet => <BetCard key={bet.id} bet={{
          ...bet,
          participants: Array(bet.participant_count || 1).fill(""),
          myPick: bet.my_pick,
          endTime: bet.end_time,
          startTime: bet.start_time,
          isPublic: bet.is_public,
        }} />)}
      </div>
    </div>
  );
}

const ANIMALS = [
  { id: "bear", emoji: "🐻", color: "#c8956c", name: "Bear" },
  { id: "fox", emoji: "🦊", color: "#f97316", name: "Fox" },
  { id: "wolf", emoji: "🐺", color: "#94a3b8", name: "Wolf" },
  { id: "lion", emoji: "🦁", color: "#ffd166", name: "Lion" },
  { id: "tiger", emoji: "🐯", color: "#ff8c42", name: "Tiger" },
  { id: "shark", emoji: "🦈", color: "#4cc9f0", name: "Shark" },
  { id: "eagle", emoji: "🦅", color: "#a78bfa", name: "Eagle" },
  { id: "snake", emoji: "🐍", color: "#00e676", name: "Snake" },
  { id: "bull", emoji: "🐂", color: "#ef4444", name: "Bull" },
  { id: "owl", emoji: "🦉", color: "#8b5cf6", name: "Owl" },
  { id: "croc", emoji: "🐊", color: "#22c55e", name: "Croc" },
  { id: "gorilla", emoji: "🦍", color: "#6b7280", name: "Gorilla" },
];

function getAnimal(animalId) {
  return ANIMALS.find(a => a.id === animalId) || ANIMALS[0];
}

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
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "", animalId: "bear", avatarColor: C.green });
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
      const res = await fetch(API + "/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.username, email: form.email, password: form.password, avatarColor: form.avatarColor, animalId: form.animalId || "bear" }) });
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Avatar name={form.username || "?"} size={80} animalId={form.animalId || "bear"} />
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>@{form.username}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{getAnimal(form.animalId || "bear").name}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>PICK YOUR ANIMAL</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {ANIMALS.map(a => (
                <div key={a.id} onClick={() => set("animalId", a.id)}
                  style={{ width: 52, height: 52, borderRadius: 14, background: (form.animalId||"bear") === a.id ? a.color+"28" : C.card, border: `2px solid ${(form.animalId||"bear") === a.id ? a.color : C.border}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, transition: "all 0.15s", boxShadow: (form.animalId||"bear") === a.id ? `0 0 12px ${a.color}44` : "none" }}>
                  <span style={{ fontSize: 22 }}>{a.emoji}</span>
                  <span style={{ fontSize: 7, color: C.muted, fontWeight: 700 }}>{a.name.toUpperCase()}</span>
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


function ResolveModal({ bet, onClose }) {
  const pot = bet.amount * bet.participants.length;
  const [mode, setMode] = useState("equal"); // equal | custom
  const [winners, setWinners] = useState([]);
  const [customAmounts, setCustomAmounts] = useState(
    Object.fromEntries(bet.participants.map(p => [p, 0]))
  );
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const toggleWinner = (p) => setWinners(w => w.includes(p) ? w.filter(x => x !== p) : [...w, p]);

  const equalPayout = winners.length > 0 ? Math.round(pot / winners.length) : 0;
  const customTotal = Object.values(customAmounts).reduce((s, v) => s + Number(v), 0);
  const customValid = customTotal === pot;

  const handleResolve = () => {
    if (mode === "equal" && winners.length === 0) return;
    if (mode === "custom" && !customValid) return;
    setDone(true);
    setTimeout(onClose, 1800);
  };

  if (done) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>Bet Settled!</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Results saved</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxWidth: 390, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>RESOLVE BET</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>{bet.title}</div>
        <div style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 20 }}>💰 Total pot: ${pot}</div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["equal","⚖️ Split Equally"],["custom","✏️ Custom Amounts"]].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 12, border: `1.5px solid ${mode === m ? C.green : C.border}`, background: mode === m ? C.green+"15" : "transparent", color: mode === m ? C.green : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {label}
            </button>
          ))}
        </div>

        {mode === "equal" && (
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>SELECT WINNER(S)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {bet.participants.map(p => {
                const isW = winners.includes(p);
                const net = isW ? equalPayout - bet.amount : -bet.amount;
                return (
                  <div key={p} onClick={() => toggleWinner(p)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${isW ? C.green : C.border}`, background: isW ? C.green+"10" : C.bg, cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${isW ? C.green : C.border}`, background: isW ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{isW ? "✓" : ""}</div>
                      <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>@{p}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: net >= 0 ? C.green : C.red }}>{net >= 0 ? "+" : ""}${net}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>net</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {winners.length > 0 && (
              <div style={{ padding: "12px 14px", background: C.green+"10", border: `1px solid ${C.green}20`, borderRadius: 12, marginBottom: 16, fontSize: 12, color: C.green }}>
                {winners.length} winner{winners.length > 1 ? "s" : ""} · ${equalPayout} each (${equalPayout - bet.amount} net)
              </div>
            )}
          </div>
        )}

        {mode === "custom" && (
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>SET PAYOUT PER PERSON <span style={{ color: customValid ? C.green : C.gold }}>(Total must = ${pot})</span></div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Enter gross payout (0 = lost their ${bet.amount})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {bet.participants.map(p => {
                const val = Number(customAmounts[p]);
                const net = val - bet.amount;
                return (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
                    <span style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 600 }}>@{p}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, color: C.muted }}>$</span>
                      <input type="number" min="0" value={customAmounts[p]}
                        onChange={e => setCustomAmounts(a => ({ ...a, [p]: e.target.value }))}
                        style={{ width: 72, padding: "6px 8px", borderRadius: 8, background: "#0a0c12", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", textAlign: "right" }} />
                    </div>
                    <div style={{ width: 52, textAlign: "right", fontSize: 12, fontWeight: 700, color: net > 0 ? C.green : net < 0 ? C.red : C.muted }}>
                      {net > 0 ? "+" : ""}{net !== 0 ? `$${net}` : "–"}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: customValid ? C.green+"10" : C.gold+"10", border: `1px solid ${customValid ? C.green : C.gold}30`, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Total allocated</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: customValid ? C.green : C.gold }}>${customTotal} / ${pot}</span>
            </div>
          </div>
        )}

        <input placeholder="Optional note (e.g. 'mikeb and lizz tied')" value={note} onChange={e => setNote(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0a0c12", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 16, boxSizing: "border-box" }} />

        <button onClick={handleResolve}
          disabled={(mode === "equal" && winners.length === 0) || (mode === "custom" && !customValid)}
          style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: "pointer", background: (mode === "equal" && winners.length === 0) || (mode === "custom" && !customValid) ? C.border : `linear-gradient(135deg,${C.green},#00b050)`, color: (mode === "equal" && winners.length === 0) || (mode === "custom" && !customValid) ? C.muted : "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>
          🏆 Settle Bet
        </button>
      </div>
    </div>
  );
}

export default function FriendlyBets() {
  const [authScreen, setAuthScreen] = useState("splash");
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [showCreate, setShowCreate] = useState(false);
  const [resolveBet, setResolveBet] = useState(null);
  const [booting, setBooting] = useState(true);

  // Auto-login if token exists
  useEffect(() => {
    const token = localStorage.getItem("fb_token");
    if (!token) { setBooting(false); return; }
    apiFetch("/me").then(user => {
      setCurrentUser({ ...user, avatarColor: user.avatar_color });
      setAuthScreen(null);
      setBooting(false);
    }).catch(() => {
      localStorage.removeItem("fb_token");
      setBooting(false);
    });
  }, []);

  const handleLogin = (user) => { setCurrentUser(user); setAuthScreen(null); };
  const handleLogout = () => { localStorage.removeItem("fb_token"); setCurrentUser(null); setAuthScreen("splash"); setScreen("home"); };

  if (booting) return (
    <div style={{ maxWidth: 390, margin: "0 auto", minHeight: "100vh", background: "#0d0f14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
        <div style={{ fontSize: 14, color: "#4a5068" }}>Loading...</div>
      </div>
    </div>
  );

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
            {screen === "home" && <HomeScreen user={currentUser} onLogout={handleLogout} onResolve={setResolveBet} />}
            {screen === "live" && <LiveScreen />}
            {screen === "invites" && <InvitesScreen />}
            {screen === "history" && <HistoryScreen />}
          </div>
          {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); setScreen("home"); }} />}
          {resolveBet && <ResolveModal bet={resolveBet} onClose={() => setResolveBet(null)} />}
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
