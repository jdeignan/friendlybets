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

// Global toast: any component can call toastError(e) or toastSuccess(message) and it'll show here for 3s.
function ErrorToast() {
  const [toast, setToast] = useState(null); // { msg, type }
  useEffect(() => {
    window.__fbToast = (msg, type) => setToast({ msg, type: type || "error" });
    return () => { delete window.__fbToast; };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const color = toast.type === "success" ? C.green : C.red;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 3000, display: "flex", justifyContent: "center", padding: "12px 16px", pointerEvents: "none" }}>
      <div style={{ background: color+"e6", color: toast.type === "success" ? "#000" : "#fff", fontSize: 12, fontWeight: 700, padding: "10px 18px", borderRadius: 12, maxWidth: 480, textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", pointerEvents: "auto" }}>
        {toast.msg}
      </div>
    </div>
  );
}
function toastError(e) {
  const m = (e && e.message) ? e.message : "Something went wrong";
  if (window.__fbToast) window.__fbToast(m, "error");
}
function toastSuccess(m) {
  if (window.__fbToast) window.__fbToast(m, "success");
}

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

function venmoLinks(toUsername, amount, note) {
  return {
    app: `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(toUsername)}&amount=${amount}&note=${encodeURIComponent(note)}`,
    web: `https://venmo.com/${encodeURIComponent(toUsername)}`,
  };
}

function VenmoButton({ toUsername, amount, note }) {
  const { app, web } = venmoLinks(toUsername, amount, note);
  const handleClick = (e) => {
    e.stopPropagation();
    // Try the native app deep link first; fall back to the web profile if it doesn't take
    // (desktop browsers, or Venmo not installed) after a short delay.
    const fallback = setTimeout(() => { window.open(web, "_blank"); }, 800);
    window.addEventListener("blur", () => clearTimeout(fallback), { once: true });
    window.location.href = app;
  };
  return (
    <button onClick={handleClick}
      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #3d95ce55", background: "#3d95ce18", color: "#3d95ce", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
      💸 Pay @{toUsername}
    </button>
  );
}

// Compact "you owe $X" banner shown on settled bet cards.
function VenmoRow({ bet, currentUser }) {
  const payouts = bet.payouts;
  if (!currentUser || !Array.isArray(payouts) || payouts.length === 0) return null;
  const mine = payouts.find(p => String(p.user_id) === String(currentUser.id));
  if (!mine || mine.net >= 0) return null;
  if (!bet.creator_name || bet.creator_name === currentUser.username) return null;
  const amount = Math.abs(mine.net);
  return (
    <div style={{ marginTop: 10, padding: "10px 12px", background: "#3d95ce10", borderRadius: 10, border: "1px solid #3d95ce30", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, color: "#3d95ce", fontWeight: 700 }}>You owe ${amount}</span>
      <VenmoButton toUsername={bet.creator_name} amount={amount} note={`FriendlyBets: ${bet.title}`} />
    </div>
  );
}

function Modal({ bet, onClose, onResolve, onDeleted, currentUser }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [update, setUpdate] = useState("");
  const parseUpdates = (u) => {
    if (!u) return [];
    if (Array.isArray(u)) return u;
    try { return JSON.parse(u); } catch { return []; }
  };
  const [updates, setUpdates] = useState(parseUpdates(bet.updates));
  const [postingUpdate, setPostingUpdate] = useState(false);
  const isCreator = currentUser && (String(bet.creator_id) === String(currentUser.id) || (bet.creator_name && bet.creator_name === currentUser.username));

  const formatDate = (t) => {
    if (!t) return "Not set";
    const d = new Date(t);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "Not set";
    return d.toLocaleString();
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await apiFetch(`/bets/${bet.id}`, { method: "DELETE" });
      onClose();
      if (onDeleted) { onDeleted(); } else { window.location.reload(); }
    } catch (e) {
      console.error("Delete failed:", e);
      toastError(e);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const postUpdate = async () => {
    if (!update.trim()) return;
    setPostingUpdate(true);
    const newUpdate = { text: update, author: currentUser?.username, time: new Date().toISOString() };
    const newUpdates = [...updates, newUpdate];
    try {
      await apiFetch(`/bets/${bet.id}/update`, { method: "POST", body: JSON.stringify({ update: update }) });
      setUpdates(newUpdates);
      setUpdate("");
    } catch (e) { toastError(e); }
    setPostingUpdate(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, maxWidth: 420, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>BET DETAILS</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 16 }}>{bet.title}</div>
        <div style={{ fontSize: 13, color: "#9aa0b8", lineHeight: 1.7, marginBottom: 20 }}>{bet.description || "No description"}</div>

        {/* Dates */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[["STARTS", bet.startTime], ["ENDS", bet.endTime]].map(([l, t]) => (
            <div key={l} style={{ flex: 1, background: "#0d0f14", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 11, color: C.text }}>{formatDate(t)}</div>
            </div>
          ))}
        </div>

        {/* Participants */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>PARTICIPANTS ({bet.participants_list?.length || bet.participants.length})</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(bet.participants_list || bet.participants).map(p => (
              <span key={p} style={{ fontSize: 11, color: C.text, background: "#1e2330", padding: "4px 10px", borderRadius: 20 }}>@{p}</span>
            ))}
          </div>
        </div>

        {/* Settlement breakdown + Venmo pay links */}
        {bet.status === "settled" && Array.isArray(bet.payouts) && bet.payouts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>💰 SETTLEMENT</div>
            {bet.payouts.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0f14", borderRadius: 10, padding: "10px 14px", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: C.text }}>@{p.username}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: p.net >= 0 ? C.green : C.red }}>{p.net >= 0 ? "+" : ""}${p.net}</span>
                  {p.net < 0 && bet.creator_name && p.username !== bet.creator_name && (
                    <VenmoButton toUsername={bet.creator_name} amount={Math.abs(p.net)} note={`FriendlyBets: ${bet.title}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guesses for guess bets */}
        {(bet.category === "guess" || bet.bet_type === "guess") && bet.guesses_list && bet.guesses_list.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>🫙 ALL GUESSES</div>
            {bet.guesses_list.map((g, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0f14", borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.text }}>@{g.username}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.blue }}>{g.guess}</span>
              </div>
            ))}
            {bet.guess_answer && (
              <div style={{ padding: "10px 14px", background: C.green+"10", border: `1px solid ${C.green}30`, borderRadius: 10, marginTop: 8 }}>
                <div style={{ fontSize: 10, color: C.green, marginBottom: 2 }}>ANSWER</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{bet.guess_answer}</div>
              </div>
            )}
          </div>
        )}

        {/* Weight picks */}
        {(bet.category === "weight" || bet.bet_type === "weight") && bet.guesses_list && bet.guesses_list.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>⚖️ STARTING WEIGHTS</div>
            {bet.guesses_list.map((g, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0f14", borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.text }}>@{g.username}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{g.start_value} lbs</span>
              </div>
            ))}
          </div>
        )}

        {/* Factual picks */}
        {bet.category === "factual" && bet.guesses_list && bet.guesses_list.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>🏈 PICKS</div>
            {bet.guesses_list.map((g, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0f14", borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.text }}>@{g.username}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{g.pick || "No pick"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress updates for admin bets */}
        {(bet.category === "admin" || bet.bet_type === "admin") && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>📊 PROGRESS UPDATES</div>
            {updates.length === 0 && <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>No updates yet</div>}
            {updates.map((u, i) => (
              <div key={i} style={{ background: "#0d0f14", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.text, marginBottom: 4 }}>{u.text}</div>
                <div style={{ fontSize: 9, color: C.muted }}>@{u.author} · {new Date(u.time).toLocaleDateString()}</div>
              </div>
            ))}
            {isCreator && bet.status !== "settled" && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input value={update} onChange={e => setUpdate(e.target.value)} placeholder="Post an update..."
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                <button onClick={postUpdate} disabled={postingUpdate || !update.trim()}
                  style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: C.blue+"20", color: C.blue, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  {postingUpdate ? "..." : "Post"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(bet.category === "admin" || bet.bet_type === "admin") && bet.status !== "settled" && isCreator && (
            <button onClick={() => { onClose(); onResolve && onResolve(bet); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, background: C.gold+"15", border: `1px solid ${C.gold}30`, color: C.gold, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              🏆 Settle
            </button>
          )}
          {isCreator && (
            <button onClick={handleDelete} disabled={deleting}
              style={{ flex: 1, padding: 12, borderRadius: 12, background: confirmDelete ? C.red+"25" : C.red+"10", border: `1px solid ${C.red}30`, color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "🗑 Delete"}
            </button>
          )}
          <button onClick={onClose}
            style={{ flex: 1, padding: 12, borderRadius: 12, background: C.green+"15", border: `1px solid ${C.green}30`, color: C.green, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Close
          </button>
        </div>
        {confirmDelete && <div style={{ fontSize: 11, color: C.red, textAlign: "center", marginTop: 8 }}>Tap again to confirm — this cannot be undone</div>}
      </div>
    </div>
  );
}

function InviteExistingModal({ bet, onClose, onInvited }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [invitees, setInvitees] = useState([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const searchUsers = async (q) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    try {
      const res = await apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.filter(u => !invitees.find(i => i.id === u.id)));
    } catch (e) { toastError(e); }
  };

  const addInvitee = (u) => { setInvitees(i => [...i, u]); setResults([]); setSearch(""); };
  const removeInvitee = (id) => setInvitees(i => i.filter(u => u.id !== id));

  const sendInvites = async () => {
    if (invitees.length === 0) return;
    setSending(true);
    try {
      await apiFetch(`/bets/${bet.id}/invite`, { method: "POST", body: JSON.stringify({ userIds: invitees.map(u => u.id) }) });
      setDone(true);
      setTimeout(() => { onInvited && onInvited(); onClose(); }, 1000);
    } catch (e) { toastError(e); setSending(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>INVITE TO BET</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 16 }}>{bet.title}</div>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✉️</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>Invites sent!</div>
          </div>
        ) : (
          <>
            <input placeholder="Search by username..." value={search} onChange={e => searchUsers(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            {results.length > 0 && (
              <div style={{ background: "#0a0c12", border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, overflow: "hidden" }}>
                {results.map(u => (
                  <div key={u.id} onClick={() => addInvitee(u)}
                    style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
                    <Avatar name={u.username} size={28} color={C.blue} animalId={u.animal_id} />
                    <span style={{ fontSize: 13, color: C.text }}>@{u.username}</span>
                  </div>
                ))}
              </div>
            )}
            {invitees.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                {invitees.map(u => (
                  <span key={u.id} onClick={() => removeInvitee(u.id)}
                    style={{ fontSize: 11, color: C.green, background: C.green+"15", border: `1px solid ${C.green}30`, padding: "4px 10px", borderRadius: 20, cursor: "pointer" }}>
                    @{u.username} ✕
                  </span>
                ))}
              </div>
            )}
            <button onClick={sendInvites} disabled={invitees.length === 0 || sending}
              style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 12, border: "none", cursor: invitees.length === 0 || sending ? "not-allowed" : "pointer", background: invitees.length === 0 || sending ? C.border : `linear-gradient(135deg,${C.green},#00b050)`, color: invitees.length === 0 || sending ? C.muted : "#000", fontWeight: 800, fontSize: 14, fontFamily: "inherit" }}>
              {sending ? "Sending..." : `Send ${invitees.length || ""} Invite${invitees.length === 1 ? "" : "s"}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BetCard({ bet, onResolve, onDeleted, currentUser }) {
  const [show, setShow] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const isCreator = currentUser && (String(bet.creator_id) === String(currentUser.id) || (bet.creator_name && bet.creator_name === currentUser.username));
  const pot = bet.amount * bet.participants.length;
  const diff = new Date(bet.endTime) - new Date();
  const timeLeft = diff < 0 ? "Ended" : diff < 3600000 ? `${Math.floor(diff/60000)}m left` : diff < 86400000 ? `${Math.floor(diff/3600000)}h left` : `${Math.floor(diff/86400000)}d left`;
  return (
    <>
      {show && <Modal bet={bet} onClose={() => setShow(false)} onResolve={onResolve} onDeleted={onDeleted} currentUser={currentUser} />}
      {showInvite && <InviteExistingModal bet={bet} onClose={() => setShowInvite(false)} onInvited={onDeleted} />}
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
              <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{(bet.description||"").slice(0, 60)}{(bet.description||"").length > 60 ? "..." : ""}</div>
              <button onClick={e => { e.stopPropagation(); setShow(true); }} style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "#1e2330", border: `1px solid ${C.border}`, color: C.blue, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "inherit" }}>i</button>
              {isCreator && bet.status === "active" && (
                <>
                  <button onClick={e => { e.stopPropagation(); setShowInvite(true); }} style={{ flexShrink: 0, height: 20, padding: "0 8px", borderRadius: 10, background: "#1e2330", border: `1px solid ${C.border}`, color: C.green, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+ Invite</button>
                  <button onClick={e => {
                    e.stopPropagation();
                    const link = `https://betwithfriends.netlify.app/join/${bet.id}`;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(link).then(() => toastSuccess("Invite link copied!")).catch(() => toastError({ message: "Couldn't copy link" }));
                    } else {
                      toastError({ message: "Clipboard not available" });
                    }
                  }} style={{ flexShrink: 0, height: 20, padding: "0 8px", borderRadius: 10, background: "#1e2330", border: `1px solid ${C.border}`, color: C.blue, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>🔗 Copy Link</button>
                </>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>${pot}</div>
            <div style={{ fontSize: 9, color: C.muted }}>POT</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 16 }}>
            {[["MY PICK", getMyPickDisplay(bet), C.blue], ["PLAYERS", bet.participants.length, C.text], ["WAGER", "$"+bet.amount, C.text]].map(([l,v,c]) => (
              <div key={l}><div style={{ fontSize: 9, color: C.muted }}>{l}</div><div style={{ fontSize: 12, fontWeight: 600, color: c }}>{v}</div></div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: bet.status === "settled" ? C.muted : C.gold }}>{timeLeft}</div>
        </div>
        {bet.result && <div style={{ marginTop: 10, padding: "8px 12px", background: C.gold+"10", borderRadius: 8, border: `1px solid ${C.gold}20`, fontSize: 11, color: C.gold }}>🏆 {bet.result}</div>}
        {bet.status === "settled" && <VenmoRow bet={bet} currentUser={currentUser} />}
      </div>
    </>
  );
}

function CreateModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", category: "", isPublic: true, amount: "", endDate: "", odds_home: "", odds_away: "", home_team: "", away_team: "", my_pick: "", bet_type: "", my_guess: "", my_start_value: "", weight_unit: "pct", start_time: "" });
  const [inviteSearch, setInviteSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [invitees, setInvitees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const searchGames = async (query) => {
    setGameSearch(query);
    if (query.length < 2) { setGames([]); return; }
    setLoadingGames(true);
    try {
      const results = await apiFetch(`/odds/search?q=${encodeURIComponent(query)}`);
      setGames((results || []).slice(0, 8));
    } catch (e) { toastError(e); setGames([]); }
    setLoadingGames(false);
  };

  const selectGame = (game, type) => {
    const isSpread = type === "spread";
    const oddsH = isSpread ? (game.spread_home || game.ml_home) : game.ml_home;
    const oddsA = isSpread ? (game.spread_away || game.ml_away) : game.ml_away;
    const title = isSpread
      ? `${game.away} @ ${game.home} — Spread`
      : `${game.away} @ ${game.home} — Moneyline`;
    const desc = isSpread
      ? `Spread bet: ${game.home} ${game.spread_home || "N/A"} / ${game.away} ${game.spread_away || "N/A"}. Resolves at final score.`
      : `Moneyline: ${game.home} ${game.ml_home || "N/A"} / ${game.away} ${game.ml_away || "N/A"}. Resolves at final score.`;
    setForm(f => ({ ...f, title, description: desc, home_team: game.home, away_team: game.away, odds_home: oddsH, odds_away: oddsA, start_time: game.commence || "" }));
    setSelectedGame(game);
    setGames([]);
    setGameSearch("");
  };

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
      const bet = await apiFetch("/bets", { method: "POST", body: JSON.stringify({
        title: form.title,
        description: form.description,
        category: form.category,
        amount: Number(form.amount),
        endTime: form.endDate || null,
        startTime: form.start_time || null,
        isPublic: form.isPublic,
        myPick: form.my_pick || null,
        oddsHome: form.odds_home || null,
        oddsAway: form.odds_away || null,
        homeTeam: form.home_team || null,
        awayTeam: form.away_team || null,
        betType: form.bet_type || null,
        myGuess: form.my_guess || null,
        myStartValue: form.my_start_value || null,
        weightUnit: form.category === "weight" ? (form.weight_unit || "pct") : null,
      }) });
      if (invitees.length > 0) {
        await apiFetch(`/bets/${bet.id}/invite`, { method: "POST", body: JSON.stringify({ userIds: invitees.map(u => u.id) }) });
      }
      setDone(true);
      setTimeout(() => { onCreated && onCreated(); onClose(); }, 1200);
    } catch(e) {
      console.error("Create failed:", e);
      toastError(e);
      setSaving(false);
    }
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
            {[
              ["factual","⚡","Sports / Factual","Game spread, moneyline — outcome is automatic"],
              ["guess","🫙","Closest Guess Wins","Jelly beans, price is right, any number guess"],
              ["weight","⚖️","Weight Loss Challenge","Track % or lbs lost — winner auto-calculated"],
              ["admin","👑","Admin Decides","Golf, custom challenges — you pick the winner"],
            ].map(([k,icon,label,desc]) => (
              <div key={k} onClick={() => { set("category", k); set("bet_type", k); setStep(2); }} style={{ padding: "16px 18px", borderRadius: 14, cursor: "pointer", background: form.category===k ? C.green+"10" : "#0d0f14", border: `1.5px solid ${form.category===k ? C.green : C.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{icon} {label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{desc}</div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Bet Details</div>

            {/* Game search for factual bets */}
            {form.category === "factual" && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>🔍 SEARCH LIVE GAMES (optional)</div>
                <input placeholder="Search team name e.g. Lakers, Chiefs..." value={gameSearch}
                  onChange={e => searchGames(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.blue}44`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                {loadingGames && <div style={{ fontSize: 11, color: C.muted, padding: "8px 0" }}>Fetching live odds...</div>}
                {games.length > 0 && (
                  <div style={{ background: "#0a0c12", border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, overflow: "hidden" }}>
                    {games.map(game => (
                      <div key={game.id} style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{game.away} @ {game.home}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{new Date(game.commence).toLocaleDateString()} {new Date(game.commence).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {game.spread_home && (
                            <button onClick={() => selectGame(game, "spread")}
                              style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.blue}44`, background: C.blue+"10", color: C.blue, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                              📊 Spread {game.spread_home}/{game.spread_away}
                            </button>
                          )}
                          {game.ml_home && (
                            <button onClick={() => selectGame(game, "ml")}
                              style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.purple}44`, background: C.purple+"10", color: C.purple, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                              💰 ML {game.ml_home}/{game.ml_away}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedGame && (
                  <div style={{ display: "flex", gap: 6, marginTop: 4, padding: "8px 12px", background: C.green+"10", border: `1px solid ${C.green}30`, borderRadius: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.green, flex: 1 }}>✓ {selectedGame.away} @ {selectedGame.home}</span>
                    <button onClick={() => { setSelectedGame(null); set("title",""); set("description",""); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                  </div>
                )}
              </div>
            )}

            <input placeholder="Bet title" value={form.title} onChange={e => set("title", e.target.value)} style={{ padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
            <textarea placeholder="Description — terms, rules, how it resolves..." value={form.description} onChange={e => set("description", e.target.value)} rows={3} style={{ padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none" }} />

            {/* Show selected odds + pick your side */}
            {form.odds_home && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PICK YOUR SIDE</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[[form.home_team, form.odds_home, C.blue],[form.away_team, form.odds_away, C.purple]].map(([team,odds,c]) => {
                    const pickLabel = `${team} ${odds}`;
                    const isSelected = form.my_pick === pickLabel;
                    return (
                      <button key={team} onClick={() => set("my_pick", isSelected ? "" : pickLabel)}
                        style={{ flex: 1, background: isSelected ? c+"20" : "#0d0f14", border: `2px solid ${isSelected ? c : C.border}`, borderRadius: 12, padding: "12px 8px", textAlign: "center", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                        <div style={{ fontSize: 10, color: isSelected ? c : C.muted, marginBottom: 4 }}>{team}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: isSelected ? c : C.text }}>{odds}</div>
                        {isSelected && <div style={{ fontSize: 9, color: c, marginTop: 4 }}>✓ MY PICK</div>}
                      </button>
                    );
                  })}
                </div>
                {!form.my_pick && <div style={{ fontSize: 10, color: C.gold, marginTop: 6 }}>Tap a side to lock in your pick</div>}
              </div>
            )}

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
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Wager & Invite</div>

            {/* Wager */}
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>WAGER PER PERSON ($)</div>
              <input type="number" placeholder="25" value={form.amount} onChange={e => set("amount", e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* End date — only for admin/weight/guess bets, not factual */}
            {form.category !== "factual" && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>END DATE & TIME</div>
                <input type="datetime-local" value={form.endDate} onChange={e => set("endDate", e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Leave blank if no end date</div>
              </div>
            )}

            {/* Guess bet — enter your guess */}
            {form.category === "guess" && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>YOUR GUESS</div>
                <input type="number" placeholder="e.g. 847" value={form.my_guess} onChange={e => set("my_guess", e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.blue}44`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Closest guess to the real answer wins</div>
              </div>
            )}

            {/* Weight loss — starting weight */}
            {form.category === "weight" && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>YOUR STARTING WEIGHT</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" placeholder="e.g. 185" value={form.my_start_value} onChange={e => set("my_start_value", e.target.value)}
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.gold}44`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none" }} />
                  <div style={{ display: "flex", gap: 4 }}>
                    {[["lbs","lbs"],["pct","%"]].map(([val,label]) => (
                      <button key={val} onClick={() => set("weight_unit", val)}
                        style={{ padding: "0 14px", borderRadius: 10, border: `1px solid ${form.weight_unit===val ? C.gold : C.border}`, background: form.weight_unit===val ? C.gold+"15" : "#0d0f14", color: form.weight_unit===val ? C.gold : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Winner = most {form.weight_unit === "lbs" ? "lbs lost" : "% body weight lost"} by end date</div>
              </div>
            )}

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

function getMyPickDisplay(bet) {
  const mine = (bet.guesses_list || []).find(g => g.username === bet.my_username);
  const cat = bet.bet_type || bet.category;
  if (cat === "guess") return mine?.guess != null ? String(mine.guess) : "—";
  if (cat === "weight") return mine?.start_value != null ? `${mine.start_value}${bet.weight_unit === "lbs" ? " lbs" : "%"}` : "—";
  return bet.my_pick || mine?.pick || "—";
}

function HomeScreen({ user, onLogout, onResolve, refreshSignal, onOpenAdmin }) {
  const { data: bets, loading, reload } = useApi("/bets", [refreshSignal]);
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
          {user?.is_admin && (
            <button onClick={onOpenAdmin} style={{ background: C.gold + "18", border: `1px solid ${C.gold}40`, borderRadius: 8, color: C.gold, fontSize: 10, fontWeight: 700, padding: "4px 8px", cursor: "pointer", fontFamily: "inherit" }}>⚙ Admin</button>
          )}
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
        }} onResolve={(b) => { onResolve(b); }} onDeleted={reload} currentUser={user} />)}
      </div>
    </div>
  );
}

function InviteCard({ inv, onResponded }) {
  const [pick, setPick] = useState("");
  const [guess, setGuess] = useState("");
  const [startValue, setStartValue] = useState("");
  const [accepting, setAccepting] = useState(false);

  // Determine the opposite side for factual bets
  const getOpposingSide = () => {
    if (!inv.odds_home || !inv.creator_pick) return null;
    const creatorPick = inv.creator_pick;
    const homeLabel = `${inv.home_team} ${inv.odds_home}`;
    const awayLabel = `${inv.away_team} ${inv.odds_away}`;
    if (creatorPick === homeLabel) return awayLabel;
    if (creatorPick === awayLabel) return homeLabel;
    return null;
  };

  const opposingSide = getOpposingSide();
  const betCat = inv.bet_type || inv.category || "";
  const isFactual = betCat === "factual";
  const isGuess = betCat === "guess";
  const isWeight = betCat === "weight";

  const canAccept = () => {
    if (isFactual && inv.odds_home && inv.home_team) return !!pick;
    if (isGuess) return !!guess;
    if (isWeight) return !!startValue;
    return true;
  };

  const handleAccept = async () => {
    if (!canAccept()) return;
    setAccepting(true);
    try {
      await apiFetch(`/invites/${inv.id}/accept`, { 
        method: "POST", 
        body: JSON.stringify({ pick: pick || null, guess: guess || null, startValue: startValue || null }) 
      });
      onResponded();
    } catch (e) { toastError(e); setAccepting(false); }
  };

  const handleDecline = async () => {
    try {
      await apiFetch(`/invites/${inv.id}/decline`, { method: "POST" });
      onResponded();
    } catch (e) { toastError(e); }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{inv.title}</div>
          <div style={{ fontSize: 11, color: C.muted }}>from <span style={{ color: C.blue }}>@{inv.from_username}</span> · {inv.participant_count} joined</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>${inv.amount}</div>
          <div style={{ fontSize: 9, color: C.muted }}>WAGER</div>
        </div>
      </div>

      {inv.end_time && <div style={{ fontSize: 10, color: C.gold, marginBottom: 10 }}>Ends {new Date(inv.end_time).toLocaleDateString()}</div>}

      {/* FACTUAL — pick your side */}
      {isFactual && inv.odds_home && (
        <div style={{ marginBottom: 12 }}>
          {inv.creator_pick && (
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
              @{inv.from_username} took <span style={{ color: C.blue, fontWeight: 700 }}>{inv.creator_pick}</span>
            </div>
          )}
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PICK YOUR SIDE TO ACCEPT</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[[inv.home_team, inv.odds_home, C.blue],[inv.away_team, inv.odds_away, C.purple]].map(([team, odds, c]) => {
              const label = `${team} ${odds}`;
              const isSelected = pick === label;
              const takenByCreator = inv.creator_pick === label;
              return (
                <button key={team} onClick={() => !takenByCreator && setPick(isSelected ? "" : label)}
                  style={{ flex: 1, background: isSelected ? c+"20" : takenByCreator ? "#0d0f14" : "#0d0f14", border: `2px solid ${isSelected ? c : takenByCreator ? C.red+"44" : C.border}`, borderRadius: 12, padding: "12px 8px", textAlign: "center", cursor: takenByCreator ? "default" : "pointer", fontFamily: "inherit" }}>
                  <div style={{ fontSize: 10, color: isSelected ? c : takenByCreator ? C.red : C.muted, marginBottom: 4 }}>{team}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: isSelected ? c : C.text }}>{odds}</div>
                  {takenByCreator && <div style={{ fontSize: 9, color: C.red, marginTop: 2 }}>TAKEN</div>}
                  {isSelected && <div style={{ fontSize: 9, color: c, marginTop: 2 }}>✓ MY PICK</div>}
                </button>
              );
            })}
          </div>
          {opposingSide && !pick && (
            <div style={{ fontSize: 10, color: C.gold, marginTop: 6 }}>
              You'll get: <span style={{ fontWeight: 700 }}>{opposingSide}</span>
            </div>
          )}
        </div>
      )}

      {/* GUESS — enter your number */}
      {isGuess && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>ENTER YOUR GUESS TO ACCEPT</div>
          <input type="number" placeholder="Your guess..." value={guess} onChange={e => setGuess(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.blue}44`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Closest guess wins the pot</div>
        </div>
      )}

      {/* WEIGHT — enter starting weight */}
      {isWeight && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>YOUR STARTING WEIGHT TO ACCEPT</div>
          <input type="number" placeholder="e.g. 185" value={startValue} onChange={e => setStartValue(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.gold}44`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Most weight lost (%) by end date wins</div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAccept} disabled={!canAccept() || accepting}
          style={{ flex: 1, padding: 10, borderRadius: 10, background: canAccept() ? C.green+"15" : "#1e2330", border: `1px solid ${canAccept() ? C.green+"30" : C.border}`, color: canAccept() ? C.green : C.muted, fontWeight: 700, fontSize: 12, cursor: canAccept() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
          {accepting ? "..." : "✓ Accept"}
        </button>
        <button onClick={handleDecline}
          style={{ flex: 1, padding: 10, borderRadius: 10, background: C.red+"10", border: `1px solid ${C.red}30`, color: C.red, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          ✕ Decline
        </button>
      </div>
    </div>
  );
}

function InvitesScreen() {
  const { data: invites, loading, reload } = useApi("/invites");
  const list = invites || [];

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {list.map(inv => <InviteCard key={inv.id} inv={inv} onResponded={reload} />)}
      </div>
    </div>
  );
}

function FriendsScreen() {
  const { data: friends, loading, reload } = useApi("/friends");
  const { data: requests, reload: reloadRequests } = useApi("/friends/requests");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [sending, setSending] = useState(false);

  const searchUsers = async (q) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    try {
      const res = await apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(res);
    } catch (e) { toastError(e); }
  };

  const sendRequest = async (username) => {
    setSending(true);
    try {
      await apiFetch("/friends/request", { method: "POST", body: JSON.stringify({ friendUsername: username }) });
      setSearch(""); setResults([]);
    } catch (e) { toastError(e); }
    setSending(false);
  };

  const respond = async (id, action) => {
    try {
      await apiFetch(`/friends/${id}/${action}`, { method: "POST" });
      reload(); reloadRequests();
    } catch (e) { toastError(e); }
  };

  const list = friends || [];
  const pending = requests || [];

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Friends</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>{list.length} friends</div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>ADD A FRIEND</div>
        <input placeholder="Search by username..." value={search} onChange={e => searchUsers(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        {results.length > 0 && (
          <div style={{ background: "#0a0c12", border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, overflow: "hidden" }}>
            {results.map(u => (
              <div key={u.id} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
                <Avatar name={u.username} size={28} animalId={u.animal_id} />
                <span style={{ flex: 1, fontSize: 13, color: C.text }}>@{u.username}</span>
                <button onClick={() => sendRequest(u.username)} disabled={sending}
                  style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.green}40`, background: C.green + "15", color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>PENDING REQUESTS ({pending.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map(r => (
              <div key={r.friendship_id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={r.username} size={32} animalId={r.animal_id} />
                <span style={{ flex: 1, fontSize: 13, color: C.text }}>@{r.username}</span>
                <button onClick={() => respond(r.friendship_id, "accept")} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.green}40`, background: C.green + "15", color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✓</button>
                <button onClick={() => respond(r.friendship_id, "decline")} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.red}40`, background: C.red + "10", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>YOUR FRIENDS</div>
      {loading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading...</div>}
      {!loading && list.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🤝</div>
          <div style={{ fontSize: 13 }}>No friends yet — add some above</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map(f => (
          <div key={f.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={f.username} size={32} animalId={f.animal_id} />
            <span style={{ fontSize: 13, color: C.text }}>@{f.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveScreen({ refreshSignal }) {
  const { data: bets, loading } = useApi("/bets", [refreshSignal]);
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



function HistoryScreen({ refreshSignal }) {
  const { data: bets, loading } = useApi("/bets", [refreshSignal]);
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
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
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 12 }}>
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

function LoginScreen({ onLogin, onSignup, onBack, onForgot }) {
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
      if (!res.ok) { setError(data.error || "Login failed"); toastError({ message: data.error || "Login failed" }); setLoading(false); return; }
      localStorage.setItem("fb_token", data.token);
      onLogin({ ...data.user, avatarColor: data.user.avatar_color });
    } catch { setError("Connection error - try again"); toastError({ message: "Connection error - try again" }); setLoading(false); }
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
        <div style={{ textAlign: "right" }}>
          <span onClick={onForgot} style={{ fontSize: 12, color: C.blue, cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
        </div>
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

function ForgotPasswordScreen({ onBack, onDone }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [displayedCode, setDisplayedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async () => {
    if (!email) { setError("Enter your email"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(API + "/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); toastError({ message: data.error || "Something went wrong" }); setLoading(false); return; }
      setDisplayedCode(data.code);
      setStep(2);
    } catch { setError("Connection error - try again"); toastError({ message: "Connection error - try again" }); }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!code || !newPassword) { setError("Enter the code and a new password"); return; }
    if (newPassword !== confirm) { setError("Passwords don't match"); return; }
    if (newPassword.length < 6) { setError("At least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(API + "/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, newPassword }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); toastError({ message: data.error || "Reset failed" }); setLoading(false); return; }
      setStep(3);
    } catch { setError("Connection error - try again"); toastError({ message: "Connection error - try again" }); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", alignSelf: "flex-start", padding: "4px 0", fontFamily: "inherit", marginBottom: 32 }}>←</button>

      {step === 1 && (
        <>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 6 }}>Reset password</div>
            <div style={{ fontSize: 13, color: C.muted }}>Enter your account email — we'll show you a reset code.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <Input label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@email.com" error={error} />
          </div>
          <button onClick={requestCode} disabled={loading}
            style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", background: loading ? C.border : `linear-gradient(135deg,${C.green},#00b050)`, color: loading ? C.muted : "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>
            {loading ? "Sending..." : "Get Reset Code"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 6 }}>Enter code</div>
            <div style={{ fontSize: 13, color: C.muted }}>We don't have email hooked up yet, so here's your code directly:</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: C.card, border: `1px solid ${C.green}40`, borderRadius: 14, marginBottom: 24 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.green, letterSpacing: 4 }}>{displayedCode}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>Expires in 15 minutes</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <Input label="RESET CODE" value={code} onChange={setCode} placeholder="6-digit code" />
            <Input label="NEW PASSWORD" type="password" value={newPassword} onChange={setNewPassword} placeholder="Min 6 characters" />
            <Input label="CONFIRM PASSWORD" type="password" value={confirm} onChange={setConfirm} placeholder="Same as above" error={error} />
          </div>
          <button onClick={resetPassword} disabled={loading}
            style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", background: loading ? C.border : `linear-gradient(135deg,${C.green},#00b050)`, color: loading ? C.muted : "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </>
      )}

      {step === 3 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.green, marginBottom: 8 }}>Password reset</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>You can sign in with your new password now.</div>
          <button onClick={onDone}
            style={{ width: "100%", maxWidth: 320, padding: 15, borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#00b050)`, color: "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>
            Back to Sign In
          </button>
        </div>
      )}
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
      if (!res.ok) { setErrors({ confirm: data.error || "Signup failed" }); toastError({ message: data.error || "Signup failed" }); setLoading(false); return; }
      localStorage.setItem("fb_token", data.token);
      onSignup({ ...data.user, avatarColor: data.user.avatar_color });
    } catch { setErrors({ confirm: "Connection error - try again" }); toastError({ message: "Connection error - try again" }); setLoading(false); }
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


function ResolveModal({ bet, onClose, onSettled }) {
  const participants = bet.participants_list || [];
  const guessesList = bet.guesses_list || [];
  const pot = bet.amount * (participants.length || 1);
  const betCategory = bet.bet_type || bet.category;
  const isGuess = betCategory === "guess";
  const isWeight = betCategory === "weight";
  const weightUnit = bet.weight_unit === "lbs" ? "lbs" : "pct";

  const [mode, setMode] = useState("equal"); // equal | custom — admin/factual manual override
  const [winners, setWinners] = useState([]);
  const [customAmounts, setCustomAmounts] = useState(
    Object.fromEntries(participants.map(p => [p, 0]))
  );
  const [guessAnswer, setGuessAnswer] = useState("");
  const [endValues, setEndValues] = useState(Object.fromEntries(participants.map(p => [p, ""])));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const toggleWinner = (p) => setWinners(w => w.includes(p) ? w.filter(x => x !== p) : [...w, p]);

  const equalPayout = winners.length > 0 ? Math.round(pot / winners.length) : 0;
  const customTotal = Object.values(customAmounts).reduce((s, v) => s + Number(v), 0);
  const customValid = customTotal === pot;

  const canSubmit = () => {
    if (isGuess) return guessAnswer !== "" && !isNaN(Number(guessAnswer));
    if (isWeight) return participants.length > 0 && participants.every(p => endValues[p] !== "" && !isNaN(Number(endValues[p])));
    return (mode === "equal" && winners.length > 0) || (mode === "custom" && customValid);
  };

  const handleResolve = async () => {
    if (!canSubmit() || saving) return;
    setSaving(true);
    try {
      const body = {};
      if (note) body.result = note;
      if (isGuess) {
        body.guessAnswer = guessAnswer;
      } else if (isWeight) {
        body.endValues = participants
          .map(username => {
            const p = guessesList.find(g => g.username === username);
            return p ? { userId: p.user_id, endValue: endValues[username] } : null;
          })
          .filter(Boolean);
      } else if (mode === "custom") {
        body.customAmounts = customAmounts;
      } else {
        body.winnerUsernames = winners;
      }
      await apiFetch(`/bets/${bet.id}/resolve`, { method: "POST", body: JSON.stringify(body) });
      setDone(true);
      setTimeout(() => { onSettled && onSettled(); onClose(); }, 1400);
    } catch (e) {
      toastError(e);
      setSaving(false);
    }
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
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>RESOLVE BET</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>{bet.title}</div>
        <div style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 20 }}>💰 Total pot: ${pot}</div>

        {isGuess && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>WHAT'S THE CORRECT ANSWER?</div>
            <input type="number" placeholder="e.g. 847" value={guessAnswer} onChange={e => setGuessAnswer(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0a0c12", border: `1px solid ${C.blue}44`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
            {guessesList.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {guessesList.map(g => (
                  <div key={g.username} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.text }}>@{g.username}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{g.guess ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>Closest guess wins the pot — ties split it.</div>
          </div>
        )}

        {isWeight && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>ENTER FINAL WEIGHTS ({weightUnit === "lbs" ? "most lbs lost wins" : "most % lost wins"})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {participants.map(p => {
                const g = guessesList.find(x => x.username === p);
                return (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
                    <span style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 600 }}>@{p} <span style={{ color: C.muted, fontWeight: 400 }}>· started {g?.start_value ?? "?"}</span></span>
                    <input type="number" placeholder="Ending weight" value={endValues[p] ?? ""}
                      onChange={e => setEndValues(v => ({ ...v, [p]: e.target.value }))}
                      style={{ width: 100, padding: "6px 10px", borderRadius: 8, background: "#0a0c12", border: `1px solid ${C.gold}44`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", textAlign: "right" }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isGuess && !isWeight && (
          <>
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
                  {participants.map(p => {
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
                  {participants.map(p => {
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
          </>
        )}

        <input placeholder="Optional note (e.g. 'mikeb and lizz tied')" value={note} onChange={e => setNote(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0a0c12", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 16, boxSizing: "border-box" }} />

        <button onClick={handleResolve}
          disabled={!canSubmit() || saving}
          style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: !canSubmit() || saving ? "not-allowed" : "pointer", background: !canSubmit() || saving ? C.border : `linear-gradient(135deg,${C.green},#00b050)`, color: !canSubmit() || saving ? C.muted : "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>
          {saving ? "Settling..." : "🏆 Settle Bet"}
        </button>
      </div>
    </div>
  );
}

function AdminStatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch("/admin/stats").then(s => { setStats(s); setLoading(false); }).catch(e => { toastError(e); setLoading(false); });
  }, []);
  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading...</div>;
  if (!stats) return null;
  const cards = [
    ["Total Users", stats.totalUsers, C.blue],
    ["Total Bets", stats.totalBets, C.purple],
    ["Active Bets", stats.activeBets, C.green],
    ["$ In Play", "$" + stats.totalInPlay, C.gold],
    ["Suspended", stats.suspendedUsers, C.red],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
      {cards.map(([label, value, color]) => (
        <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function AdminUserRow({ u, onChanged }) {
  const [resetPw, setResetPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const toggleSuspend = async () => {
    setBusy(true);
    try {
      await apiFetch(`/admin/users/${u.id}/${u.is_suspended ? "unsuspend" : "suspend"}`, { method: "POST" });
      onChanged();
    } catch (e) { toastError(e); setBusy(false); }
  };

  const doReset = async () => {
    if (!resetPw || resetPw.length < 6) { toastError({ message: "Password must be at least 6 characters" }); return; }
    setBusy(true);
    try {
      await apiFetch(`/admin/users/${u.id}/reset-password`, { method: "POST", body: JSON.stringify({ newPassword: resetPw }) });
      setResetPw("");
      setJustReset(true);
      setTimeout(() => setJustReset(false), 2000);
    } catch (e) { toastError(e); }
    setBusy(false);
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>@{u.username} {u.is_admin && <span style={{ color: C.gold, fontSize: 10 }}>👑 ADMIN</span>}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{u.email} · joined {new Date(u.created_at).toLocaleDateString()} · {u.bets_created} bets created</div>
        </div>
        <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20, color: u.is_suspended ? C.red : C.green, background: (u.is_suspended ? C.red : C.green) + "18", border: `1px solid ${(u.is_suspended ? C.red : C.green)}30` }}>
          {u.is_suspended ? "SUSPENDED" : "ACTIVE"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {!u.is_admin && (
          <button onClick={toggleSuspend} disabled={busy}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${u.is_suspended ? C.green + "40" : C.red + "40"}`, background: u.is_suspended ? C.green + "15" : C.red + "10", color: u.is_suspended ? C.green : C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {u.is_suspended ? "Unsuspend" : "Suspend"}
          </button>
        )}
        <input type="password" placeholder="New password" value={resetPw} onChange={e => setResetPw(e.target.value)}
          style={{ flex: 1, minWidth: 100, padding: "6px 10px", borderRadius: 8, background: "#0a0c12", border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
        <button onClick={doReset} disabled={busy || !resetPw}
          style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.blue}40`, background: C.blue + "10", color: C.blue, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {justReset ? "✓ Reset" : "Reset PW"}
        </button>
      </div>
    </div>
  );
}

function AdminUsersTab() {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); apiFetch("/admin/users").then(u => { setUsers(u); setLoading(false); }).catch(e => { toastError(e); setLoading(false); }); };
  useEffect(load, []);
  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading...</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(users || []).map(u => <AdminUserRow key={u.id} u={u} onChanged={load} />)}
    </div>
  );
}

function AdminSettleModal({ bet, onClose, onSettled }) {
  const [result, setResult] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch(`/admin/bets/${bet.id}/settle`, { method: "POST", body: JSON.stringify({ result: result || "Settled by admin" }) });
      onSettled(); onClose();
    } catch (e) { toastError(e); setSaving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2500, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Force settle</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{bet.title}</div>
        <input placeholder="Result note (e.g. 'refunded, dispute')" value={result} onChange={e => setResult(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "#0a0c12", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 16 }}>No winners specified here — this just closes the bet with no balance changes. For payouts, use the normal Settle flow on the bet card.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: 12, borderRadius: 10, background: C.gold + "20", border: `1px solid ${C.gold}40`, color: C.gold, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{saving ? "..." : "Settle"}</button>
        </div>
      </div>
    </div>
  );
}

function AdminBetsTab() {
  const [bets, setBets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settleTarget, setSettleTarget] = useState(null);
  const load = () => { setLoading(true); apiFetch("/admin/bets").then(b => { setBets(b); setLoading(false); }).catch(e => { toastError(e); setLoading(false); }); };
  useEffect(load, []);

  const doDelete = async (id) => {
    try {
      await apiFetch(`/admin/bets/${id}`, { method: "DELETE" });
      load();
    } catch (e) { toastError(e); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {settleTarget && <AdminSettleModal bet={settleTarget} onClose={() => setSettleTarget(null)} onSettled={load} />}
      {(bets || []).map(b => (
        <div key={b.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{b.title}</div>
            <Pill status={b.status} />
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>
            @{b.creator_name} · {b.bet_type || b.category} · ${b.amount}/person · {b.participant_count} players
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {b.status !== "settled" && (
              <button onClick={() => setSettleTarget(b)}
                style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.gold}40`, background: C.gold + "10", color: C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Force Settle
              </button>
            )}
            <button onClick={() => doDelete(b.id)}
              style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.red}40`, background: C.red + "10", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminScreen({ onBack }) {
  const [tab, setTab] = useState("stats");
  return (
    <div style={{ padding: "20px 16px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>⚙ Admin</div>
          <div style={{ fontSize: 11, color: C.muted }}>Manage users and bets</div>
        </div>
        <button onClick={onBack} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 11, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.card, borderRadius: 12, padding: 4 }}>
        {[["stats", "Stats"], ["users", "Users"], ["bets", "Bets"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, background: tab === k ? C.gold + "20" : "transparent", color: tab === k ? C.gold : C.muted }}>
            {label}
          </button>
        ))}
      </div>
      {tab === "stats" && <AdminStatsTab />}
      {tab === "users" && <AdminUsersTab />}
      {tab === "bets" && <AdminBetsTab />}
    </div>
  );
}

function JoinPreviewScreen({ betId, currentUser, onLogin, onJoined, onExit }) {
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"
  const [bet, setBet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pick, setPick] = useState("");
  const [guess, setGuess] = useState("");
  const [startValue, setStartValue] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetch(API + `/bets/${betId}/public`).then(r => r.json()).then(d => {
      if (d.error) setLoadError(d.error); else setBet(d);
      setLoading(false);
    }).catch(() => { setLoadError("Couldn't load this bet"); setLoading(false); });
  }, [betId]);

  const betCat = (bet && (bet.bet_type || bet.category)) || "";
  const isFactual = betCat === "factual";
  const isGuess = betCat === "guess";
  const isWeight = betCat === "weight";
  const canJoin = () => {
    if (!bet) return false;
    if (isFactual && bet.odds_home) return !!pick;
    if (isGuess) return !!guess;
    if (isWeight) return !!startValue;
    return true;
  };

  const doJoin = async () => {
    setJoining(true);
    try {
      await apiFetch(`/bets/${betId}/join`, { method: "POST", body: JSON.stringify({ pick: pick || null, guess: guess || null, startValue: startValue || null }) });
      setJoined(true);
      setTimeout(() => onJoined(), 1200);
    } catch (e) { toastError(e); setJoining(false); }
  };

  if (authMode === "login") return <LoginScreen onLogin={onLogin} onSignup={() => setAuthMode("signup")} onBack={() => setAuthMode(null)} onForgot={() => {}} />;
  if (authMode === "signup") return <SignupScreen onSignup={onLogin} onLogin={() => setAuthMode("login")} onBack={() => setAuthMode(null)} />;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.muted, fontSize: 13 }}>Loading bet...</div>
    </div>
  );

  if (loadError || !bet) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🤔</div>
      <div style={{ fontSize: 15, color: C.text, fontWeight: 700, marginBottom: 8 }}>{loadError || "Bet not found"}</div>
      <button onClick={onExit} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "inherit", cursor: "pointer" }}>Go to FriendlyBets</button>
    </div>
  );

  if (joined) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>You're in!</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginTop: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🤝</div>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}>YOU'VE BEEN INVITED</div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>{bet.title}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>by @{bet.creator_name} · {bet.participant_count} joined</div>
        {bet.description && <div style={{ fontSize: 13, color: "#9aa0b8", marginBottom: 12 }}>{bet.description}</div>}
        <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>${bet.amount} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>wager</span></div>
      </div>

      {!currentUser && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => setAuthMode("signup")} style={{ padding: 15, borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#00b050)`, color: "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>Sign Up to Join</button>
          <button onClick={() => setAuthMode("login")} style={{ padding: 15, borderRadius: 14, cursor: "pointer", background: "transparent", border: `1px solid ${C.border}`, color: C.text, fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>I already have an account</button>
        </div>
      )}

      {currentUser && bet.status === "settled" && (
        <div style={{ textAlign: "center", color: C.muted, fontSize: 13 }}>This bet has already been settled.</div>
      )}

      {currentUser && bet.status !== "settled" && (
        <>
          {isFactual && bet.odds_home && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PICK YOUR SIDE</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[[bet.home_team, bet.odds_home, C.blue],[bet.away_team, bet.odds_away, C.purple]].map(([team, odds, c]) => {
                  const label = `${team} ${odds}`;
                  const isSelected = pick === label;
                  return (
                    <button key={team} onClick={() => setPick(isSelected ? "" : label)}
                      style={{ flex: 1, background: isSelected ? c+"20" : "#0d0f14", border: `2px solid ${isSelected ? c : C.border}`, borderRadius: 12, padding: "12px 8px", textAlign: "center", cursor: "pointer", fontFamily: "inherit" }}>
                      <div style={{ fontSize: 10, color: isSelected ? c : C.muted, marginBottom: 4 }}>{team}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: isSelected ? c : C.text }}>{odds}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {isGuess && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>YOUR GUESS</div>
              <input type="number" value={guess} onChange={e => setGuess(e.target.value)} placeholder="Enter your guess"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.blue}44`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          {isWeight && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>YOUR STARTING WEIGHT</div>
              <input type="number" value={startValue} onChange={e => setStartValue(e.target.value)} placeholder="e.g. 185"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0d0f14", border: `1px solid ${C.gold}44`, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          <button onClick={doJoin} disabled={!canJoin() || joining}
            style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: !canJoin() || joining ? "not-allowed" : "pointer", background: !canJoin() || joining ? C.border : `linear-gradient(135deg,${C.green},#00b050)`, color: !canJoin() || joining ? C.muted : "#000", fontWeight: 800, fontSize: 15, fontFamily: "inherit" }}>
            {joining ? "Joining..." : "✓ Accept & Join"}
          </button>
        </>
      )}
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
  const [betsVersion, setBetsVersion] = useState(0);
  const bumpBets = () => setBetsVersion(v => v + 1);
  const [showAdmin, setShowAdmin] = useState(false);
  const [joinBetId, setJoinBetId] = useState(() => {
    const m = typeof window !== "undefined" ? window.location.pathname.match(/\/join\/(\d+)/) : null;
    return m ? m[1] : null;
  });
  const exitJoinFlow = () => {
    setJoinBetId(null);
    if (typeof window !== "undefined" && window.history) window.history.replaceState({}, "", "/");
  };

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
    <div style={{ width: "100%", minHeight: "100vh", background: "#0d0f14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
        <div style={{ fontSize: 14, color: "#4a5068" }}>Loading...</div>
      </div>
    </div>
  );

  const nav = [["home","⬡","Bets"],["live","●","Live"],["invites","✉","Invites"],["friends","🤝","Friends"],["history","◈","History"]];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',system-ui,sans-serif", color: C.text, position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{display:none} input::placeholder,textarea::placeholder{color:#4a5068}`}</style>
      <ErrorToast />

      {joinBetId && (
        <JoinPreviewScreen betId={joinBetId} currentUser={currentUser}
          onLogin={(user) => handleLogin(user)}
          onJoined={() => { exitJoinFlow(); bumpBets(); }}
          onExit={exitJoinFlow} />
      )}

      {!joinBetId && (
        <>
          {/* Auth screens */}
          {!currentUser && authScreen === "splash" && <SplashScreen onLogin={() => setAuthScreen("login")} onSignup={() => setAuthScreen("signup")} />}
          {!currentUser && authScreen === "login" && <LoginScreen onLogin={handleLogin} onSignup={() => setAuthScreen("signup")} onBack={() => setAuthScreen("splash")} onForgot={() => setAuthScreen("forgot")} />}
          {!currentUser && authScreen === "signup" && <SignupScreen onSignup={handleLogin} onLogin={() => setAuthScreen("login")} onBack={() => setAuthScreen("splash")} />}
          {!currentUser && authScreen === "forgot" && <ForgotPasswordScreen onBack={() => setAuthScreen("login")} onDone={() => setAuthScreen("login")} />}

          {/* Main app */}
          {currentUser && (
            <>
              <div style={{ overflowY: "auto", height: "100vh", paddingBottom: showAdmin ? 24 : 90 }}>
                {showAdmin && <AdminScreen onBack={() => setShowAdmin(false)} />}
                {!showAdmin && screen === "home" && <HomeScreen user={currentUser} onLogout={handleLogout} onResolve={setResolveBet} refreshSignal={betsVersion} onOpenAdmin={() => setShowAdmin(true)} />}
                {!showAdmin && screen === "live" && <LiveScreen refreshSignal={betsVersion} />}
                {!showAdmin && screen === "invites" && <InvitesScreen />}
                {!showAdmin && screen === "friends" && <FriendsScreen />}
                {!showAdmin && screen === "history" && <HistoryScreen refreshSignal={betsVersion} />}
              </div>
              {!showAdmin && showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); setScreen("home"); bumpBets(); }} />}
              {!showAdmin && resolveBet && <ResolveModal bet={resolveBet} onClose={() => setResolveBet(null)} onSettled={bumpBets} />}
              {!showAdmin && (
                <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", background: "rgba(13,15,20,0.97)", borderTop: `1px solid ${C.border}`, backdropFilter: "blur(20px)", padding: "8px 24px 24px", display: "flex", alignItems: "center", gap: 2, zIndex: 100, maxWidth: 960, margin: "0 auto" }}>
                  {nav.map(([k,icon,label]) => (
                    <button key={k} onClick={() => setScreen(k)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px", borderRadius: 12, border: "none", cursor: "pointer", background: screen===k ? C.green+"10" : "transparent", color: screen===k ? C.green : C.muted, fontFamily: "inherit" }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
                    </button>
                  ))}
                  <button onClick={() => setShowCreate(true)} style={{ width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#00b050)`, color: "#000", fontSize: 26, fontWeight: 700, flexShrink: 0, boxShadow: `0 4px 20px ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
