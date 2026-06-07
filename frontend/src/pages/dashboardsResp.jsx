// pages/DashboardResp.jsx
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  LineChart,Line
} from "recharts";
import Siderbar from "../components/siderbar";
import axios from "axios";
import { AppContext } from "../context/AppContext.jsx";
import { toast } from "react-toastify";
import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import CertificatDownload from "../components/certificatDownload.jsx";


function ChartCard({ title, subtitle, children, style = {} }) {
  return (
    <div style={{ background:"#fff", padding:"20px", borderRadius:"12px", boxShadow:"0 1px 3px rgba(0,0,0,0.1)",marginBottom: "30px", ...style }}>
      <h3 style={{ marginBottom: subtitle ? "4px" : "20px", color:"#374151", fontSize:"15px", fontWeight:600 }}>{title}</h3>
      {subtitle && <p style={{ marginBottom:"16px", color:"#9ca3af", fontSize:"12px" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function EmptyState({ label = "Aucune donnée disponible" }) {
  return (
    <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af", fontSize:"14px" }}>
      {label}
    </div>
  );
}

// ─── Drill-down refused list ──────────────────────────────────────────────────
function OrgRefusedList({ rows }) {
  if (!rows.length) return <EmptyState label="Aucun critère refusé pour cet organisme" />;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {rows.map((r, i) => (
        <div key={i} style={{ padding:"12px 14px", background:"#fef2f2", borderRadius:"8px", borderLeft:"3px solid #ef4444" }}>
          <div style={{ fontWeight:600, color:"#374151", fontSize:"13px", marginBottom:"4px" }}>{r.critere}</div>
          {r.commentaire !== "" && <div style={{ color:"#6b7280", fontSize:"12px", fontStyle:"italic" }}>💬 {r.commentaire}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRINCIPLE_COLORS = [
  "#6366f1","#0ea5e9","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#f43f5e",
  "#3b82f6","#22c55e","#eab308","#a855f7"
];

const ICONS = {
  "Excellence governance": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
      <path d="M5 20h14"/>
    </svg>
  ),
  "Or": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  ),
  "Argent": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  ),
  "Bronze": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5"/>
    </svg>
  ),
  "Non conforme": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  "Non évalué": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
};

const LABEL_CONFIG = {
  "Excellence governance": { color:"#7c3aed", bg:"#f5f3ff", rank:5 },
  "Or":                    { color:"#d97706", bg:"#fffbeb", rank:4 },
  "Argent":                { color:"#475569", bg:"#f8fafc", rank:3 },
  "Bronze":                { color:"#92400e", bg:"#fef3c7", rank:2 },
  "Non conforme":          { color:"#dc2626", bg:"#fef2f2", rank:1 },
  "Non évalué":            { color:"#9ca3af", bg:"#f9fafb", rank:0 },
};

const STATUS_CONFIG = {
  "terminé":    { color:"#10b981", bg:"#ecfdf5", label:"Terminée"    },
  "en cours":   { color:"#f59e0b", bg:"#fffbeb", label:"En cours"    },
  "en attente": { color:"#6b7280", bg:"#f9fafb", label:"En attente"  },
};

// In your badge component:
function LabelBadge({ label }) {
  const cfg = LABEL_CONFIG[label];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px", borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      {ICONS[label]}
      {label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLabelConfig(label) {
  return LABEL_CONFIG[label] || LABEL_CONFIG["Non évalué"];
}
function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { color:"#9ca3af", bg:"#f9fafb", label: status || "—" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent = "#6366f1", delay = 0 }) {
  return (
    <div style={{
      background:"#fff", borderRadius:"16px", padding:"20px 22px",
      border:"1px solid #f1f5f9",
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
      display:"flex", flexDirection:"column", gap:"6px",
      animation:`fadeUp 0.5s ease both`, animationDelay:`${delay}ms`,
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"22px" }}>{icon}</span>
        <div style={{
          width:"8px", height:"8px", borderRadius:"50%",
          background:accent, boxShadow:`0 0 0 3px ${accent}22`
        }} />
      </div>
      <div style={{ fontSize:"28px", fontWeight:"800", color:"#0f172a", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:"12px", color:"#94a3b8", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
      {sub && <div style={{ fontSize:"12px", color:"#64748b", marginTop:"2px" }}>{sub}</div>}
    </div>
  );
}

function ProgressRing({ pct, size = 80, stroke = 7, color = "#6366f1" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

function EvalCard({ ev, index, onClick, onDelete}) {
  const sc = getStatusConfig(ev.statut || ev.status);
  const lc = getLabelConfig(ev.label);
  const scorePct = ev.score && ev.scoreMax ? Math.round((ev.score / ev.scoreMax) * 100) : null;

  return (
    <div 
    onClick={onClick}
    style={{
      background:"#fff", borderRadius:"14px", padding:"16px 20px",
      border:"1px solid #f1f5f9", boxShadow:"0 1px 3px rgba(0,0,0,0.05)",
      display:"grid", gridTemplateColumns:"auto 1fr auto", alignItems:"center", gap:"16px",
      animation:`fadeUp 0.4s ease both`, animationDelay:`${index * 80}ms`,
      transition:"box-shadow 0.2s, transform 0.2s",
      cursor:"pointer",
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)"; e.currentTarget.style.transform="translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.05)"; e.currentTarget.style.transform="none"; }}>
      {/* Index bubble */}
      <div style={{
        width:"36px", height:"36px", borderRadius:"50%", background:"#f8fafc",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:"13px", fontWeight:"700", color:"#64748b", border:"1px solid #e2e8f0", flexShrink:0
      }}>
        {index + 1}
      </div>

      {/* Info */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
          <span style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a" }}>
            Évaluation #{ev.id}
          </span>
          <span style={{
            padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:"600",
            background:sc.bg, color:sc.color
          }}>{sc.label}</span>
          {ev.label && (
            <span style={{
              padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:"600",
              background:lc.bg, color:lc.color
            }}>{lc.icon} {ev.label}</span>
          )}
        </div>
        <div style={{ display:"flex", gap:"14px", fontSize:"12px", color:"#94a3b8" }}>
          {ev.dateCreation && <span>Crée le {ev.dateCreation}</span>}
          {ev.dateTermination && <span>Terminée le {ev.dateTermination}</span>}
          {ev.progression != null && (
            <span style={{ color:"#64748b" }}>
              {ev.progression}% traité
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop:"8px", height:"4px", background:"#f1f5f9", borderRadius:"4px", overflow:"hidden", maxWidth:"220px" }}>
          <div style={{
            height:"100%", width:`${ev.progression || 0}%`,
            background: ev.progression === 100 ? "#10b981" : "#6366f1",
            borderRadius:"4px", transition:"width 0.8s ease"
          }} />
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {scorePct != null ? (
          <>
            <div style={{ fontSize:"11px", color:"#94a3b8" }}>Score global</div>
            <div style={{ fontSize:"22px", fontWeight:"800", color:"#0f172a" }}>{scorePct}%</div>
          </>
        ) : (
          <div style={{ fontSize:"13px", color:"#cbd5e1" }}>—</div>
        )}
        <button
            className="btn btn-outline-danger btn-sm"
            onClick={(e) => {e.stopPropagation();onDelete(ev.id);}}>
            <i className="bi bi-trash"></i>
        </button>
        </div>
      </div>
    </div>
  );
}

function PrincipleBar({ principe, score, color, delay }) {
  return (
    <div style={{ animation:`fadeUp 0.4s ease both`, animationDelay:`${delay}ms` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px", alignItems:"baseline" }}>
        <span style={{ fontSize:"13px", color:"#334155", fontWeight:"500", maxWidth:"70%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {principe}
        </span>
        <span style={{ fontSize:"13px", fontWeight:"700", color }}>{score}%</span>
      </div>
      <div style={{ height:"7px", borderRadius:"999px", background:"#f1f5f9", overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${score}%`, borderRadius:"999px",
          background:color, transition:"width 1s cubic-bezier(.4,0,.2,1)"
        }} />
      </div>
    </div>
  );
}

// Custom tooltip for radar chart
const CustomRadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"#0f172a", border:"none", borderRadius:"10px",
      padding:"8px 14px", fontSize:"13px", boxShadow:"0 4px 20px rgba(0,0,0,0.2)"
    }}>
      <div style={{ fontWeight:"600", color:"#f8fafc" }}>{payload[0]?.payload?.principe}</div>
      <div style={{ color:"#818cf8", fontWeight:"700", fontSize:"15px" }}>{payload[0]?.value}%</div>
    </div>
  );
};

const CommentTooltip = ({ commentaires }) => {
  const [visible, setVisible] = useState(false);
  if (!commentaires?.length) return null;

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* Trigger pill */}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 700, color: "#92400e",
        background: "rgba(245,158,11,0.12)",
        border: "1px solid rgba(245,158,11,0.3)",
        borderRadius: 20, padding: "2px 8px",
        cursor: "default", letterSpacing: "0.02em",
      }}>
        <MessageSquare size={9} strokeWidth={2.5} />
        {commentaires.length} commentaire{commentaires.length > 1 ? "s" : ""}
      </span>

      {/* Tooltip */}
      {visible && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          zIndex: 999, background: "#1e293b", borderRadius: 12,
          padding: "12px", minWidth: 280, maxWidth: 340,
          boxShadow: "0 8px 32px rgba(15,23,42,0.25)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: -5, left: 16,
            width: 10, height: 10, background: "#1e293b",
            transform: "rotate(45deg)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }} />

          <p style={{
            fontSize: 10, fontWeight: 700, color: "#64748b",
            textTransform: "uppercase", letterSpacing: "0.08em",
            margin: "0 0 10px",
          }}>
            Commentaires de l'évaluateur
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {commentaires.map((c, i) => {
              const isValidé = c.statut === "validé";
              const accent = isValidé ? "#10b981" : "#f87171";
              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8, padding: "8px 10px",
                  borderLeft: `3px solid ${accent}`,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: accent,
                    marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {c.critereNom || `Critère #${c.critereId}`}
                    <span style={{ marginLeft: 6, opacity: 0.7, fontWeight: 500, textTransform: "capitalize" }}>
                      · {c.statut}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>
                    {c.commentaire}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
const getSeenEvals = (year) => JSON.parse(localStorage.getItem(`seenEvals_${year}`) || "{}");
const getCommentFingerprint = (commentaires) =>
  (commentaires || [])
  .slice()
  .sort((a, b) => a.critereId - b.critereId)
  .map(c => `${c.critereId}:${c.commentaire}:${c.statut}`).join("|");

// ─── CSS keyframes injected once ─────────────────────────────────────────────
const GLOBAL_STYLES = `
@keyframes fadeUp {
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes pulse {
  0%,100% { opacity:1; }
  50%      { opacity:0.5; }
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════
export default function DashboardResp() {
  const { backendUrl, userData } = useContext(AppContext);
  const [seenEvals, setSeenEvals] = useState({});
  //const [seenEvals, setSeenEvals] = useState(() => getSeenEvals(new Date().getFullYear()));
  //console.log("userData: ",userData);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dernierEval,setDernierEval]= useState(null); //latest evaluation mais forme de db
  const [evaluations, setEvaluations] = useState([]);   // all evals for this organisme
  const [latestEval,setLatestEval]= useState(null);  //latest evalution pour ce organisme
  const [rawScores, setRawScores] = useState([]);    // scoreParPrincipe entries
  const [principes, setPrincipes] = useState([]);    // full principes list
  const [certificatVisible, setCertificatVisible] = useState(false);
  const [dernierEvalReponses, setDernierEvalReponses] = useState([]);

  const [rangs, setRangs] = useState([]);



  const organismeId = userData?.organisme?.id;

  const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);

  const [evolutionMode, setEvolutionMode] = useState("annee");

  const startEvaluation=async()=>{
      if (!userData) return alert("Utilisateur introuvable !");
      console.log("current user: ",userData);
      // Pass currentUser to EvaluationForm via location state
      navigate("/evaluationForm", { state: { userData } });
    }

  const EvolutionData = useMemo(() =>
    [...evaluations]
      // Trier par date de création ou de mise à jour (la plus ancienne en premier)
      .filter(ev => ev.annee === anneeSelectionnee)
      .sort((a, b) => (a.dateCreation || "").localeCompare(b.dateCreation || ""))
      .map((ev, i) => ({
        index: `Eval ${i + 1}(${ev.dateUpdate || ev.dateCreation || ""})`,
        date:  ev.dateTermination || ev.dateUpdate || "",
        score: ev.score && ev.scoreMax ? +((ev.score / ev.scoreMax) * 100).toFixed(1) : 0,
        label: ev.label,
      })),
  [evaluations]);

  const EvolutionByAnnee = useMemo(() =>
    [...rangs]
      .sort((a, b) => (a.annee || "")-(b.annee || ""))
      .map(r => ({
        index: `${r.annee}`,
        scoreRaw: `${r.score} / ${r.scoreMax}`,
        score: r.scorePct,
        label: r.label,
      })),
  [rangs]);


  const findCritereName = (id) => {
  for (const p of principes) {
    for (const pr of (p.pratiques || [])) {
      const found = (pr.criteres || []).find(c => c.id === id);
      if (found) return found.nom;
    }
  }
  return `Critère ${id}`;
};

const orgRefusedCriteres = useMemo(() => {
  if (!dernierEvalReponses.length) return [];
  return dernierEvalReponses
    .filter(r => r.statut?.toLowerCase() === "refusé")
    .map(r => ({
      critere: findCritereName(r.critereId),
      commentaire: r.commentaire || "",
      valeur: r.valeur,
    }));
}, [dernierEvalReponses, principes]);

  //pour supprimer les evaluations
  const deleteEval = async (evaluationId) => {
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer cette évaluation ?");
    if (!confirmDelete) return;
    try {
      await axios.delete(`${backendUrl}/evaluation/${evaluationId}`,{withCredentials: true});
      setEvaluations((prev) => {
        const updated=prev.filter((e) => e.id !== evaluationId);
        return updated;});
      toast.success("Evaluation supprimée");
    } catch (error) {
    toast.error("Erreur lors de la suppression");
  }
};

  // ── Fetch user profile ────────────────────────────────────────────────────
  useEffect(() => {
    if (!userData?.id) return;
    axios.get(`${backendUrl}/users/${userData.id}`, { withCredentials:true })
      .then(r => setUser(r.data))
      .catch(() => toast.error("Erreur chargement profil"));
  }, [backendUrl, userData?.id]);

  // ── Fetch evaluations for organisme ──────────────────────────────────────

  //latests evaluation mais forme de db
  useEffect(() => {
    if (!organismeId) return;
    axios.get(`${backendUrl}/evaluation/latest/${organismeId}`, { withCredentials:true })
      .then(r => setDernierEval(Array.isArray(r.data) ? r.data[0] : r.data))
      .catch(() => toast.error("Erreur chargement évaluations"))
      .finally(() => setLoading(false));
  }, [backendUrl, organismeId]);

  // all evaluations
  const fetchEvaluations = async (annee = anneeSelectionnee) => {
    try {
      //const latestRes = await axios.get(`${backendUrl}/evaluation/latest/${userData?.organisme?.id}`,{withCredentials: true}
      const res = await axios.get(`${backendUrl}/evaluation/all/treated`,{params: { annee },withCredentials: true});
      const evalsByOrg = Array.isArray(res.data)
        ? res.data.filter(ev => ev.organismeId === organismeId)
        : null;
      console.log("res:", evalsByOrg);
      setEvaluations(evalsByOrg);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  //latest evaluation
  const fetchLatest = async (annee = anneeSelectionnee) => {
    try {
      //fetch latest treated evaluation for every organisme, then filter for current organisme
      const latestRes = await axios.get(`${backendUrl}/evaluation/all/latest/treated`,
        {params: { annee },withCredentials: true});
      const filtered = Array.isArray(latestRes.data)
        ? latestRes.data.find(ev => ev.organismeId === organismeId)
        : null;
      console.log("latestRes:", filtered);
      setLatestEval(filtered);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch principes ───────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${backendUrl}/principes`, { withCredentials:true })
      .then(r => setPrincipes(r.data))
      .catch(() => {});
  }, [backendUrl]);

  //fetch annee disponible
useEffect(() => {
  const fetchAnnees = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/annee/disponibles/${userData?.organisme?.id}`,
        { withCredentials: true }
      );
      const currentYear = new Date().getFullYear();
      const years = [...new Set([...res.data, currentYear])].sort((a, b) => b - a);
      setAnneesDisponibles(years);
      
      // Set default year to current year if not already set
      setAnneeSelectionnee(prev => prev || currentYear);
    } catch (error) {
      toast.error("Erreur chargement des années");
      console.error(error);
    }
  };

  fetchAnnees();
}, [backendUrl]);


  // ── Fetch scores par principe ─────────────────────────────────────────────
  const fetchScores = async () => {
    if (!organismeId) return;
    try {
    const res = await axios.get(`${backendUrl}/scoreParPrincipe/organisme/${organismeId}`, { withCredentials: true });
    setRawScores(res.data);
  } catch {}
  };
  //use effects
  useEffect(() => {
    if (!organismeId || !anneeSelectionnee) return; 
    fetchEvaluations(anneeSelectionnee);          
  }, [backendUrl, organismeId, anneeSelectionnee]);  
  //useEffect(() => { fetchLatest(); },     [backendUrl, organismeId]);
  useEffect(() => {
    if (!organismeId || !anneeSelectionnee) return; 
    fetchLatest(anneeSelectionnee);          
  }, [backendUrl, organismeId, anneeSelectionnee]);  


  useEffect(() => {
    if (!organismeId || !latestEval?.id) return;
    fetchScores();
  }, [backendUrl, organismeId, anneeSelectionnee, latestEval?.id]);

useEffect(() => {
  if (!latestEval?.id) {
    setDernierEvalReponses([]);
    return;
  }
  axios.get(`${backendUrl}/evaluation/${latestEval.id}/reponses`, { withCredentials: true })
    .then(r => setDernierEvalReponses(r.data.reponses || []))
    .catch(() => setDernierEvalReponses([]));
}, [backendUrl, latestEval?.id]); 

  // ── Track seen evaluations in localStorage to show "new" badge ─────────────
  useEffect(() => {
    setSeenEvals(getSeenEvals(anneeSelectionnee));
  }, [anneeSelectionnee]);

useEffect(() => {
  if (!organismeId) return;
  axios.get(`${backendUrl}/evaluation/rang/${organismeId}`, { withCredentials: true })
    .then(r => setRangs(r.data))
    .catch(() => {});
  console.log("rangs:", rangs);
}, [backendUrl, organismeId,anneeSelectionnee]);

  const rangAnneeSelectionnee = rangs.find(r => r.annee === anneeSelectionnee) ?? null;

  // ── Computed: score moyen pour tous les évaluations par principe ────────────────────────────────────
  const scoresMoyen = useMemo(() => {
    if (!rawScores.length && !principes.length) return [];
    //filteredIds are the evaluationIds for the current year
    const filteredIds = new Set(evaluations.map(ev => ev.id));
    const yearScores = rawScores.filter(s => filteredIds.has(s.evaluationId));

    const principesAvecCriteres = principes.filter(p =>
      (p.pratiques || []).some(pr =>(pr.criteres || []).length > 0)
    );
    // If no scores yet, show all principles at 0 
    if (!yearScores.length) {
      return principesAvecCriteres.map(p => ({ principe: p.nom, score: 0 }));
    }
    const map = {};
      yearScores.forEach(item=>{
        const principeObj=principesAvecCriteres.find(p=>p.id===item.principeId);
        if (!principeObj) return;
        const nom = principeObj.nom;
        const pct = item.scoreMax ? (item.score / item.scoreMax * 100).toFixed(2) : 0;
        if (!map[nom]) map[nom] = { total: parseFloat(pct), count: 1 };
        else {
          map[nom].total += parseFloat(pct);
          map[nom].count++;
    }
      })
    console.log("map:", map);
    return Object.entries(map).map(([principe, { total, count }]) => ({
      principe, score: (total / count).toFixed(2)
    }));
  }, [rawScores, principes, evaluations]);

  //score pour la dernière évaluation par principe
  const scoreForLatestEval = useMemo(() => {
    if (!rawScores.length || !latestEval) return [];
    const principesAvecCriteres = principes.filter(p =>
      (p.pratiques || []).some(pr =>(pr.criteres || []).length > 0)
    );
    const latestScores = rawScores.filter(s => s.evaluationId === latestEval.id);
    if (!latestScores.length) return [];
    return latestScores.map(item => {
      const principeObj=principesAvecCriteres.find(p=>p.id===item.principeId);
      if (!principeObj) return null;
      const nom = principeObj.nom;
      const pct = item.scoreMax ? (item.score / item.scoreMax * 100).toFixed(2) : 0;
      return { principe: nom, score: pct };
    })
      .filter(Boolean);
  }, [rawScores, principes, latestEval]);

  // ── Computed: global KPIs ─────────────────────────────────────────────────
  const globalScore = useMemo(() => {
    if (!latestEval) return null;
    if (latestEval.score && latestEval.scoreMax)
      return Math.round((latestEval.score / latestEval.scoreMax) * 100);
    return null;
  }, [latestEval]);

  const currentLabel = latestEval?.label || "Non évalué";
  const labelCfg     = getLabelConfig(currentLabel);

  const terminees = evaluations.filter(ev => (ev.statut || ev.status) === "terminé").length;
  const enCours   = evaluations.filter(ev => (ev.statut || ev.status) === "en cours").length;

  // ── Check if there is an in-progress eval to continue ────────────────────
  const activeEval = useMemo(() =>
    evaluations.find(ev => (ev.statut || ev.status) === "en cours" || (ev.statut || ev.status) === "en attente"),
  [evaluations]);

  const isLoading = loading && !evaluations.length;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:"#f8fafc", fontFamily:"'DM Sans', system-ui, sans-serif" }}>
        <div style={{ width:250, flexShrink:0 }}>
          <Siderbar />
        </div>

        <div style={{ flex:1, padding:"28px 32px", overflowX:"hidden" }}>

          {/* ── Hero header ─────────────────────────────────────────────── */}
          <div style={{
            background:"linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)",
            borderRadius:"20px", padding:"28px 32px", marginBottom:"28px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            boxShadow:"0 8px 32px rgba(15,23,42,0.18)",
            animation:"fadeUp 0.5s ease both",
            position:"relative", overflow:"hidden"
          }}>
            {/* decorative circle */}
            <div style={{
              position:"absolute", right:"-40px", top:"-40px",
              width:"200px", height:"200px", borderRadius:"50%",
              background:"rgba(99,102,241,0.12)", pointerEvents:"none"
            }} />

            <div>
              <div style={{ fontSize:"12px", color:"#94a3b8", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"6px" }}>
                Tableau de bord
              </div>
              <h1 style={{ fontSize:"24px", fontWeight:"800", color:"#f8fafc", margin:"0 0 6px" }}>
                {userData?.organisme?.nomOrganisme || user?.nom || "Mon organisme"}
              </h1>
              <div style={{ fontSize:"13px", color:"#64748b" }}>
                {userData?.organisme?.type && <span style={{ color:"#94a3b8" }}>{userData.organisme.type}</span>}
                {userData?.organisme?.secteur && <span style={{ color:"#64748b" }}> · {userData.organisme.secteur}</span>}
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
              {/* Label badge */}
              <div style={{
                background:labelCfg.bg, borderRadius:"14px", padding:"14px 22px", textAlign:"center",
                border:`2px solid ${labelCfg.color}30`
              }}>
                <div style={{ fontSize:"26px", marginBottom:"4px" }}>{ICONS[currentLabel]}</div>
                <div style={{ fontSize:"11px", fontWeight:"700", color:labelCfg.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  {currentLabel}
                </div>
              </div>

              {/* Score ring */}
              
              {globalScore != null && (
                <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                  <ProgressRing pct={globalScore} size={88} stroke={8} color={labelCfg.color} />
                  <div style={{ position:"absolute", textAlign:"center" }}>
                    <div style={{ fontSize:"18px", fontWeight:"800", color:"#f8fafc", lineHeight:1 }}>{globalScore}%</div>
                    <div style={{ fontSize:"9px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.05em" }}>score</div>
                  </div>
                </div>
              )}
              

              {/* CTA */}
              <button
                onClick={startEvaluation}
                style={{
                  padding:"12px 22px", borderRadius:"12px", border:"none", cursor:"pointer",
                  background:"#6366f1", color:"#fff", fontSize:"13px", fontWeight:"700",
                  boxShadow:"0 4px 16px rgba(99,102,241,0.35)",
                  transition:"all 0.2s",
                  whiteSpace:"nowrap"
                }}
                onMouseEnter={e => { e.target.style.background="#4f46e5"; e.target.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.target.style.background="#6366f1"; e.target.style.transform="none"; }}>
                {/*{activeEval ? "▶ Continuer" : "+ Nouvelle évaluation"}*/}
                Nouvelle évaluation
              </button>
            </div>
          </div>
          

          {isLoading ? (
            <div style={{ textAlign:"center", padding:"60px", color:"#94a3b8", animation:"pulse 1.5s infinite" }}>
              Chargement des données…
            </div>
          ) : (
            <>
              {/* Year selector */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Année
              </label>
              <select
                value={anneeSelectionnee}
                onChange={e => setAnneeSelectionnee(Number(e.target.value))}
                style={{padding: "7px 32px 7px 12px",borderRadius: 10,border: "1px solid #e2e8f0",background: "#fff",color: "#0f172a",fontSize: 13,
                  fontWeight: 600,cursor: "pointer",outline: "none",appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={e =>  { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
              >
                {anneesDisponibles.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              </div>

              {/* ── KPI cards ─────────────────────────────────────────── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(170px, 1fr))", gap:"16px", marginBottom:"28px" }}>
                <KpiCard icon="📊" label="Score global" accent={labelCfg.color}
                  value={globalScore != null ? `${globalScore}%` : "—"}
                  sub={latestEval ? `Dernière éval. ${latestEval.dateTermination || latestEval.dateCreation || ""}` : "Aucune évaluation"}
                  delay={0} />
                <KpiCard icon="📋" label="Évaluations totales" accent="#0ea5e9"
                  value={evaluations.length}
                  sub={`${terminees} terminée${terminees > 1 ? "s" : ""}`}
                  delay={80} />
                <KpiCard icon="⏳" label="En cours" accent="#f59e0b"
                  value={enCours}
                  sub={enCours ? "Évaluations actives" : "Aucune en cours"}
                  delay={160} />
                {/*<KpiCard icon="🏷️" label="Label actuel" accent={labelCfg.color}
                  value={ICONS[currentLabel]}
                  sub={currentLabel}
                  delay={240} />*/}
                <KpiCard icon="📐" label="Principes" accent="#8b5cf6"
                  value={principes.length}
                  sub={`${principes.reduce((s,p)=>s+(p.pratiques?.length||0),0)} pratiques`}
                  delay={320} />

                {rangs.length > 0 && (
                <KpiCard
                  icon="🏆"
                  label="Classement national"
                  value={`#${rangAnneeSelectionnee ? rangAnneeSelectionnee.rang : "—"}`}
                  sub={`sur ${rangs[0].totalOrganismes} organismes pour l'année ${anneeSelectionnee}`}
                  accent="#d97706"
                  delay={240}
                />
)}
              </div>

              {/* ── Charts row ────────────────────────────────────────── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"24px" }}>

                {/* Radar */}
                <div style={{
                  background:"#fff", borderRadius:"16px", padding:"24px",
                  border:"1px solid #f1f5f9", boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                  animation:"fadeUp 0.5s ease 0.1s both"
                }}>
                  <div style={{ fontSize:"11px", color:"#94a3b8", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"4px" }}>
                    Vue d'ensemble
                  </div>
                  <h2 style={{ fontSize:"16px", fontWeight:"700", color:"#0f172a", margin:"0 0 16px" }}>
                    Scores par principe
                  </h2>
                  {scoreForLatestEval.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={scoreForLatestEval} margin={{ top:10, right:30, bottom:10, left:30 }}>
                        <PolarGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                        <PolarAngleAxis dataKey="principe" tick={{ fontSize:10, fill:"#475569", fontWeight:500 }} />
                        <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:9, fill:"#94a3b8" }} />
                        <Radar name="Score" dataKey="score"
                          stroke="#6366f1" fill="#6366f1" fillOpacity={0.15}
                          strokeWidth={2.5} dot={{ r:4, fill:"#6366f1", strokeWidth:0 }} />
                        <Tooltip content={<CustomRadarTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height:260, display:"flex", alignItems:"center", justifyContent:"center", color:"#cbd5e1", fontSize:"14px" }}>
                      Aucune donnée disponible
                    </div>
                  )}
                </div>

                {/* Principle bars */}
                <div style={{
                  background:"#fff", borderRadius:"16px", padding:"24px",
                  border:"1px solid #f1f5f9", boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                  animation:"fadeUp 0.5s ease 0.2s both",
                  overflowY:"auto", maxHeight:"380px"
                }}>
                  <div style={{ fontSize:"11px", color:"#94a3b8", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"4px" }}>
                    Détail
                  </div>
                  <h2 style={{ fontSize:"16px", fontWeight:"700", color:"#0f172a", margin:"0 0 20px" }}>
                    Résultats par principe
                  </h2>
                  {scoreForLatestEval.length > 0 ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                      {scoreForLatestEval.map((sp, i) => (
                        <PrincipleBar key={sp.principe}
                          principe={sp.principe} score={sp.score}
                          color={PRINCIPLE_COLORS[i % PRINCIPLE_COLORS.length]}
                          delay={i * 50} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ color:"#cbd5e1", fontSize:"14px", textAlign:"center", paddingTop:"40px" }}>
                      Lancez une évaluation pour voir vos résultats
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bar chart (scores) — only if data ─────────────────── */}
              {scoreForLatestEval.length > 0 && (
                <div style={{
                  background:"#fff", borderRadius:"16px", padding:"24px",
                  border:"1px solid #f1f5f9", boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                  marginBottom:"24px", animation:"fadeUp 0.5s ease 0.3s both"
                }}>
                  <div style={{ fontSize:"11px", color:"#94a3b8", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"4px" }}>
                    Comparatif
                  </div>
                  <h2 style={{ fontSize:"16px", fontWeight:"700", color:"#0f172a", margin:"0 0 16px" }}>
                    Score par principe
                  </h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={scoreForLatestEval} margin={{ top:0, right:10, left:0, bottom:30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="principe" interval={0} angle={-22} textAnchor="end"
                        tick={{ fontSize:10, fill:"#64748b" }} />
                      <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{ fontSize:10, fill:"#94a3b8" }} />
                      <Tooltip formatter={v=>[`${v}%`, "Score"]} />
                      <Bar dataKey="score" radius={[6,6,0,0]}>
                        {scoreForLatestEval.map((_, i) => (
                          <Cell key={i} fill={PRINCIPLE_COLORS[i % PRINCIPLE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Score evolution — toggleable */}
              <ChartCard
                title="📈 Évolution du score"
                subtitle={evolutionMode === "annee"
                  ? `Globale(Tous les années)`
                  : "Dernière évaluation terminée par année"}
              >
                {/* Toggle buttons */}
                <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                  {[
                    { id:"annee",  label:`Par éval. (${anneeSelectionnee})` },
                    { id:"global", label:"Par année" },
                  ].map(btn => (
                    <button key={btn.id} onClick={() => setEvolutionMode(btn.id)}
                      style={{
                        padding:"5px 14px", borderRadius:8, border:"1px solid",
                        fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s",
                        background: evolutionMode === btn.id ? "#0f172a" : "#f8fafc",
                        color:      evolutionMode === btn.id ? "#fff"    : "#64748b",
                        borderColor:evolutionMode === btn.id ? "#0f172a" : "#e2e8f0",
                      }}>
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Mode 1 — all evals in selected year */}
                {evolutionMode === "annee" && (
                  EvolutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={EvolutionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="index" tick={{ fontSize:11, fill:"#64748b" }} />
                        <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{ fontSize:11, fill:"#94a3b8" }} />
                        <Tooltip
                          formatter={(v, _, props) => [`${v}%`, `Score — ${props.payload.label || ""}`]}
                          labelFormatter={l => l} />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5}
                          dot={{ fill:"#3b82f6", r:5 }} activeDot={{ r:7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <EmptyState label="Pas d'historique disponible pour cette année" />
                )}

                {/* Mode 2 — latest eval per year */}
                {evolutionMode === "global" && (
                  EvolutionByAnnee.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={EvolutionByAnnee}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="index" tick={{ fontSize:12, fill:"#64748b" }} />
                        <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{ fontSize:11, fill:"#94a3b8" }} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            const lc = LABEL_CONFIG[d.label] || LABEL_CONFIG["Non évalué"];
                            return (
                              <div style={{ background:"#0f172a", borderRadius:10, padding:"10px 14px", fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
                                <div style={{ fontWeight:700, color:"#f8fafc", marginBottom:4 }}>Année {label}</div>
                                <div style={{ color:"#818cf8", fontWeight:700, fontSize:15 }}>{d.score}%</div>
                                <div style={{ color:"#94a3b8", fontSize:12 }}>Score: {d.scoreRaw}</div>
                                <div style={{ marginTop:4 }}>
                                  <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600, background:lc.bg, color:lc.color }}>{d.label}</span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                          dot={{ fill:"#6366f1", r:5 }} activeDot={{ r:7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <EmptyState label="Aucune donnée multi-année disponible" />
                )}
              </ChartCard>


              {/* Refused criteria */}
                <ChartCard title="🚫 Critères refusés" subtitle="Sur la derniére evaluation de cet organisme">
                  <OrgRefusedList rows={orgRefusedCriteres} />
                </ChartCard>

              {/* ── Evaluations history ───────────────────────────────── */}
              <div style={{
                background:"#fff", borderRadius:"16px", padding:"24px",
                border:"1px solid #f1f5f9", boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                animation:"fadeUp 0.5s ease 0.4s both"
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
                  <div>
                    <div style={{ fontSize:"11px", color:"#94a3b8", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"4px" }}>
                      Historique
                    </div>
                    <h2 style={{ fontSize:"16px", fontWeight:"700", color:"#0f172a", margin:0 }}>
                      Mes évaluations
                    </h2>
                  </div>
                  <span style={{
                    padding:"4px 12px", borderRadius:"20px", background:"#f1f5f9",
                    fontSize:"12px", color:"#64748b", fontWeight:"600"
                  }}>
                    {evaluations.length} au total
                  </span>
                </div>

                {evaluations.length === 0 ? (
                  <div style={{
                    textAlign:"center", padding:"48px 20px", color:"#94a3b8",
                    border:"2px dashed #e2e8f0", borderRadius:"12px"
                  }}>
                    <div style={{ fontSize:"32px", marginBottom:"10px" }}>📋</div>
                    <div style={{ fontSize:"14px", fontWeight:"600", marginBottom:"6px", color:"#64748b" }}>
                      Aucune évaluation pour le moment
                    </div>
                    <div style={{ fontSize:"13px", marginBottom:"16px" }}>
                      Commencez votre première auto-évaluation de gouvernance.
                    </div>
                    <button
                      onClick={() => navigate("/evaluationForm")}
                      style={{
                        padding:"10px 20px", borderRadius:"10px", border:"none", cursor:"pointer",
                        background:"#6366f1", color:"#fff", fontSize:"13px", fontWeight:"700"
                      }}>
                      + Démarrer une évaluation
                    </button>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {[...evaluations].filter(ev => ev.annee === anneeSelectionnee)
                  .sort((a, b) =>
                    (b.dateTermination || b.dateSoumission || "")
                    .localeCompare(a.dateTermination ||a.dateSoumission || "")
                  )
                    .map((ev, i) => {
                  return (
                    <div key={ev.id} style={{ position: "relative" }}>
                      <EvalCard
                        ev={ev}
                        index={i}
                        onDelete={deleteEval}
                        onClick={() => {
                          /*const updated = { ...seenEvals, [ev.id]: ev.commentaires?.length ?? 0 };
                          localStorage.setItem(`seenEvals_${anneeSelectionnee}`, JSON.stringify(updated));
                          setSeenEvals(updated);*/
                          const updated = { ...seenEvals, [String(ev.id)]: getCommentFingerprint(ev.commentaires) };
                          localStorage.setItem(`seenEvals_${anneeSelectionnee}`, JSON.stringify(updated));
                          setSeenEvals(updated);
                        navigate("/EvalEdit", { state: { evaluation: ev } });
                    }}/>

                    {/*Tooltip per evaluation */}
                    {/*ev.commentaires?.length > 0 && seenEvals[ev.id] !== ev.commentaires?.length && (
                      <div style={{
                        position: "absolute",
                        top: "-10px",        // ← floats above the card
                        right: "16px",       // ← aligned to right edge
                    }}>
                      <CommentTooltip commentaires={ev.commentaires} />
                    </div>
                  )*/}
                  
                    {/*(() => {
                      const seenCount = seenEvals[String(ev.id)] ?? 0;
                      const newCommentaires = ev.commentaires?.slice(seenCount) ?? [];
                      return newCommentaires.length > 0 && seenEvals[String(ev.id)] !== ev.commentaires?.length ? (
                        <div style={{position: "absolute",top: "-10px",right: "16px",}}>
                          <CommentTooltip commentaires={newCommentaires} />
                        </div>
                      ) : null;
                    })()*/}

                    {(() => {
                      const currentComments = ev.commentaires || [];

                      // previously seen fingerprint map
                      const seenFingerprint = seenEvals[String(ev.id)] || "";

                      // current comment fingerprints
                      const currentFingerprints = currentComments.map(c =>
                          `${c.critereId}:${c.commentaire}:${c.statut}`
                      );

                      // old fingerprints set
                      const oldSet = new Set(
                        seenFingerprint ? seenFingerprint.split("|") : []
                      );

                      // only comments that are NEW or EDITED
                      const changedComments = currentComments.filter(c => {
                        const fp = `${c.critereId}:${c.commentaire}:${c.statut}`;
                        return !oldSet.has(fp);
                    });

                    return changedComments.length > 0 ? (
                      <div style={{position: "absolute",top: "-10px",right: "16px",}}>
                        <CommentTooltip commentaires={changedComments} />
                      </div>
                    ) : null;
                  })()}
                  </div>
                  );
                })}
              </div>
                )}
              </div>
              {latestEval && latestEval.label!=="Non conforme" ?(
              <button
                onClick={() => setCertificatVisible(!certificatVisible)}
                style={{
                  padding:"12px 22px", borderRadius:"12px", border:"none", cursor:"pointer",marginTop:"30px",
                  background:"#6366f1", color:"#fff", fontSize:"13px", fontWeight:"700",
                  boxShadow:"0 4px 16px rgba(99,102,241,0.35)",
                  transition:"all 0.2s",
                  whiteSpace:"nowrap"
                }}
                onMouseEnter={e => { e.target.style.background="#4f46e5"; e.target.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.target.style.background="#6366f1"; e.target.style.transform="none"; }}>
                {certificatVisible ? "Cacher le certificat" : "Afficher le certificat"}
              </button>):(
                <div style={{marginTop: 30, padding: "20px", background: "#fef2f2", color: "#b91c1c", borderRadius: 10}}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Certificat de conformité indisponible</h3>
                  <p style={{ fontSize: 13, color: "#991b1b" }}>
                    Le certificat de conformité n'est pas disponible pour cet organisme.
                  </p>
                </div>
              )}
              {/* ── Certificat de conformité ─────────────────────────────────────────── */}


              {latestEval && certificatVisible && (
                <div style={{background: "#fff",borderRadius: 16,padding: "28px 32px",marginBottom: 28,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",}}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 20 }}>Certificat de conformité</h3>

                  <CertificatDownload
                    organisme={userData?.organisme}
                    responsable={userData}          /* userData has nom + prenom */
                    evaluation={latestEval}
                    rang={rangAnneeSelectionnee}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}