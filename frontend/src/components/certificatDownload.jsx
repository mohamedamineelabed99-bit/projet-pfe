import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LABEL_STYLES = {
  "Excellence governance": {
    color: "#7c3aed",
    description: "L'organisme démontre un niveau exceptionnel de gouvernance institutionnelle, intégrant pleinement les principes de transparence, de responsabilité et d'intégrité.",
  },
  "Or": {
    color: "#d97706",
    description: "L'organisme affiche une gouvernance solide et mature, avec des mécanismes de contrôle efficaces et un engagement fort envers les bonnes pratiques institutionnelles.",
  },
  "Argent": {
    color: "#475569",
    description: "L'organisme respecte les exigences fondamentales du référentiel national de gouvernance, avec des axes d'amélioration identifiés pour atteindre l'excellence.",
  },
  "Bronze": {
    color: "#92400e",
    description: "L'organisme est engagé dans une démarche de gouvernance institutionnelle, mais des efforts significatifs restent nécessaires pour consolider ses pratiques et atteindre les standards requis.",
  },
  "Non conforme": {
    color: "#dc2626",
    description: "L'organisme ne satisfait pas encore aux exigences minimales du référentiel national de gouvernance institutionnelle. Un plan d'action correctif est fortement recommandé.",
  },
};

function ProgressRing({ pct, size = 80, stroke = 7, color = "#6366f1" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const center = size / 2;

  return (
    <svg width={size} height={size}>
      {/* background */}
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={stroke}
      />

      {/* progress */}
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}  //SVG-native rotation
      />
    </svg>
  );
}


export default function CertificatDownload({ organisme, responsable, evaluation, rang }) {
  const certRef = useRef();
  const [exporting, setExporting] = useState(false);


  const nomOrganisme=organisme?.nomOrganisme || "—";
  const nomResponsable=responsable
    ? `${responsable.prenom ?? ""} ${responsable.nom ?? ""}`.trim()
    : "—";
  const secteur=organisme?.secteur || "—";
  const label=evaluation?.label  || "—";
  //const description=evaluation?.recommandations?.trim() || label;
  const dateSoumission=evaluation?.dateUpdate || "—";
  const rangValue = rang?.rang || "—";
  const totalOrganismes = rang?.totalOrganismes ?? "—";


  const scoreDisplay=evaluation?.score && evaluation?.scoreMax
    ? `${evaluation.score} / ${evaluation.scoreMax}`
    : "—";
  const pct =evaluation?.score && evaluation?.scoreMax
    ? (evaluation.score / evaluation.scoreMax)* 100
    : 0;
  console.log(evaluation);
console.log(evaluation?.dateUpdate);

  const downloadPDF = async () => {
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas"); //takes a screenshot of the certRef div
      const { default: jsPDF }       = await import("jspdf"); //creates epmty PDF
      await new Promise(res => setTimeout(res, 300));
      const canvas = await html2canvas(certRef.current, {
        scale: 3, useCORS: true, logging: false,
      });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210);
      pdf.save(`Certificat_${nomOrganisme}.pdf`);
    } catch (e) {
      alert("Erreur export: " + e.message);
    } finally {
      setExporting(false);
    }
  };
const labelStyle = LABEL_STYLES[label] ?? { color: "#0d1b4b", description: label };


  return (
    <div>
      <AnimatePresence>
        <motion.div
            ref={certRef}
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -40 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{position: "relative",width: "100%",maxWidth: 900,aspectRatio: "297/210",overflow: "hidden"}}
        >
        {/* Clean PNG */}
        <img
          src="/certificat.png"
          alt="certificat"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }}
        />

        {/* Your real data overlaid at the exact positions */}

        {/* nomOrganisme + responsable */}
        <div style={{ ...txt, top: "33%", left: "33%", right: "3%", textAlign: "center",
            fontFamily: "'Dancing Script', cursive",fontSize: "clamp(16px, 2.8vw, 26px)", 
            lineHeight: 1.1,maxWidth:"1000px",width: "50%",marginLeft:"-75px"                     
}}>
          <em>{nomOrganisme}</em>, représenté par <em>{nomResponsable}</em>,
        </div>

        {/* secteur */}
        <div style={{ ...txt, top: "39%", left: "33%", right: "3%", textAlign: "center",
            fontFamily: "'Dancing Script', cursive",fontSize: "clamp(16px, 2.8vw, 26px)", 
            lineHeight: 1.1,marginRight:"250px",maxWidth:"1000px",marginLeft:"-62px",width: "50%"
        }}>
          opérant dans le secteur <em>{secteur}</em>
        </div>

        {/* label */}
        <div style={{ ...txt, top: "63.3%", left: "46%", fontFamily: "sans-serif",
          fontSize: "clamp(17px, 2.2vw, 24px)" }}>
          <span style={{ color: labelStyle.color, fontWeight: 700 }}>{label}</span>
        </div>

        {/* description */}
        <div style={{ ...txt, top: "69%", left: "20%", maxWidth: "50%",
          fontFamily: "Georgia, serif", fontStyle: "italic",
          fontSize: "clamp(8px, 1.2vw, 12px)", color: "#444",
          whiteSpace: "normal", lineHeight: 1.35 }}>
          {labelStyle.description}
        </div>

        {/* Date mis à jour */}
        <div style={{...txt,top: "83%",left: "26%",maxWidth: "50%",fontFamily: "'Poppins', sans-serif",
          fontSize: "clamp(10px, 1.1vw, 14px)",fontWeight: 500,color: "#334155",letterSpacing: "0.3px",
          background: "rgba(255,255,255,0.55)",padding: "4px 10px",borderRadius: "8px",
          whiteSpace: "nowrap",lineHeight: 1.2,}}>
          Date de création: {dateSoumission}
        </div>

        <div
  style={{
    ...txt,
    top: "69%",
    right: "10%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fontWeight: 600,
    fontSize: "20px",
    color: "#0d1b4b",
  }}
>
  {/* Score text */}
  <div>Score: {scoreDisplay}</div>

  {/* Ring directly under it */}
  {pct != null && (
    <div style={{ position: "relative", width: 88, height: 88 }}>
      <ProgressRing pct={pct} size={88} stroke={8} color={labelStyle.color} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "18px", fontWeight: "800", color: labelStyle.color }}>
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Rang */}
        <div style={{...txt,top: "-280%",left: "26%",width: "100%",fontFamily: "'Poppins', sans-serif",
          fontSize: "clamp(30px, 1.8vw, 22px)",fontWeight: 500,color: "#334155",letterSpacing: "0.3px",
          background: "rgba(255,255,255,0.55)",padding: "4px 10px",borderRadius: "8px",
          whiteSpace: "nowrap",lineHeight: 1.2,}}>
          🏆#{rangValue}/{totalOrganismes} 
        </div>
    </div>
  )}
</div>
      </motion.div>
      </AnimatePresence>

      <button
        onClick={downloadPDF}
        disabled={exporting}
        style={{
          marginTop: 16, padding: "11px 28px",
          background: exporting ? "#94a3b8" : "#c9a227",
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 600,
          cursor: exporting ? "not-allowed" : "pointer",
        }}
      >
        {exporting ? "Génération en cours…" : "⬇ Télécharger le certificat (PDF)"}
      </button>
    </div>
  );
}

const txt = {
  position: "absolute",
  color: "#0d1b4b",
  lineHeight: 1.4,
};