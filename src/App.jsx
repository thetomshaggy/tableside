import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

// ─── DATA ────────────────────────────────────────────────────────────────────

// Color palette pool for positions (cycles for new positions)
const COLOR_POOL = [
  { bg: "#3B2F6B", text: "#C4B5FD", dot: "#7C3AED", print: "#6D28D9" },
  { bg: "#1A3A2A", text: "#6EE7B7", dot: "#059669", print: "#047857" },
  { bg: "#3B2020", text: "#FCA5A5", dot: "#DC2626", print: "#B91C1C" },
  { bg: "#2A2A10", text: "#FDE68A", dot: "#D97706", print: "#B45309" },
  { bg: "#1A2F3A", text: "#93C5FD", dot: "#2563EB", print: "#1D4ED8" },
  { bg: "#2A1A3A", text: "#F9A8D4", dot: "#DB2777", print: "#BE185D" },
  { bg: "#1A3A38", text: "#67E8F9", dot: "#0891B2", print: "#0E7490" },
  { bg: "#3A2A1A", text: "#FED7AA", dot: "#EA580C", print: "#C2410C" },
];

const INITIAL_POSITIONS = [
  { name: "Bartender",   colorIdx: 0, wage: 18 },
  { name: "Server",      colorIdx: 1, wage: 12 },
  { name: "Busser",      colorIdx: 2, wage: 14 },
  { name: "Host",        colorIdx: 3, wage: 15 },
  { name: "Food Runner", colorIdx: 4, wage: 13 },
];

// Default weekly revenue budget target and labor cost % goal
const DEFAULT_BUDGET = { weeklyRevenue: 35000, laborPctGoal: 28 };

const DAYS      = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_AVAILABILITY = Object.fromEntries(DAYS.map((_, i) => [i, "available"]));

// Return the ISO date string (YYYY-MM-DD) for a given Date object
const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Get the Sunday-based weekStart for a given Date
const getWeekStart = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - dt.getDay()); // back to Sunday
  return dt;
};

// Return the 7 date strings [Sun...Sat] for the week containing weekStart
const weekDates = (weekStart) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000);
    return dateKey(d);
  });

const INITIAL_STAFF = [
  { id: 1,  name: "Jordan Lee",    role: "manager",  password: "manager1",      positions: ["Bartender","Server"],   availability: DEFAULT_AVAILABILITY },
  { id: 2,  name: "Maria Santos",  role: "manager",  password: "manager2",      positions: ["Server","Host"],         availability: DEFAULT_AVAILABILITY },
  { id: 3,  name: "Alex Kim",      role: "employee", password: "SwiftTable42",  positions: ["Bartender"],             availability: { 0:"preferred",1:"available",2:"preferred",3:"unavailable",4:"available",5:"preferred",6:"preferred" } },
  { id: 4,  name: "Sam Rivera",    role: "employee", password: "BoldPlate17",   positions: ["Server","Food Runner"],  availability: { 0:"available",1:"preferred",2:"available",3:"preferred",4:"unavailable",5:"available",6:"available" } },
  { id: 5,  name: "Casey Brown",   role: "employee", password: "CrispFlame83",  positions: ["Busser","Food Runner"],  availability: { 0:"available",1:"unavailable",2:"available",3:"available",4:"preferred",5:"preferred",6:"available" } },
  { id: 6,  name: "Taylor Nguyen", role: "employee", password: "SageGlass55",   positions: ["Host","Server"],         availability: { 0:"preferred",1:"available",2:"unavailable",3:"preferred",4:"available",5:"available",6:"preferred" } },
  { id: 7,  name: "Jamie Patel",   role: "employee", password: "ZestLemon29",   positions: ["Server","Busser"],       availability: DEFAULT_AVAILABILITY },
  { id: 8,  name: "Drew Martinez", role: "employee", password: "AmberKnife64",  positions: ["Bartender","Server"],    availability: { 0:"available",1:"preferred",2:"available",3:"available",4:"preferred",5:"preferred",6:"preferred" } },
  { id: 9,  name: "Riley Chen",    role: "employee", password: "NovaBasil38",   positions: ["Food Runner","Busser"],  availability: { 0:"preferred",1:"available",2:"preferred",3:"unavailable",4:"available",5:"available",6:"available" } },
  { id: 10, name: "Morgan Walsh",  role: "employee", password: "KeenSpoon91",   positions: ["Host","Server"],         availability: DEFAULT_AVAILABILITY },
];

// Seed shifts for the current week (Sun-based). Each shift stores a real date string.
const _seedWeekStart = (() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d; })();
const _sd = (offset) => { const d = new Date(_seedWeekStart.getTime() + offset * 86400000); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const day = String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; };

const INITIAL_SHIFTS = [
  { id: 1,  staffId: 3,  date: _sd(1), position: "Bartender",   start: "16:00", end: "23:00" },
  { id: 2,  staffId: 4,  date: _sd(1), position: "Server",      start: "17:00", end: "22:00" },
  { id: 3,  staffId: 5,  date: _sd(1), position: "Busser",      start: "17:00", end: "22:00" },
  { id: 4,  staffId: 6,  date: _sd(1), position: "Host",        start: "17:00", end: "22:00" },
  { id: 5,  staffId: 7,  date: _sd(2), position: "Server",      start: "11:00", end: "16:00" },
  { id: 6,  staffId: 8,  date: _sd(2), position: "Bartender",   start: "16:00", end: "23:00" },
  { id: 7,  staffId: 9,  date: _sd(2), position: "Food Runner", start: "17:00", end: "22:00" },
  { id: 8,  staffId: 10, date: _sd(2), position: "Host",        start: "17:00", end: "22:00" },
  { id: 9,  staffId: 3,  date: _sd(3), position: "Bartender",   start: "16:00", end: "23:00" },
  { id: 10, staffId: 4,  date: _sd(3), position: "Server",      start: "17:00", end: "22:00" },
  { id: 11, staffId: 6,  date: _sd(4), position: "Server",      start: "11:00", end: "16:00" },
  { id: 12, staffId: 7,  date: _sd(4), position: "Busser",      start: "17:00", end: "22:00" },
  { id: 13, staffId: 8,  date: _sd(5), position: "Bartender",   start: "16:00", end: "23:00" },
  { id: 14, staffId: 9,  date: _sd(5), position: "Food Runner", start: "17:00", end: "22:00" },
  { id: 15, staffId: 5,  date: _sd(6), position: "Busser",      start: "16:00", end: "23:00" },
  { id: 16, staffId: 10, date: _sd(6), position: "Host",        start: "16:00", end: "23:00" },
  { id: 17, staffId: 3,  date: _sd(6), position: "Bartender",   start: "16:00", end: "02:00" },
  { id: 18, staffId: 4,  date: _sd(6), position: "Server",      start: "16:00", end: "23:00" },
  { id: 19, staffId: 7,  date: _sd(0), position: "Server",      start: "10:00", end: "16:00" },
  { id: 20, staffId: 8,  date: _sd(0), position: "Bartender",   start: "16:00", end: "02:00" },
  { id: 21, staffId: 9,  date: _sd(0), position: "Food Runner", start: "16:00", end: "23:00" },
  { id: 22, staffId: 6,  date: _sd(0), position: "Host",        start: "16:00", end: "23:00" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const ADJECTIVES = ["Swift","Amber","Crisp","Bold","Sage","Calm","Zest","Brisk","Nova","Keen"];
const NOUNS      = ["Table","Plate","Spoon","Glass","Flame","Knife","Lemon","Basil","Clove","Thyme"];
const generatePassword = () => {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(10 + Math.random() * 90);
  return `${adj}${noun}${num}`;
};

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const fmtMoney = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoneyK = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

const shiftHours = (s) => {
  const [sh, sm] = s.start.split(":").map(Number);
  let [eh, em] = s.end.split(":").map(Number);
  if (eh < sh) eh += 24;
  return (eh + em / 60) - (sh + sm / 60);
};

const initials = (name) => name.split(" ").map(n => n[0]).join("").toUpperCase();

let nextId = 100;
const uid = () => ++nextId;

const AVAIL_CONFIG = {
  preferred:   { label: "Preferred",   color: "#059669", bg: "#05966918", icon: "★" },
  available:   { label: "Available",   color: "#888",    bg: "#88888818", icon: "✓" },
  unavailable: { label: "Unavailable", color: "#DC2626", bg: "#DC262618", icon: "✗" },
};

// ─── PRINT ────────────────────────────────────────────────────────────────────

function printSchedule({ shifts, staff, weekLabel, POSITIONS, POSITION_COLORS, weekStart }) {
  const getStaff = (id) => staff.find(s => s.id === id);
  const posClass = (pos) => ({ Bartender:"bart", Server:"serv", Busser:"buss", Host:"host", "Food Runner":"runner" }[pos] || "");
  const wDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000);
    const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const day = String(d.getDate()).padStart(2,"0");
    return { key: `${y}-${m}-${day}`, label: DAYS[i], date: d.getDate() };
  });
  const html = `<!DOCTYPE html><html><head><title>Tableside Schedule – ${weekLabel}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;color:#111;background:#fff;padding:28px}
.hdr{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:20px}
.brand{font-family:'DM Serif Display',serif;font-size:26px;letter-spacing:.08em}.brand span{color:#B45309}
.week-lbl{font-size:12px;color:#555;margin-top:3px}.gen{font-size:10px;color:#999}
.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:20px}
.dc{border:1px solid #ddd;border-radius:6px;overflow:hidden}
.dh{background:#f5f5f5;padding:5px 8px;border-bottom:1px solid #ddd}
.dn{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#555}
.ds{padding:5px;display:flex;flex-direction:column;gap:4px;min-height:70px}
.sc{border-radius:4px;padding:5px 6px;border-left:3px solid}
.sp{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:1px}
.sn{font-size:11px;font-weight:600;margin-bottom:1px}.st{font-size:9px;color:#777}
.empty{font-size:9px;color:#ccc;font-style:italic;padding:6px 0;text-align:center}
.bart{border-color:#6D28D9;background:#f5f3ff}.bart .sp{color:#6D28D9}
.serv{border-color:#047857;background:#ecfdf5}.serv .sp{color:#047857}
.buss{border-color:#B91C1C;background:#fef2f2}.buss .sp{color:#B91C1C}
.host{border-color:#B45309;background:#fffbeb}.host .sp{color:#B45309}
.runner{border-color:#1D4ED8;background:#eff6ff}.runner .sp{color:#1D4ED8}
.sum-title{font-family:'DM Serif Display',serif;font-size:15px;margin-bottom:8px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:18px}
th{background:#f5f5f5;padding:5px 8px;text-align:left;border:1px solid #ddd;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#555}
td{padding:5px 8px;border:1px solid #eee;vertical-align:top}tr:nth-child(even) td{background:#fafafa}
.legend{display:flex;gap:14px;flex-wrap:wrap;padding-top:14px;border-top:1px solid #eee}
.li{display:flex;align-items:center;gap:5px;font-size:10px}.ld{width:9px;height:9px;border-radius:50%}
@media print{body{padding:12px}@page{margin:10mm;size:landscape}}
</style></head><body>
<div class="hdr"><div><div class="brand">🍽 <span>TABLESIDE</span></div><div class="week-lbl">Weekly Schedule: ${weekLabel}</div></div>
<div class="gen">Printed ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div></div>
<div class="grid">${wDates.map(({key, label, date})=>{
  const ds=shifts.filter(s=>s.date===key).sort((a,b)=>a.start.localeCompare(b.start));
  return `<div class="dc"><div class="dh"><div class="dn">${label} ${date}</div></div><div class="ds">
  ${ds.length===0?'<div class="empty">No shifts</div>':ds.map(s=>{const emp=getStaff(s.staffId);return`<div class="sc ${posClass(s.position)}"><div class="sp">${s.position}</div><div class="sn">${emp?.name||"—"}</div><div class="st">${fmt12(s.start)} – ${fmt12(s.end)}</div></div>`;}).join("")}
  </div></div>`;}).join("")}</div>
<div class="sum-title">Staff Summary</div>
<table><thead><tr><th>Name</th>${wDates.map(({label,date})=>`<th>${label} ${date}</th>`).join("")}<th>Shifts</th><th>Est. Hrs</th></tr></thead>
<tbody>${staff.filter(s=>s.role==="employee").map(emp=>{
  const es=shifts.filter(s=>s.staffId===emp.id);
  const hrs=es.reduce((a,s)=>a+shiftHours(s),0);
  return`<tr><td><strong>${emp.name}</strong><br><span style="font-size:9px;color:#888">${emp.positions.join(", ")}</span></td>
  ${wDates.map(({key})=>{const ds=es.filter(s=>s.date===key);return`<td>${ds.map(s=>`<div style="font-size:9px">${s.position}<br>${fmt12(s.start)}–${fmt12(s.end)}</div>`).join("")||"–"}</td>`;}).join("")}
  <td style="text-align:center"><strong>${es.length}</strong></td><td style="text-align:center"><strong>${hrs.toFixed(1)}</strong></td></tr>`;
}).join("")}</tbody></table>
<div class="legend">${POSITIONS.map(p=>`<div class="li"><div class="ld" style="background:${POSITION_COLORS[p].print}"></div><span>${p}</span></div>`).join("")}</div>
<script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
}

// ─── LABOR COST CALCULATIONS ─────────────────────────────────────────────────

function calcLaborCosts(shifts, staff, wages, POSITIONS) {
  // Group by date, sorted
  const allDates = [...new Set(shifts.map(s => s.date))].sort();
  const byDay = allDates.map(date => {
    const dayShifts = shifts.filter(s => s.date === date);
    const cost = dayShifts.reduce((acc, s) => acc + shiftHours(s) * (wages[s.position] || 0), 0);
    const hours = dayShifts.reduce((acc, s) => acc + shiftHours(s), 0);
    const d = new Date(date + "T00:00:00");
    const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { day: label, date, cost, hours, shifts: dayShifts.length };
  });

  const byPosition = POSITIONS.map(p => {
    const posShifts = shifts.filter(s => s.position === p);
    const hours = posShifts.reduce((acc, s) => acc + shiftHours(s), 0);
    const cost = hours * (wages[p] || 0);
    return { position: p, hours, cost, shifts: posShifts.length, wage: wages[p] || 0 };
  });

  const byEmployee = staff.filter(s => s.role === "employee").map(emp => {
    const empShifts = shifts.filter(s => s.staffId === emp.id);
    const hours = empShifts.reduce((acc, s) => acc + shiftHours(s), 0);
    const cost = empShifts.reduce((acc, s) => acc + shiftHours(s) * (wages[s.position] || 0), 0);
    return { ...emp, hours, cost, shifts: empShifts.length };
  }).sort((a, b) => b.cost - a.cost);

  const totalCost = shifts.reduce((acc, s) => acc + shiftHours(s) * (wages[s.position] || 0), 0);
  const totalHours = shifts.reduce((acc, s) => acc + shiftHours(s), 0);

  return { byDay, byPosition, byEmployee, totalCost, totalHours };
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [shifts, setShifts] = useState(INITIAL_SHIFTS);
  const [requests, setRequests] = useState([]);
  const [positions, setPositions] = useState(INITIAL_POSITIONS); // { name, colorIdx, wage }
  const [view, setView] = useState("schedule");
  const [shiftModal, setShiftModal] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [availModal, setAvailModal] = useState(false);
  const [filterPos, setFilterPos] = useState("All");
  const [weekOffset, setWeekOffset] = useState(0);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);

  // Derived from positions state — used everywhere that used to use POSITIONS/POSITION_COLORS/wages
  const POSITIONS = positions.map(p => p.name);
  const POSITION_COLORS = Object.fromEntries(positions.map(p => [p.name, COLOR_POOL[p.colorIdx % COLOR_POOL.length]]));
  const wages = Object.fromEntries(positions.map(p => [p.name, p.wage]));


  const [changePasswordModal, setChangePasswordModal] = useState(false);

  if (!currentUser) return <LoginScreen staff={staff} onLogin={setCurrentUser} />;

  const isManager = currentUser.role === "manager";

  const handleChangePassword = (newPassword, email) => {
    const updated = { ...currentUser, password: newPassword, mustChangePassword: false, ...(email !== undefined ? { email } : {}) };
    setStaff(s => s.map(x => x.id === currentUser.id ? updated : x));
    setCurrentUser(updated);
    setChangePasswordModal(false);
  };

  // Force password change on first login
  if (currentUser.mustChangePassword) {
    return <ForceChangePasswordScreen currentUser={currentUser} onSave={handleChangePassword} />;
  }

  const pendingCount = requests.filter(r =>
    r.status === "pending" && (
      isManager ||
      r.staffId === currentUser.id ||
      r.targetStaffId === currentUser.id
    )
  ).length;

  const today = new Date();
  const weekStart = getWeekStart(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  const weekLabel =
    weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" }) + " – " +
    weekEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const currentWeekDates = weekDates(weekStart);

  const handleAddShift    = (s) => { setShifts(p => [...p, { ...s, id: uid() }]); setShiftModal(null); };
  const handleEditShift   = (s) => { setShifts(p => p.map(x => x.id === s.id ? s : x)); setShiftModal(null); };
  const handleDeleteShift = (id) => { setShifts(p => p.filter(x => x.id !== id)); setShiftModal(null); };

  // Staff management
  const handleAddStaff = (member) => {
    const password = generatePassword();
    const newMember = { ...member, id: uid(), availability: DEFAULT_AVAILABILITY, password, mustChangePassword: true };
    setStaff(s => [...s, newMember]);
    return newMember;
  };
  const handleEditStaff = (member) => {
    setStaff(s => s.map(x => x.id === member.id ? member : x));
    // If the logged-in manager edited their own record, update currentUser too
    if (member.id === currentUser.id) setCurrentUser(member);
  };
  const handleRemoveStaff = (id) => {
    setStaff(s => s.filter(x => x.id !== id));
    setShifts(s => s.filter(x => x.staffId !== id));
    setRequests(r => r.filter(x => x.staffId !== id && x.targetStaffId !== id));
  };

  // Position management
  const handleAddPosition = (pos) => setPositions(p => [...p, pos]);
  const handleEditPosition = (updated) => {
    setPositions(p => p.map(x => x.name === updated.name ? updated : x));
    // If name changed, update shifts and staff positions arrays
    if (updated._oldName && updated._oldName !== updated.name) {
      setShifts(s => s.map(x => x.position === updated._oldName ? { ...x, position: updated.name } : x));
      setStaff(s => s.map(x => ({ ...x, positions: x.positions.map(p => p === updated._oldName ? updated.name : p) })));
    }
  };
  const handleRemovePosition = (name) => {
    setPositions(p => p.filter(x => x.name !== name));
    setShifts(s => s.filter(x => x.position !== name));
    setStaff(s => s.map(x => ({ ...x, positions: x.positions.filter(p => p !== name) })));
    if (filterPos === name) setFilterPos("All");
  };

  const handleSubmitRequest = (req) => {
    setRequests(r => [...r, { ...req, id: uid(), status: "pending", createdAt: new Date().toISOString() }]);
    setRequestModal(null);
  };

  const handleApproveRequest = (id) => {
    const req = requests.find(r => r.id === id);
    if (req?.type === "trade") {
      setShifts(s => s.map(x => {
        if (x.id === req.shiftId)       return { ...x, staffId: req.targetStaffId };
        if (x.id === req.targetShiftId) return { ...x, staffId: req.staffId };
        return x;
      }));
    } else if (req?.type === "timeoff") {
      // Remove shifts on the exact requested dates for this employee
      setShifts(s => s.filter(x => !(x.staffId === req.staffId && (req.dates || []).includes(x.date))));
    }
    setRequests(r => r.map(x => x.id === id ? { ...x, status: "approved" } : x));
  };
  const handleDenyRequest = (id) => setRequests(r => r.map(x => x.id === id ? { ...x, status: "denied" } : x));
  const handleSaveAvailability = (availability) => {
    setStaff(s => s.map(x => x.id === currentUser.id ? { ...x, availability } : x));
    setAvailModal(false);
  };

  const myShifts = shifts.filter(s => currentWeekDates.includes(s.date) && s.staffId === currentUser.id);
  const myAvailability = staff.find(s => s.id === currentUser.id)?.availability || DEFAULT_AVAILABILITY;

  const navItems = [
    { key: "schedule",      label: "Schedule",     icon: "📅" },
    { key: "mySchedule",    label: "My Week",      icon: "👤" },
    { key: "requests",      label: "Requests",     icon: "📋", badge: pendingCount },
    ...(isManager ? [
      { key: "staff",        label: "Staff",        icon: "👥" },
      { key: "availability", label: "Availability", icon: "🗓" },
      { key: "labor",        label: "Labor Cost",   icon: "📊" },
    ] : []),
  ];

  return (
    <div style={S.app}>
      <style>{globalStyles}</style>

      <header style={S.header}>
        <div style={S.logo}>
          <span style={{ fontSize: "1.6rem" }}>🍽</span>
          <div>
            <div style={S.logoName}>TABLESIDE</div>
            <div style={S.logoSub}>Staff Scheduler</div>
          </div>
        </div>
        <nav style={S.nav}>
          {navItems.map(item => (
            <button key={item.key} style={{ ...S.navBtn, ...(view === item.key ? S.navBtnActive : {}) }} onClick={() => setView(item.key)}>
              <span>{item.icon}</span><span>{item.label}</span>
              {item.badge > 0 && <span style={S.badge}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={S.headerRight}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={S.avatar}>{initials(currentUser.name)}</div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: "500" }}>{currentUser.name}</div>
              <div style={{ fontSize: "0.68rem", color: "#666", textTransform: "capitalize" }}>{currentUser.role}</div>
              {currentUser.email && <div style={{ fontSize: "0.65rem", color: "#444" }}>{currentUser.email}</div>}
            </div>
          </div>
          {!isManager && <button style={S.greenChipBtn} onClick={() => setAvailModal(true)}>🗓 Availability</button>}
          <button style={S.ghostBtn} onClick={() => setChangePasswordModal(true)}>🔑 Password</button>
          <button style={S.ghostBtn} onClick={() => setCurrentUser(null)}>Sign out</button>
        </div>
      </header>

      <main style={{ flex: 1, overflow: "auto" }}>
        {view === "schedule" && (
          <ScheduleView shifts={shifts} staff={staff} isManager={isManager}
            POSITIONS={POSITIONS} POSITION_COLORS={POSITION_COLORS}
            filterPos={filterPos} setFilterPos={setFilterPos}
            weekOffset={weekOffset} setWeekOffset={setWeekOffset}
            weekLabel={weekLabel} weekStart={weekStart} today={today}
            currentWeekDates={currentWeekDates}
            requests={requests}
            onAddShift={(date) => setShiftModal({ mode: "add", date })}
            onEditShift={(shift) => setShiftModal({ mode: "edit", shift })}
            onPrint={() => printSchedule({ shifts: shifts.filter(s => currentWeekDates.includes(s.date)), staff, weekLabel, POSITIONS, POSITION_COLORS, weekStart })} />
        )}
        {view === "mySchedule" && (
          <MyScheduleView shifts={myShifts} currentUser={currentUser} requests={requests}
            availability={myAvailability} POSITION_COLORS={POSITION_COLORS}
            weekLabel={weekLabel} currentWeekDates={currentWeekDates}
            onRequestTimeOff={() => setRequestModal({ type: "timeoff" })}
            onRequestTrade={(shift) => setRequestModal({ type: "trade", shift })}
            onEditAvailability={() => setAvailModal(true)} />
        )}
        {view === "requests" && (
          <RequestsView requests={requests} staff={staff} shifts={shifts}
            currentUser={currentUser} isManager={isManager}
            onApprove={handleApproveRequest} onDeny={handleDenyRequest} />
        )}
        {view === "staff" && isManager && (
          <StaffManagementView
            staff={staff} positions={positions} POSITION_COLORS={POSITION_COLORS}
            COLOR_POOL={COLOR_POOL}
            onAddStaff={handleAddStaff}
            onEditStaff={handleEditStaff}
            onRemoveStaff={handleRemoveStaff}
            onAddPosition={handleAddPosition}
            onEditPosition={handleEditPosition}
            onRemovePosition={handleRemovePosition}
          />
        )}
        {view === "availability" && isManager && <AvailabilityOverview staff={staff} POSITION_COLORS={POSITION_COLORS} />}
        {view === "labor" && isManager && (
          <LaborCostView shifts={shifts} staff={staff} positions={positions} setPositions={setPositions}
            POSITIONS={POSITIONS} POSITION_COLORS={POSITION_COLORS} wages={wages}
            budget={budget} setBudget={setBudget} weekLabel={weekLabel} />
        )}
      </main>

      {shiftModal && (
        <ShiftModal mode={shiftModal.mode} shift={shiftModal.shift} date={shiftModal.date} staff={staff}
          POSITIONS={POSITIONS} POSITION_COLORS={POSITION_COLORS}
          currentWeekDates={currentWeekDates}
          onSave={shiftModal.mode === "add" ? handleAddShift : handleEditShift}
          onDelete={handleDeleteShift} onClose={() => setShiftModal(null)} />
      )}
      {requestModal && (
        <RequestModal type={requestModal.type} shift={requestModal.shift}
          currentUser={currentUser} shifts={shifts} staff={staff}
          onSubmit={handleSubmitRequest} onClose={() => setRequestModal(null)} />
      )}
      {availModal && (
        <AvailabilityModal staffMember={staff.find(s => s.id === currentUser.id)}
          onSave={handleSaveAvailability} onClose={() => setAvailModal(false)} />
      )}
      {changePasswordModal && (
        <ChangePasswordModal currentUser={currentUser} onSave={handleChangePassword} onClose={() => setChangePasswordModal(false)} />
      )}
    </div>
  );
}

// ─── LABOR COST VIEW ─────────────────────────────────────────────────────────

function LaborCostView({ shifts, staff, positions, setPositions, POSITIONS, POSITION_COLORS, wages, budget, setBudget, weekLabel }) {
  const [activeTab, setActiveTab] = useState("overview");

  const labor = useMemo(() => calcLaborCosts(shifts, staff, wages, POSITIONS), [shifts, staff, wages, POSITIONS]);
  const laborPct = budget.weeklyRevenue > 0 ? (labor.totalCost / budget.weeklyRevenue) * 100 : 0;
  const laborGoalCost = (budget.weeklyRevenue * budget.laborPctGoal) / 100;
  const overBudget = labor.totalCost > laborGoalCost;
  const variance = labor.totalCost - laborGoalCost;

  const PIE_COLORS = POSITIONS.map(p => POSITION_COLORS[p]?.dot || "#888");

  const [editingBudget, setEditingBudget] = useState(false);
  const [draftBudget, setDraftBudget] = useState(budget);

  return (
    <div style={S.viewWrap}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.6rem" }}>Labor Cost Analysis</h2>
          <p style={{ fontSize: "0.82rem", color: "#555", marginTop: "4px" }}>{weekLabel}</p>
        </div>
        <button style={{ ...S.ghostBtn, display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px" }}
          onClick={() => { setDraftBudget(budget); setEditingBudget(true); }}>
          ⚙ Budget Settings
        </button>
      </div>

      {/* KPI Cards */}
      <div style={LC.kpiRow}>
        <KpiCard label="Total Labor Cost" value={fmtMoney(labor.totalCost)} sub={`${labor.totalHours.toFixed(1)} total hours`} accent="#F59E0B" icon="💵" />
        <KpiCard label="Labor Cost %" value={`${laborPct.toFixed(1)}%`}
          sub={`Goal: ${budget.laborPctGoal}%`}
          accent={overBudget ? "#DC2626" : "#059669"}
          icon={overBudget ? "⚠" : "✓"}
          highlight={overBudget ? "#DC262618" : "#05966918"} />
        <KpiCard label="Budget Target" value={fmtMoney(laborGoalCost)}
          sub={`of ${fmtMoney(budget.weeklyRevenue)} revenue`}
          accent="#7C3AED" icon="🎯" />
        <KpiCard label="Variance"
          value={(overBudget ? "+" : "") + fmtMoney(variance)}
          sub={overBudget ? "over budget" : "under budget"}
          accent={overBudget ? "#DC2626" : "#059669"}
          icon={overBudget ? "📈" : "📉"}
          highlight={overBudget ? "#DC262612" : "#05966912"} />
      </div>

      {/* Budget progress bar */}
      <div style={LC.progressWrap}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.78rem", color: "#666" }}>Labor spend vs. goal</span>
          <span style={{ fontSize: "0.78rem", fontWeight: "600", color: overBudget ? "#FCA5A5" : "#6EE7B7" }}>
            {fmtMoney(labor.totalCost)} / {fmtMoney(laborGoalCost)}
          </span>
        </div>
        <div style={LC.progressTrack}>
          <div style={{ ...LC.progressFill, width: `${Math.min((labor.totalCost / laborGoalCost) * 100, 100)}%`, background: overBudget ? "#DC2626" : "#059669" }} />
          <div style={{ ...LC.progressGoalLine, left: "100%" }} title="Budget goal" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
          <span style={{ fontSize: "0.7rem", color: "#444" }}>$0</span>
          <span style={{ fontSize: "0.7rem", color: "#444" }}>Goal: {fmtMoney(laborGoalCost)}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid #1A1A1A", paddingBottom: "0" }}>
        {[
          { key: "overview",  label: "📅 By Day" },
          { key: "position",  label: "🎭 By Position" },
          { key: "employee",  label: "👥 By Employee" },
        ].map(t => (
          <button key={t.key}
            style={{ ...LC.tab, ...(activeTab === t.key ? LC.tabActive : {}) }}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BY DAY ── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={LC.chartCard}>
            <div style={LC.chartTitle}>Daily Labor Cost</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={labor.byDay} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis dataKey="day" tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtMoneyK} tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #2A2A2A", borderRadius: "8px", fontSize: "0.8rem" }}
                  labelStyle={{ color: "#F5F0E8", fontWeight: 600 }}
                  formatter={(v, n) => [fmtMoney(v), "Labor Cost"]}
                />
                <Bar dataKey="cost" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={LC.chartCard}>
            <div style={LC.chartTitle}>Daily Hours Worked</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={labor.byDay} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis dataKey="day" tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #2A2A2A", borderRadius: "8px", fontSize: "0.8rem" }}
                  labelStyle={{ color: "#F5F0E8", fontWeight: 600 }}
                  formatter={(v) => [`${v.toFixed(1)} hrs`, "Hours"]}
                />
                <Bar dataKey="hours" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day breakdown table */}
          <div style={LC.tableCard}>
            <table style={LC.table}>
              <thead>
                <tr>
                  {["Day", "Shifts", "Hours", "Labor Cost", "Avg $/hr", "% of Week"].map(h => (
                    <th key={h} style={LC.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labor.byDay.map((row, i) => (
                  <tr key={i} style={i % 2 === 0 ? {} : { background: "#0A0A0A" }}>
                    <td style={LC.td}><strong style={{ color: "#F5F0E8" }}>{FULL_DAYS[i]}</strong></td>
                    <td style={LC.tdNum}>{row.shifts}</td>
                    <td style={LC.tdNum}>{row.hours.toFixed(1)}</td>
                    <td style={LC.tdNum}><strong style={{ color: "#F59E0B" }}>{fmtMoney(row.cost)}</strong></td>
                    <td style={LC.tdNum}>{row.hours > 0 ? fmtMoney(row.cost / row.hours) : "—"}</td>
                    <td style={{ ...LC.tdNum }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "4px", background: "#1A1A1A", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${labor.totalCost > 0 ? (row.cost / labor.totalCost) * 100 : 0}%`, height: "100%", background: "#F59E0B", borderRadius: "2px" }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#888", minWidth: "32px" }}>
                          {labor.totalCost > 0 ? ((row.cost / labor.totalCost) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "1px solid #2A2A2A" }}>
                  <td style={{ ...LC.td, color: "#888", fontSize: "0.75rem" }}><strong>TOTAL</strong></td>
                  <td style={LC.tdNum}><strong>{shifts.length}</strong></td>
                  <td style={LC.tdNum}><strong>{labor.totalHours.toFixed(1)}</strong></td>
                  <td style={LC.tdNum}><strong style={{ color: "#F59E0B" }}>{fmtMoney(labor.totalCost)}</strong></td>
                  <td style={LC.tdNum}>{labor.totalHours > 0 ? fmtMoney(labor.totalCost / labor.totalHours) : "—"}</td>
                  <td style={LC.tdNum}>100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── BY POSITION ── */}
      {activeTab === "position" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={LC.chartCard}>
              <div style={LC.chartTitle}>Cost by Position</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={labor.byPosition.filter(p => p.cost > 0)} dataKey="cost" nameKey="position"
                    cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                    paddingAngle={3}
                    label={({ position, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
                    labelLine={false}>
                    {labor.byPosition.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #2A2A2A", borderRadius: "8px", fontSize: "0.8rem" }}
                    formatter={(v) => [fmtMoney(v), "Cost"]} />
                  <Legend formatter={(v) => <span style={{ color: "#888", fontSize: "0.78rem" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={LC.chartCard}>
              <div style={LC.chartTitle}>Hours by Position</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={labor.byPosition} layout="vertical" margin={{ top: 4, right: 24, left: 70, bottom: 4 }}>
                  <XAxis type="number" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="position" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #2A2A2A", borderRadius: "8px", fontSize: "0.8rem" }}
                    formatter={(v) => [`${v.toFixed(1)} hrs`, "Hours"]} />
                  {labor.byPosition.map((entry, i) => null)}
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {labor.byPosition.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={LC.tableCard}>
            <table style={LC.table}>
              <thead>
                <tr>{["Position", "Hourly Rate", "Total Hours", "Total Cost", "# Shifts", "% of Labor"].map(h => <th key={h} style={LC.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {labor.byPosition.map((row, i) => (
                  <tr key={i} style={i % 2 === 0 ? {} : { background: "#0A0A0A" }}>
                    <td style={LC.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                        <strong style={{ color: "#F5F0E8" }}>{row.position}</strong>
                      </div>
                    </td>
                    <td style={LC.tdNum}><span style={{ color: "#F59E0B" }}>{fmtMoney(row.wage)}/hr</span></td>
                    <td style={LC.tdNum}>{row.hours.toFixed(1)}</td>
                    <td style={LC.tdNum}><strong style={{ color: "#F59E0B" }}>{fmtMoney(row.cost)}</strong></td>
                    <td style={LC.tdNum}>{row.shifts}</td>
                    <td style={{ ...LC.tdNum }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "6px", background: "#1A1A1A", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${labor.totalCost > 0 ? (row.cost / labor.totalCost) * 100 : 0}%`, height: "100%", background: PIE_COLORS[i], borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#888", minWidth: "32px" }}>
                          {labor.totalCost > 0 ? ((row.cost / labor.totalCost) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BY EMPLOYEE ── */}
      {activeTab === "employee" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={LC.chartCard}>
            <div style={LC.chartTitle}>Cost per Employee</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={labor.byEmployee.map(e => ({ name: e.name.split(" ")[0], cost: e.cost, hours: e.hours }))}
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtMoneyK} tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #2A2A2A", borderRadius: "8px", fontSize: "0.8rem" }}
                  labelStyle={{ color: "#F5F0E8", fontWeight: 600 }}
                  formatter={(v, n) => [n === "cost" ? fmtMoney(v) : `${v.toFixed(1)} hrs`, n === "cost" ? "Labor Cost" : "Hours"]} />
                <Bar dataKey="cost" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={LC.tableCard}>
            <table style={LC.table}>
              <thead>
                <tr>{["Employee", "Roles", "Shifts", "Hours", "Avg Wage", "Total Cost", "% of Labor"].map(h => <th key={h} style={LC.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {labor.byEmployee.map((emp, i) => {
                  const avgWage = emp.hours > 0 ? emp.cost / emp.hours : 0;
                  return (
                    <tr key={emp.id} style={i % 2 === 0 ? {} : { background: "#0A0A0A" }}>
                      <td style={LC.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <div style={{ ...S.avatar, width: "28px", height: "28px", fontSize: "0.7rem", flexShrink: 0 }}>{initials(emp.name)}</div>
                          <strong style={{ color: "#F5F0E8", fontSize: "0.85rem" }}>{emp.name}</strong>
                        </div>
                      </td>
                      <td style={LC.td}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {emp.positions.map(p => (
                            <span key={p} style={{ padding: "1px 7px", borderRadius: "10px", fontSize: "0.68rem", background: POSITION_COLORS[p].bg, color: POSITION_COLORS[p].text }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={LC.tdNum}>{emp.shifts}</td>
                      <td style={LC.tdNum}>{emp.hours.toFixed(1)}</td>
                      <td style={LC.tdNum}><span style={{ color: "#F59E0B" }}>{fmtMoney(avgWage)}/hr</span></td>
                      <td style={LC.tdNum}><strong style={{ color: "#F59E0B" }}>{fmtMoney(emp.cost)}</strong></td>
                      <td style={LC.tdNum}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "4px", background: "#1A1A1A", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ width: `${labor.totalCost > 0 ? (emp.cost / labor.totalCost) * 100 : 0}%`, height: "100%", background: "#7C3AED", borderRadius: "2px" }} />
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "#888", minWidth: "32px" }}>
                            {labor.totalCost > 0 ? ((emp.cost / labor.totalCost) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "1px solid #2A2A2A" }}>
                  <td style={{ ...LC.td, color: "#888", fontSize: "0.75rem" }} colSpan={2}><strong>TOTAL</strong></td>
                  <td style={LC.tdNum}><strong>{shifts.length}</strong></td>
                  <td style={LC.tdNum}><strong>{labor.totalHours.toFixed(1)}</strong></td>
                  <td style={LC.tdNum}>{labor.totalHours > 0 ? <span style={{ color: "#F59E0B" }}>{fmtMoney(labor.totalCost / labor.totalHours)}/hr</span> : "—"}</td>
                  <td style={LC.tdNum}><strong style={{ color: "#F59E0B" }}>{fmtMoney(labor.totalCost)}</strong></td>
                  <td style={LC.tdNum}>100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── BUDGET MODAL ── */}
      {editingBudget && (
        <div style={S.modalOverlay} onClick={() => setEditingBudget(false)}>
          <div style={{ ...S.modal, maxWidth: "420px" }} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>⚙ Budget Settings</h3>
              <button style={S.modalClose} onClick={() => setEditingBudget(false)}>✕</button>
            </div>
            <div style={S.modalBody}>
              <p style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.6 }}>Set your weekly revenue target and labor cost goal. To adjust hourly wages, go to <strong style={{ color: "#F5F0E8" }}>Staff → Positions</strong>.</p>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ ...S.formRow, flex: 1 }}>
                  <label style={S.formLabel}>Est. Weekly Revenue</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#555" }}>$</span>
                    <input type="number" min="0" step="500"
                      style={{ ...S.formInput, paddingLeft: "22px" }}
                      value={draftBudget.weeklyRevenue}
                      onChange={e => setDraftBudget(b => ({ ...b, weeklyRevenue: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div style={{ ...S.formRow, flex: 1 }}>
                  <label style={S.formLabel}>Labor Cost % Goal</label>
                  <div style={{ position: "relative" }}>
                    <input type="number" min="1" max="99" step="1"
                      style={{ ...S.formInput, paddingRight: "26px" }}
                      value={draftBudget.laborPctGoal}
                      onChange={e => setDraftBudget(b => ({ ...b, laborPctGoal: parseFloat(e.target.value) || 0 }))} />
                    <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#555" }}>%</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "10px 14px", background: "#0A0A0A", borderRadius: "8px", fontSize: "0.78rem", color: "#555", lineHeight: 1.5 }}>
                Current labor cost: <strong style={{ color: "#F59E0B" }}>{fmtMoney(labor.totalCost)}</strong> ({laborPct.toFixed(1)}% of revenue).
                Goal: <strong style={{ color: "#7C3AED" }}>{draftBudget.laborPctGoal}%</strong> → {fmtMoney((draftBudget.weeklyRevenue * draftBudget.laborPctGoal) / 100)}
              </div>
            </div>
            <div style={S.modalFooter}>
              <button style={S.cancelBtn} onClick={() => setEditingBudget(false)}>Cancel</button>
              <button style={S.saveBtn} onClick={() => { setBudget(draftBudget); setEditingBudget(false); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, accent, icon, highlight }) {
  return (
    <div style={{ ...LC.kpiCard, ...(highlight ? { background: highlight } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: "0.72rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        <span style={{ fontSize: "1.2rem" }}>{icon}</span>
      </div>
      <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.8rem", color: accent, lineHeight: 1.1, marginTop: "6px" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "5px" }}>{sub}</div>
    </div>
  );
}

// ─── STAFF MANAGEMENT VIEW ───────────────────────────────────────────────────

function StaffManagementView({ staff, positions, POSITION_COLORS, COLOR_POOL, onAddStaff, onEditStaff, onRemoveStaff, onAddPosition, onEditPosition, onRemovePosition }) {
  const [activeTab, setActiveTab] = useState("roster");
  const [staffModal, setStaffModal] = useState(null);
  const [posModal, setPosModal]   = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [newCredential, setNewCredential] = useState(null); // { name, password } shown after add
  const [copied, setCopied] = useState(false);

  const employees = staff.filter(s => s.role === "employee");
  const managers  = staff.filter(s => s.role === "manager");

  const handleCopyPassword = (pwd) => {
    navigator.clipboard.writeText(pwd).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={S.viewWrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.6rem" }}>Staff Management</h2>
          <p style={{ fontSize: "0.82rem", color: "#555", marginTop: "4px" }}>{staff.length} total members · {positions.length} positions</p>
        </div>
        <button style={S.saveBtn} onClick={() => activeTab === "roster" ? setStaffModal({ mode: "add" }) : setPosModal({ mode: "add" })}>
          + {activeTab === "roster" ? "Add Staff" : "Add Position"}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid #1A1A1A" }}>
        {[{ key: "roster", label: "👥 Roster" }, { key: "positions", label: "🎭 Positions" }].map(t => (
          <button key={t.key} style={{ ...LC.tab, ...(activeTab === t.key ? LC.tabActive : {}) }} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ROSTER TAB ── */}
      {activeTab === "roster" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Managers */}
          <div>
            <div style={{ fontSize: "0.72rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Managers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {managers.map(m => (
                <StaffRow key={m.id} member={m} POSITION_COLORS={POSITION_COLORS}
                  onEdit={() => setStaffModal({ mode: "edit", member: m })}
                  onRemove={null /* can't remove managers from this UI */} />
              ))}
            </div>
          </div>

          {/* Employees */}
          <div>
            <div style={{ fontSize: "0.72rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Employees ({employees.length})</div>
            {employees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#333", border: "1px dashed #1E1E1E", borderRadius: "10px" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>👤</div>
                <div>No employees yet. Add one to get started.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {employees.map(m => (
                  <StaffRow key={m.id} member={m} POSITION_COLORS={POSITION_COLORS}
                    onEdit={() => setStaffModal({ mode: "edit", member: m })}
                    onRemove={() => setConfirmRemove({ type: "staff", id: m.id, name: m.name })} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── POSITIONS TAB ── */}
      {activeTab === "positions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {positions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#333", border: "1px dashed #1E1E1E", borderRadius: "10px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🎭</div>
              <div>No positions defined. Add one to get started.</div>
            </div>
          ) : positions.map((pos, i) => {
            const c = COLOR_POOL[pos.colorIdx % COLOR_POOL.length];
            const staffWithPos = staff.filter(s => s.positions.includes(pos.name)).length;
            return (
              <div key={pos.name} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", background: "#0F0F0F", borderRadius: "10px", border: `1px solid ${c.dot}22` }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.92rem", fontWeight: "600", color: "#F5F0E8" }}>{pos.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "2px" }}>{staffWithPos} staff member{staffWithPos !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#555" }}>Hourly rate:</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#F59E0B" }}>${pos.wage.toFixed(2)}/hr</span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button style={S.ghostBtn} onClick={() => setPosModal({ mode: "edit", pos })}>Edit</button>
                  <button style={{ ...S.ghostBtn, color: "#FCA5A5", borderColor: "#DC262633" }}
                    onClick={() => setConfirmRemove({ type: "position", id: pos.name, name: pos.name })}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Add/Edit Modal */}
      {staffModal && (
        <StaffModal
          mode={staffModal.mode} member={staffModal.member}
          positions={positions} POSITION_COLORS={POSITION_COLORS}
          onSave={(m) => {
            if (staffModal.mode === "add") {
              const created = onAddStaff(m);
              setNewCredential({ name: created.name, password: created.password });
            } else {
              onEditStaff(m);
            }
            setStaffModal(null);
          }}
          onClose={() => setStaffModal(null)}
        />
      )}

      {/* Position Add/Edit Modal */}
      {posModal && (
        <PositionModal
          mode={posModal.mode} pos={posModal.pos}
          COLOR_POOL={COLOR_POOL} existingNames={positions.map(p => p.name)}
          onSave={(p) => { posModal.mode === "add" ? onAddPosition(p) : onEditPosition(p); setPosModal(null); }}
          onClose={() => setPosModal(null)}
        />
      )}

      {/* Confirm Remove Dialog */}
      {confirmRemove && (
        <div style={S.modalOverlay} onClick={() => setConfirmRemove(null)}>
          <div style={{ ...S.modal, maxWidth: "380px" }} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>Confirm Removal</h3>
              <button style={S.modalClose} onClick={() => setConfirmRemove(null)}>✕</button>
            </div>
            <div style={S.modalBody}>
              <p style={{ fontSize: "0.88rem", color: "#AAA", lineHeight: 1.6 }}>
                Are you sure you want to remove <strong style={{ color: "#F5F0E8" }}>{confirmRemove.name}</strong>?
                {confirmRemove.type === "staff"
                  ? " All their assigned shifts will also be removed."
                  : " All shifts using this position will be removed and staff will lose this role."}
              </p>
            </div>
            <div style={S.modalFooter}>
              <button style={S.cancelBtn} onClick={() => setConfirmRemove(null)}>Cancel</button>
              <button style={{ ...S.saveBtn, background: "#DC2626" }} onClick={() => {
                confirmRemove.type === "staff" ? onRemoveStaff(confirmRemove.id) : onRemovePosition(confirmRemove.id);
                setConfirmRemove(null);
              }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* New Staff Credential Reveal */}
      {newCredential && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modal, maxWidth: "420px" }} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>✅ Staff Member Added</h3>
            </div>
            <div style={S.modalBody}>
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <div style={{ ...S.avatar, width: "52px", height: "52px", fontSize: "1.1rem", margin: "0 auto 10px" }}>{initials(newCredential.name)}</div>
                <div style={{ fontSize: "1rem", fontWeight: "600", color: "#F5F0E8" }}>{newCredential.name}</div>
                <div style={{ fontSize: "0.78rem", color: "#555", marginTop: "3px" }}>has been added to the roster</div>
              </div>

              <div style={{ background: "#0A0A0A", borderRadius: "10px", border: "1px solid #2A2A2A", padding: "16px 18px" }}>
                <div style={{ fontSize: "0.68rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Login Credentials</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "#666" }}>Name</span>
                    <span style={{ fontSize: "0.88rem", fontWeight: "500", color: "#F5F0E8" }}>{newCredential.name}</span>
                  </div>
                  <div style={{ height: "1px", background: "#1A1A1A" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.78rem", color: "#666" }}>Password</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: "700", color: "#F59E0B", letterSpacing: "0.05em" }}>{newCredential.password}</span>
                      <button
                        style={{ ...S.ghostBtn, fontSize: "0.7rem", padding: "3px 8px", color: copied ? "#6EE7B7" : "#555", borderColor: copied ? "#05966933" : undefined }}
                        onClick={() => handleCopyPassword(newCredential.password)}>
                        {copied ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "10px 14px", background: "#F59E0B0A", borderRadius: "8px", border: "1px solid #F59E0B22", fontSize: "0.78rem", color: "#777", lineHeight: 1.6 }}>
                ⚠ Share this password with <strong style={{ color: "#F5F0E8" }}>{newCredential.name}</strong> directly. It won't be shown again.
              </div>
            </div>
            <div style={S.modalFooter}>
              <button style={S.saveBtn} onClick={() => setNewCredential(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffRow({ member, POSITION_COLORS, onEdit, onRemove }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "#0F0F0F", borderRadius: "9px", border: "1px solid #1A1A1A" }}>
      <div style={{ ...S.avatar, width: "36px", height: "36px", fontSize: "0.8rem", flexShrink: 0 }}>{initials(member.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#F5F0E8" }}>{member.name}</div>
        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap", alignItems: "center" }}>
          {member.positions.map(p => {
            const c = POSITION_COLORS[p] || { bg: "#1A1A1A", text: "#888", dot: "#555" };
            return <span key={p} style={{ padding: "1px 8px", borderRadius: "10px", fontSize: "0.68rem", background: c.bg, color: c.text }}>{p}</span>;
          })}
          {member.positions.length === 0 && <span style={{ fontSize: "0.72rem", color: "#333", fontStyle: "italic" }}>No positions assigned</span>}
        </div>
        {member.password && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
            <span style={{ fontSize: "0.68rem", color: "#333" }}>Password:</span>
            <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: showPw ? "#F59E0B" : "#2A2A2A", letterSpacing: showPw ? "0.05em" : "0.15em" }}>
              {showPw ? member.password : "••••••••••"}
            </span>
            <button style={{ ...S.ghostBtn, fontSize: "0.6rem", padding: "1px 6px", color: "#333" }} onClick={() => setShowPw(v => !v)}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        )}
      </div>
      <span style={{ fontSize: "0.72rem", color: "#444", textTransform: "capitalize", marginRight: "4px" }}>{member.role}</span>
      <div style={{ display: "flex", gap: "6px" }}>
        <button style={S.ghostBtn} onClick={onEdit}>Edit</button>
        {onRemove && <button style={{ ...S.ghostBtn, color: "#FCA5A5", borderColor: "#DC262633" }} onClick={onRemove}>Remove</button>}
      </div>
    </div>
  );
}

function StaffModal({ mode, member, positions, POSITION_COLORS, onSave, onClose }) {
  const [form, setForm] = useState(member || { name: "", role: "employee", positions: [], availability: DEFAULT_AVAILABILITY });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePos = (p) => set("positions", form.positions.includes(p) ? form.positions.filter(x => x !== p) : [...form.positions, p]);
  const valid = form.name.trim().length > 0;

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "460px" }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>{mode === "add" ? "Add Staff Member" : "Edit Staff Member"}</h3>
          <button style={S.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          <div style={S.formRow}>
            <label style={S.formLabel}>Full Name</label>
            <input style={S.formInput} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Alex Kim" />
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Role</label>
            <select style={S.formSelect} value={form.role} onChange={e => set("role", e.target.value)}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Positions (select all that apply)</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {positions.map(pos => {
                const c = POSITION_COLORS[pos.name] || { dot: "#555", bg: "#1A1A1A", text: "#888" };
                const selected = form.positions.includes(pos.name);
                return (
                  <button key={pos.name} onClick={() => togglePos(pos.name)}
                    style={{ padding: "5px 12px", borderRadius: "16px", border: `1px solid ${selected ? c.dot : "#2A2A2A"}`, background: selected ? c.bg : "transparent", color: selected ? c.text : "#555", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
                    {pos.name}
                  </button>
                );
              })}
              {positions.length === 0 && <span style={{ fontSize: "0.78rem", color: "#333", fontStyle: "italic" }}>No positions defined yet.</span>}
            </div>
          </div>
        </div>
        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.saveBtn, opacity: valid ? 1 : 0.4 }} disabled={!valid} onClick={() => onSave(form)}>
            {mode === "add" ? "Add Staff" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PositionModal({ mode, pos, COLOR_POOL, existingNames, onSave, onClose }) {
  const [name, setName] = useState(pos?.name || "");
  const [wage, setWage] = useState(pos?.wage ?? 15);
  const [colorIdx, setColorIdx] = useState(pos?.colorIdx ?? 0);
  const oldName = pos?.name;
  const nameConflict = existingNames.includes(name.trim()) && name.trim() !== oldName;
  const valid = name.trim().length > 0 && !nameConflict;

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "420px" }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>{mode === "add" ? "Add Position" : "Edit Position"}</h3>
          <button style={S.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          <div style={S.formRow}>
            <label style={S.formLabel}>Position Name</label>
            <input style={{ ...S.formInput, borderColor: nameConflict ? "#DC2626" : undefined }}
              value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sommelier" />
            {nameConflict && <span style={{ fontSize: "0.72rem", color: "#FCA5A5" }}>A position with this name already exists.</span>}
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Hourly Rate</label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#555" }}>$</span>
              <input type="number" min="7" max="200" step="0.5"
                style={{ ...S.formInput, flex: 1 }}
                value={wage} onChange={e => setWage(parseFloat(e.target.value) || 0)} />
              <span style={{ color: "#555", fontSize: "0.85rem" }}>/hr</span>
            </div>
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Color</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {COLOR_POOL.map((c, i) => (
                <button key={i} onClick={() => setColorIdx(i)}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.dot, border: colorIdx === i ? "3px solid #F5F0E8" : "3px solid transparent", cursor: "pointer", transition: "border 0.15s" }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", padding: "7px 12px", borderRadius: "7px", background: COLOR_POOL[colorIdx].bg }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLOR_POOL[colorIdx].dot }} />
              <span style={{ fontSize: "0.82rem", color: COLOR_POOL[colorIdx].text }}>{name || "Preview"}</span>
            </div>
          </div>
        </div>
        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.saveBtn, opacity: valid ? 1 : 0.4 }} disabled={!valid}
            onClick={() => onSave({ name: name.trim(), wage, colorIdx, _oldName: oldName })}>
            {mode === "add" ? "Add Position" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE VIEW ────────────────────────────────────────────────────────────

function ScheduleView({ shifts, staff, isManager, POSITIONS, POSITION_COLORS, filterPos, setFilterPos, weekOffset, setWeekOffset, weekLabel, weekStart, today, currentWeekDates, onAddShift, onEditShift, onPrint, requests }) {
  const filtered = filterPos === "All" ? shifts : shifts.filter(s => s.position === filterPos);
  const getStaff = (id) => staff.find(s => s.id === id);
  const todayKey = dateKey(today);

  return (
    <div style={S.viewWrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button style={S.weekNavBtn} onClick={() => setWeekOffset(w => w - 1)}>‹</button>
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1rem", color: "#F59E0B" }}>{weekLabel}</span>
          <button style={S.weekNavBtn} onClick={() => setWeekOffset(w => w + 1)}>›</button>
          {weekOffset !== 0 && <button style={S.chipBtn} onClick={() => setWeekOffset(0)}>Today</button>}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {["All", ...POSITIONS].map(p => (
            <button key={p} style={{ ...S.posFilterBtn, ...(filterPos === p ? { background: p === "All" ? "#F59E0B" : POSITION_COLORS[p]?.dot, color: "#0A0A0A", border: "none" } : {}) }} onClick={() => setFilterPos(p)}>{p}</button>
          ))}
          <button style={S.printBtn} onClick={onPrint}>🖨 Print</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "6px", marginBottom: "14px" }}>
        {currentWeekDates.map((dateStr, i) => {
          const ds = filtered.filter(s => s.date === dateStr).sort((a, b) => a.start.localeCompare(b.start));
          const isToday = dateStr === todayKey;
          const dateObj = new Date(dateStr + "T00:00:00");
          return (
            <div key={dateStr} style={{ ...S.dayCol, ...(isToday ? { border: "1px solid #F59E0B55" } : {}) }}>
              <div style={S.dayHeader}>
                <span style={S.dayName}>{DAYS[i]}</span>
                <span style={{ ...S.dayDate, ...(isToday ? { background: "#F59E0B", color: "#0A0A0A", fontWeight: "700" } : {}) }}>{dateObj.getDate()}</span>
              </div>
              <div style={{ padding: "6px", display: "flex", flexDirection: "column", gap: "5px" }}>
                {ds.length === 0 && <div style={{ fontSize: "0.72rem", color: "#2A2A2A", textAlign: "center", padding: "10px 0" }}>No shifts</div>}
                {ds.map(shift => {
                  const emp = getStaff(shift.staffId);
                  const c = POSITION_COLORS[shift.position];
                  const dow = new Date(dateStr + "T00:00:00").getDay(); // 0=Sun
                  const avail = emp?.availability?.[dow];
                  return (
                    <div key={shift.id} style={{ ...S.shiftCard, background: c.bg, border: `1px solid ${c.dot}22` }} onClick={() => isManager && onEditShift(shift)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", fontWeight: "600", marginBottom: "2px", color: c.text }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: c.dot, flexShrink: 0 }} />{shift.position}
                      </div>
                      <div style={{ fontSize: "0.78rem", fontWeight: "500", marginBottom: "2px" }}>{emp?.name || "—"}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "0.68rem", color: "#888" }}>{fmt12(shift.start)} – {fmt12(shift.end)}</div>
                        {isManager && avail && avail !== "available" && (
                          <span style={{ fontSize: "0.65rem", color: avail === "preferred" ? "#059669" : "#DC2626" }} title={`${emp?.name} is ${avail} this day`}>
                            {avail === "preferred" ? "★" : "⚠"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isManager && <button style={S.addShiftBtn} onClick={() => onAddShift(dateStr)}>+ Add Shift</button>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", padding: "12px 16px", background: "#0F0F0F", borderRadius: "9px", border: "1px solid #1E1E1E" }}>
        {POSITIONS.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: POSITION_COLORS[p].dot }} />
            <span style={{ fontSize: "0.75rem", color: "#555" }}>{p}</span>
            <span style={{ fontSize: "0.82rem", fontWeight: "600" }}>{shifts.filter(s => s.position === p).length}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.75rem", color: "#555" }}>Total shifts</span>
          <span style={{ fontSize: "1rem", fontWeight: "600" }}>{shifts.length}</span>
        </div>
      </div>
    </div>
  );
}

// ─── MY SCHEDULE VIEW ─────────────────────────────────────────────────────────

function MyScheduleView({ shifts, currentUser, requests, availability, POSITION_COLORS, weekLabel, currentWeekDates, onRequestTimeOff, onRequestTrade, onEditAvailability }) {
  const myRequests = requests.filter(r => r.staffId === currentUser.id || r.targetStaffId === currentUser.id);
  const totalHours = shifts.reduce((acc, s) => acc + shiftHours(s), 0);
  return (
    <div style={S.viewWrap}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "22px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.5rem" }}>My Schedule</h2>
          <p style={{ fontSize: "0.8rem", color: "#555", marginTop: "2px" }}>{weekLabel}</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "7px 18px", background: "#F59E0B11", borderRadius: "9px", border: "1px solid #F59E0B33" }}>
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.4rem", color: "#F59E0B", lineHeight: 1 }}>{totalHours.toFixed(1)}</span>
          <span style={{ fontSize: "0.68rem", color: "#888", marginTop: "2px" }}>hrs this week</span>
        </div>
        <button style={S.greenChipBtn} onClick={onEditAvailability}>🗓 Availability</button>
        <button style={{ ...S.saveBtn, background: "#7C3AED", padding: "9px 18px" }} onClick={onRequestTimeOff}>Request Time Off</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "22px" }}>
        {currentWeekDates.map((dateStr, i) => {
          const dayShifts = shifts.filter(s => s.date === dateStr);
          const dow = new Date(dateStr + "T00:00:00").getDay(); // 0=Sun
          const av = availability[dow] || "available";
          const ac = AVAIL_CONFIG[av];
          const dateObj = new Date(dateStr + "T00:00:00");
          const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
          return (
            <div key={dateStr} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "12px 16px", background: "#0F0F0F", borderRadius: "9px", border: "1px solid #1A1A1A" }}>
              <div style={{ width: "150px", flexShrink: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#888", marginBottom: "5px" }}>{dayLabel}</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: "500", background: ac.bg, color: ac.color }}>
                  {ac.icon} {ac.label}
                </span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                {dayShifts.length === 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "#2A2A2A", fontStyle: "italic" }}>Day Off</div>
                ) : dayShifts.map(shift => {
                  const c = POSITION_COLORS[shift.position];
                  return (
                    <div key={shift.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "#141414", borderRadius: "7px", borderLeft: `3px solid ${c.dot}` }}>
                      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: "600", color: c.text }}>{shift.position}</span>
                        <span style={{ fontSize: "0.8rem", color: "#888" }}>{fmt12(shift.start)} – {fmt12(shift.end)}</span>
                      </div>
                      <button style={S.ghostBtn} onClick={() => onRequestTrade(shift)}>Request Trade</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {myRequests.length > 0 && (
        <div>
          <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.1rem", marginBottom: "12px", color: "#888" }}>My Requests</h3>
          {myRequests.map(req => (
            <div key={req.id} style={{ ...S.reqCard, padding: "12px 16px", marginBottom: "8px" }}>
              <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
                <span style={{ ...S.reqTypeBadge, background: req.type === "timeoff" ? "#7C3AED22" : "#05966922", color: req.type === "timeoff" ? "#C4B5FD" : "#6EE7B7" }}>
                  {req.type === "timeoff" ? "🏖 Time Off" : "🔄 Trade"}
                </span>
                <span style={statusStyle(req.status)}>{req.status}</span>
              </div>
              {req.note && <div style={{ fontSize: "0.78rem", color: "#555", fontStyle: "italic", marginTop: "4px" }}>"{req.note}"</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AVAILABILITY OVERVIEW ────────────────────────────────────────────────────

function AvailabilityOverview({ staff, POSITION_COLORS }) {
  const employees = staff.filter(s => s.role === "employee");
  return (
    <div style={S.viewWrap}>
      <div style={{ marginBottom: "22px" }}>
        <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.5rem" }}>Team Availability</h2>
        <p style={{ fontSize: "0.82rem", color: "#555", marginTop: "4px" }}>Staff-submitted weekly availability. ★ Preferred · ✓ Available · ✗ Unavailable</p>
      </div>
      <div style={{ background: "#0F0F0F", borderRadius: "10px", border: "1px solid #1E1E1E", overflow: "hidden", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #1E1E1E", background: "#141414" }}>
          <div style={{ width: "220px", flexShrink: 0, fontSize: "0.7rem", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Member</div>
          {FULL_DAYS.map(d => <div key={d} style={{ flex: 1, textAlign: "center", fontSize: "0.7rem", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.slice(0,3)}</div>)}
          <div style={{ width: "70px", textAlign: "center", fontSize: "0.7rem", fontWeight: "600", color: "#555", textTransform: "uppercase" }}>Days</div>
        </div>
        {employees.map(emp => {
          const avCount = Object.values(emp.availability || {}).filter(v => v !== "unavailable").length;
          return (
            <div key={emp.id} style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #111" }}>
              <div style={{ width: "220px", flexShrink: 0, display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ ...S.avatar, width: "30px", height: "30px", fontSize: "0.72rem", flexShrink: 0 }}>{initials(emp.name)}</div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "500" }}>{emp.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#555" }}>{emp.positions.join(", ")}</div>
                </div>
              </div>
              {DAYS.map((_, i) => {
                const av = emp.availability?.[i] || "available";
                const ac = AVAIL_CONFIG[av];
                return (
                  <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", background: ac.bg, color: ac.color }} title={`${FULL_DAYS[i]}: ${ac.label}`}>{ac.icon}</div>
                  </div>
                );
              })}
              <div style={{ width: "70px", textAlign: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: avCount >= 5 ? "#6EE7B7" : avCount >= 3 ? "#FDE68A" : "#FCA5A5" }}>{avCount}/7</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {Object.entries(AVAIL_CONFIG).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", background: v.bg, color: v.color, fontSize: "0.82rem" }}>{v.icon}</div>
            <span style={{ fontSize: "0.8rem", color: "#666" }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AVAILABILITY MODAL ───────────────────────────────────────────────────────

function AvailabilityModal({ staffMember, onSave, onClose }) {
  const [avail, setAvail] = useState(staffMember?.availability || DEFAULT_AVAILABILITY);
  const states = ["preferred", "available", "unavailable"];
  const cycle = (i) => {
    const idx = states.indexOf(avail[i]);
    setAvail(a => ({ ...a, [i]: states[(idx + 1) % states.length] }));
  };
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>🗓 My Weekly Availability</h3>
          <button style={S.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          <p style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.6 }}>Let your manager know when you're available. Click each day to cycle between states.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {DAYS.map((day, i) => {
              const av = avail[i] || "available";
              const ac = AVAIL_CONFIG[av];
              return (
                <div key={day} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "90px", fontSize: "0.88rem", fontWeight: "500", color: "#AAA" }}>{FULL_DAYS[i]}</div>
                  <button onClick={() => cycle(i)} style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${ac.color}44`, background: ac.bg, color: ac.color, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", fontWeight: "500" }}>
                    <span style={{ fontSize: "1.1rem" }}>{ac.icon}</span>
                    <span>{ac.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.7rem", opacity: 0.6 }}>tap to change →</span>
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "10px 14px", background: "#0A0A0A", borderRadius: "8px", fontSize: "0.78rem", color: "#555", lineHeight: 1.5 }}>
            <strong style={{ color: "#777" }}>★ Preferred</strong> — Your best days. <strong style={{ color: "#777" }}>✗ Unavailable</strong> — Cannot work.
          </div>
        </div>
        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={S.saveBtn} onClick={() => onSave(avail)}>Save Availability</button>
        </div>
      </div>
    </div>
  );
}

// ─── REQUESTS VIEW ────────────────────────────────────────────────────────────

function RequestsView({ requests, staff, shifts, currentUser, isManager, onApprove, onDeny }) {
  const [tab, setTab] = useState("pending");
  const getStaffName = (id) => staff.find(s => s.id === id)?.name || "Unknown";
  const getShift = (id) => shifts.find(s => s.id === id);
  const visible = requests.filter(r => {
    if (!isManager && r.staffId !== currentUser.id && r.targetStaffId !== currentUser.id) return false;
    return tab === "pending" ? r.status === "pending" : r.status !== "pending";
  });
  return (
    <div style={S.viewWrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.5rem" }}>{isManager ? "Staff Requests" : "My Requests"}</h2>
        <div style={{ display: "flex", gap: "4px" }}>
          {["pending", "history"].map(t => (
            <button key={t} style={{ ...S.tabBtn, ...(tab === t ? S.tabBtnActive : {}) }} onClick={() => setTab(t)}>
              {t === "pending" ? "Pending" : "History"}
              {t === "pending" && requests.filter(r => r.status === "pending").length > 0 && <span style={S.badge}>{requests.filter(r => r.status === "pending").length}</span>}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#333" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📋</div>
          <div style={{ fontSize: "0.9rem" }}>{tab === "pending" ? "No pending requests" : "No history yet"}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visible.map(req => {
            const requester = getStaffName(req.staffId);
            const shift = req.shiftId ? getShift(req.shiftId) : null;
            const targetShift = req.targetShiftId ? getShift(req.targetShiftId) : null;
            return (
              <div key={req.id} style={S.reqCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ ...S.reqTypeBadge, background: req.type === "timeoff" ? "#7C3AED22" : "#05966922", color: req.type === "timeoff" ? "#C4B5FD" : "#6EE7B7" }}>
                      {req.type === "timeoff" ? "🏖 Time Off" : "🔄 Shift Trade"}
                    </span>
                    <span style={statusStyle(req.status)}>{req.status}</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#444" }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={S.reqAvatar}>{initials(requester)}</div>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: "600", marginBottom: "3px" }}>{requester}</div>
                      {req.type === "timeoff" && req.dates && <div style={{ fontSize: "0.78rem", color: "#777" }}>Requesting off: {req.dates.map(key => { const [y,m,d] = key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}); }).join(", ")}</div>}
                      {req.type === "trade" && shift && <div style={{ fontSize: "0.78rem", color: "#777" }}>Shift: {shift.date ? new Date(shift.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : ""} · {fmt12(shift.start)}–{fmt12(shift.end)} · {shift.position}</div>}
                      {req.note && <div style={{ fontSize: "0.78rem", color: "#555", fontStyle: "italic", marginTop: "4px" }}>"{req.note}"</div>}
                    </div>
                  </div>
                  {req.type === "trade" && req.targetStaffId && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "1.2rem", color: "#444" }}>⇄</span>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <div style={S.reqAvatar}>{initials(getStaffName(req.targetStaffId))}</div>
                        <div>
                          <div style={{ fontSize: "0.88rem", fontWeight: "600", marginBottom: "3px" }}>{getStaffName(req.targetStaffId)}</div>
                          {targetShift && <div style={{ fontSize: "0.78rem", color: "#777" }}>Shift: {targetShift.date ? new Date(targetShift.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : ""} · {fmt12(targetShift.start)}–{fmt12(targetShift.end)} · {targetShift.position}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {isManager && req.status === "pending" && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "14px", justifyContent: "flex-end" }}>
                    <button style={S.approveBtn} onClick={() => onApprove(req.id)}>✓ Approve</button>
                    <button style={S.denyBtn} onClick={() => onDeny(req.id)}>✗ Deny</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SHIFT MODAL ──────────────────────────────────────────────────────────────

function ShiftModal({ mode, shift, date, staff, POSITIONS, POSITION_COLORS, currentWeekDates, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(shift || { staffId: "", date: date ?? currentWeekDates[0], position: POSITIONS[0], start: "17:00", end: "22:00" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const eligible = staff.filter(s => s.positions.includes(form.position));
  const selectedEmp = eligible.find(s => s.id === Number(form.staffId));
  const dow = form.date ? new Date(form.date + "T00:00:00").getDay() : 0; // 0=Sun
  const empAvail = selectedEmp?.availability?.[dow];

  const fmtDateOption = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>{mode === "add" ? "Add Shift" : "Edit Shift"}</h3>
          <button style={S.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          <div style={S.formRow}>
            <label style={S.formLabel}>Date</label>
            <select style={S.formSelect} value={form.date} onChange={e => set("date", e.target.value)}>
              {currentWeekDates.map(d => (
                <option key={d} value={d}>{fmtDateOption(d)}</option>
              ))}
            </select>
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Position</label>
            <select style={S.formSelect} value={form.position} onChange={e => { set("position", e.target.value); set("staffId", ""); }}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>Staff Member</label>
            <select style={S.formSelect} value={form.staffId} onChange={e => set("staffId", Number(e.target.value))}>
              <option value="">— Select —</option>
              {eligible.map(s => {
                const av = s.availability?.[dow] || "available";
                return <option key={s.id} value={s.id}>{s.name}{av === "preferred" ? " ★" : av === "unavailable" ? " ✗" : ""}</option>;
              })}
            </select>
          </div>
          {empAvail && empAvail !== "available" && (
            <div style={{ padding: "8px 12px", borderRadius: "7px", background: AVAIL_CONFIG[empAvail].bg, color: AVAIL_CONFIG[empAvail].color, fontSize: "0.8rem", display: "flex", gap: "7px", alignItems: "center" }}>
              <span>{AVAIL_CONFIG[empAvail].icon}</span>
              <span>{selectedEmp.name} marked this day as <strong>{AVAIL_CONFIG[empAvail].label}</strong></span>
            </div>
          )}
          <div style={S.formRow}>
            <label style={S.formLabel}>Start Time</label>
            <input type="time" style={S.formInput} value={form.start} onChange={e => set("start", e.target.value)} />
          </div>
          <div style={S.formRow}>
            <label style={S.formLabel}>End Time</label>
            <input type="time" style={S.formInput} value={form.end} onChange={e => set("end", e.target.value)} />
          </div>
        </div>
        <div style={S.modalFooter}>
          {mode === "edit" && <button style={S.deleteBtn} onClick={() => onDelete(shift.id)}>Delete</button>}
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.saveBtn, opacity: form.staffId ? 1 : 0.4 }} disabled={!form.staffId} onClick={() => onSave(form)}>
            {mode === "add" ? "Add Shift" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REQUEST MODAL ────────────────────────────────────────────────────────────

// ─── CALENDAR PICKER (for time-off requests) ─────────────────────────────────

function CalendarPicker({ selectedDates, onChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const toKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toggleDate = (key) => {
    onChange(selectedDates.includes(key)
      ? selectedDates.filter(d => d !== key)
      : [...selectedDates, key].sort()
    );
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay  = new Date(viewYear, viewMonth + 1, 0);
  // Start grid on Monday
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(viewYear, viewMonth, d));

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div style={{ background: "#0A0A0A", borderRadius: "10px", border: "1px solid #2A2A2A", padding: "14px" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <button onClick={prevMonth} style={{ ...S.weekNavBtn, width: "26px", height: "26px", fontSize: "0.9rem" }}>‹</button>
        <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#F5F0E8" }}>{monthLabel}</span>
        <button onClick={nextMonth} style={{ ...S.weekNavBtn, width: "26px", height: "26px", fontSize: "0.9rem" }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "4px" }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", color: "#444", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 0" }}>{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const key = toKey(date);
          const isSelected = selectedDates.includes(key);
          const isToday = toKey(date) === toKey(today);
          const isPast = date < today;

          return (
            <button
              key={key}
              onClick={() => toggleDate(key)}
              style={{
                padding: "6px 2px",
                borderRadius: "6px",
                border: isToday && !isSelected ? "1px solid #F59E0B55" : "1px solid transparent",
                background: isSelected ? "#7C3AED" : isPast ? "transparent" : "#111",
                color: isSelected ? "#F5F0E8" : isPast ? "#333" : isToday ? "#F59E0B" : "#AAA",
                cursor: isPast ? "default" : "pointer",
                fontSize: "0.8rem",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: isSelected ? "600" : "400",
                textAlign: "center",
                transition: "all 0.1s",
                opacity: isPast ? 0.4 : 1,
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Selected count summary */}
      {selectedDates.length > 0 && (
        <div style={{ marginTop: "12px", padding: "8px 10px", background: "#7C3AED18", borderRadius: "7px", border: "1px solid #7C3AED33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color: "#C4B5FD" }}>
            {selectedDates.length} day{selectedDates.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => onChange([])}
            style={{ background: "none", border: "none", color: "#7C3AED", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans',sans-serif" }}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ─── REQUEST MODAL ────────────────────────────────────────────────────────────

function RequestModal({ type, shift, currentUser, shifts, staff, onSubmit, onClose }) {
  const [selectedDates, setSelectedDates] = useState([]); // array of "YYYY-MM-DD" strings
  const [note, setNote] = useState("");
  const [targetStaffId, setTargetStaffId] = useState("");
  const [targetShiftId, setTargetShiftId] = useState("");

  const eligible = shifts.filter(s => s.staffId !== currentUser.id && (targetStaffId ? s.staffId === Number(targetStaffId) : true));
  const valid = type === "timeoff" ? selectedDates.length > 0 : (targetStaffId && targetShiftId);

  const fmtDateKey = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: type === "timeoff" ? "480px" : "460px" }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>{type === "timeoff" ? "🏖 Request Time Off" : "🔄 Request Shift Trade"}</h3>
          <button style={S.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          {type === "timeoff" ? (
            <>
              <div style={S.formRow}>
                <label style={S.formLabel}>Select dates to request off</label>
                <CalendarPicker selectedDates={selectedDates} onChange={setSelectedDates} />
              </div>
              {selectedDates.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {selectedDates.map(key => (
                    <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 9px", borderRadius: "12px", background: "#7C3AED22", color: "#C4B5FD", border: "1px solid #7C3AED44", fontSize: "0.75rem" }}>
                      {fmtDateKey(key)}
                      <button onClick={() => setSelectedDates(d => d.filter(x => x !== key))}
                        style={{ background: "none", border: "none", color: "#7C3AED", cursor: "pointer", fontSize: "0.8rem", lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={S.formRow}>
                <label style={S.formLabel}>Your shift</label>
                <div style={{ background: "#0A0A0A", color: "#777", border: "1px solid #1A1A1A", borderRadius: "7px", padding: "8px 11px", fontSize: "0.8rem" }}>
                  {shift && `${shift.date ? new Date(shift.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}) : ""} · ${fmt12(shift.start)} – ${fmt12(shift.end)} · ${shift.position}`}
                </div>
              </div>
              <div style={S.formRow}>
                <label style={S.formLabel}>Trade with</label>
                <select style={S.formSelect} value={targetStaffId} onChange={e => { setTargetStaffId(e.target.value); setTargetShiftId(""); }}>
                  <option value="">— Select coworker —</option>
                  {staff.filter(s => s.id !== currentUser.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {targetStaffId && (
                <div style={S.formRow}>
                  <label style={S.formLabel}>Their shift to swap</label>
                  <select style={S.formSelect} value={targetShiftId} onChange={e => setTargetShiftId(e.target.value)}>
                    <option value="">— Select shift —</option>
                    {eligible.map(s => <option key={s.id} value={s.id}>{s.date ? new Date(s.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : ""} · {fmt12(s.start)}–{fmt12(s.end)} · {s.position}</option>)}
                  </select>
                </div>
              )}
            </>
          )}
          <div style={S.formRow}>
            <label style={S.formLabel}>Note (optional)</label>
            <textarea style={S.formTextarea} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a reason..." rows={2} />
          </div>
        </div>
        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.saveBtn, opacity: valid ? 1 : 0.4 }} disabled={!valid}
            onClick={() => onSubmit({ staffId: currentUser.id, type, note, ...(type === "timeoff" ? { dates: selectedDates } : { shiftId: shift.id, targetStaffId: Number(targetStaffId), targetShiftId: Number(targetShiftId) }) })}>
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FORCE CHANGE PASSWORD SCREEN ────────────────────────────────────────────

function ForceChangePasswordScreen({ currentUser, onSave }) {
  const [email, setEmail]         = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailInvalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const tooShort     = newPw.length > 0 && newPw.length < 8;
  const mismatch     = confirmPw.length > 0 && newPw !== confirmPw;
  const valid        = email.length > 0 && !emailInvalid && newPw.length >= 8 && newPw === confirmPw;

  const pwScore = Math.min(4, Math.floor(newPw.length / 3));
  const pwColor = pwScore <= 1 ? "#DC2626" : pwScore === 2 ? "#F59E0B" : "#059669";
  const pwLabel = newPw.length < 8 ? "Too short" : newPw.length < 12 ? "Fair" : newPw.length < 16 ? "Good" : "Strong";

  return (
    <div style={S.loginWrap}>
      <style>{globalStyles}</style>
      <div style={{ ...S.loginCard, maxWidth: "420px", gap: "14px" }}>
        <div style={{ fontSize: "2rem" }}>🔑</div>
        <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.5rem", color: "#F59E0B", textAlign: "center" }}>Set Up Your Account</h2>
        <p style={{ fontSize: "0.8rem", color: "#555", textAlign: "center", lineHeight: 1.6 }}>
          Welcome, <strong style={{ color: "#F5F0E8" }}>{currentUser.name}</strong>! Please add your email and set a new password before continuing.
        </p>

        <div style={{ height: "1px", background: "#1E1E1E", width: "100%" }} />

        {/* Email */}
        <div style={{ ...S.formRow, width: "100%" }}>
          <label style={S.formLabel}>Email Address</label>
          <input
            type="email"
            style={{ ...S.formInput, width: "100%", borderColor: emailInvalid ? "#DC2626" : undefined }}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
          />
          {emailInvalid && <span style={{ fontSize: "0.72rem", color: "#FCA5A5" }}>Please enter a valid email address.</span>}
        </div>

        <div style={{ height: "1px", background: "#1E1E1E", width: "100%" }} />

        {/* New password */}
        <div style={{ ...S.formRow, width: "100%" }}>
          <label style={S.formLabel}>New Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showNew ? "text" : "password"}
              style={{ ...S.formInput, width: "100%", paddingRight: "60px" }}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
            />
            <button onClick={() => setShowNew(v => !v)}
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans',sans-serif" }}>
              {showNew ? "Hide" : "Show"}
            </button>
          </div>
          {tooShort && <span style={{ fontSize: "0.72rem", color: "#FCA5A5" }}>Must be at least 8 characters.</span>}
        </div>

        {/* Strength bar */}
        {newPw.length > 0 && (
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= pwScore ? pwColor : "#1A1A1A", transition: "background 0.2s" }} />
              ))}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#555" }}>{pwLabel}</div>
          </div>
        )}

        {/* Confirm password */}
        <div style={{ ...S.formRow, width: "100%" }}>
          <label style={S.formLabel}>Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              style={{ ...S.formInput, width: "100%", paddingRight: "60px", borderColor: mismatch ? "#DC2626" : undefined }}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Re-enter your password"
              onKeyDown={e => e.key === "Enter" && valid && onSave(newPw, email)}
            />
            <button onClick={() => setShowConfirm(v => !v)}
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans',sans-serif" }}>
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          {mismatch && <span style={{ fontSize: "0.72rem", color: "#FCA5A5" }}>Passwords don't match.</span>}
        </div>

        <button
          style={{ ...S.saveBtn, width: "100%", padding: "12px", opacity: valid ? 1 : 0.4 }}
          disabled={!valid}
          onClick={() => onSave(newPw, email)}>
          Set Up Account & Continue →
        </button>
      </div>
    </div>
  );
}

// ─── CHANGE PASSWORD MODAL ────────────────────────────────────────────────────

function ChangePasswordModal({ currentUser, onSave, onClose }) {
  const [email, setEmail]           = useState(currentUser.email || "");
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [currentError, setCurrentError] = useState("");

  const emailInvalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const tooShort  = newPw.length > 0 && newPw.length < 8;
  const mismatch  = confirmPw.length > 0 && newPw !== confirmPw;
  const sameAsOld = newPw.length > 0 && newPw === currentUser.password;
  const valid = email.length > 0 && !emailInvalid && currentPw.length > 0 && newPw.length >= 8 && newPw === confirmPw && !sameAsOld;

  const handleSave = () => {
    if (currentPw !== currentUser.password) {
      setCurrentError("Current password is incorrect.");
      return;
    }
    setCurrentError("");
    onSave(newPw, email);
  };

  const pwStrengthScore = Math.min(4, Math.floor(newPw.length / 3));
  const pwStrengthColor = pwStrengthScore <= 1 ? "#DC2626" : pwStrengthScore === 2 ? "#F59E0B" : "#059669";
  const pwStrengthLabel = newPw.length < 8 ? "Too short" : newPw.length < 12 ? "Fair" : newPw.length < 16 ? "Good" : "Strong";

  const PwField = ({ label, value, onChange, show, onToggle, error, placeholder, onKeyDown }) => (
    <div style={S.formRow}>
      <label style={S.formLabel}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"}
          style={{ ...S.formInput, paddingRight: "60px", borderColor: error ? "#DC2626" : undefined }}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
        />
        <button onClick={onToggle}
          style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans',sans-serif" }}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && <span style={{ fontSize: "0.72rem", color: "#FCA5A5" }}>{error}</span>}
    </div>
  );

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "420px" }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>🔑 Account Settings</h3>
          <button style={S.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          {/* Email */}
          <div style={S.formRow}>
            <label style={S.formLabel}>Email Address</label>
            <input type="email"
              style={{ ...S.formInput, borderColor: emailInvalid ? "#DC2626" : undefined }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {emailInvalid && <span style={{ fontSize: "0.72rem", color: "#FCA5A5" }}>Please enter a valid email address.</span>}
          </div>

          <div style={{ height: "1px", background: "#1A1A1A" }} />

          <PwField label="Current Password" value={currentPw} onChange={v => { setCurrentPw(v); setCurrentError(""); }}
            show={showCurrent} onToggle={() => setShowCurrent(v => !v)}
            error={currentError} placeholder="Your current password" />

          <div style={{ height: "1px", background: "#1A1A1A" }} />

          <PwField label="New Password" value={newPw} onChange={setNewPw}
            show={showNew} onToggle={() => setShowNew(v => !v)}
            error={tooShort ? "Must be at least 8 characters." : sameAsOld ? "New password must differ from current." : ""}
            placeholder="At least 8 characters" />

          {newPw.length > 0 && (
            <div>
              <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= pwStrengthScore ? pwStrengthColor : "#1A1A1A", transition: "background 0.2s" }} />
                ))}
              </div>
              <span style={{ fontSize: "0.68rem", color: "#555" }}>{pwStrengthLabel}</span>
            </div>
          )}

          <PwField label="Confirm New Password" value={confirmPw} onChange={setConfirmPw}
            show={showConfirm} onToggle={() => setShowConfirm(v => !v)}
            error={mismatch ? "Passwords don't match." : ""}
            placeholder="Re-enter new password"
            onKeyDown={e => e.key === "Enter" && valid && handleSave()} />
        </div>
        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.saveBtn, opacity: valid ? 1 : 0.4 }} disabled={!valid} onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginScreen({ staff, onLogin }) {
  const [sel, setSel] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const member = staff.find(s => s.id === Number(sel));
    if (!member) return;
    if (member.password && password !== member.password) {
      setError("Incorrect password. Please try again.");
      return;
    }
    setError("");
    onLogin(member);
  };

  return (
    <div style={S.loginWrap}>
      <style>{globalStyles}</style>
      <div style={S.loginCard}>
        <div style={{ fontSize: "2.8rem" }}>🍽</div>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.9rem", color: "#F59E0B", letterSpacing: "0.1em" }}>TABLESIDE</h1>
        <p style={{ fontSize: "0.8rem", color: "#444" }}>Restaurant Staff Scheduler</p>
        <div style={{ width: "36px", height: "1px", background: "#1E1E1E", margin: "4px 0" }} />

        <div style={{ ...S.formRow, width: "100%" }}>
          <label style={S.formLabel}>Name</label>
          <select style={{ ...S.formSelect, width: "100%" }} value={sel}
            onChange={e => { setSel(e.target.value); setPassword(""); setError(""); }}>
            <option value="">— Select your name —</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}{s.role === "manager" ? " (Manager)" : ""}</option>)}
          </select>
        </div>

        {sel && (
          <div style={{ ...S.formRow, width: "100%" }}>
            <label style={S.formLabel}>Password</label>
            <input
              type="password"
              style={{ ...S.formInput, width: "100%" }}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Enter your password"
              autoFocus
            />
          </div>
        )}

        {error && (
          <div style={{ fontSize: "0.78rem", color: "#FCA5A5", background: "#DC262618", border: "1px solid #DC262633", borderRadius: "7px", padding: "8px 12px", width: "100%", textAlign: "center" }}>
            {error}
          </div>
        )}

        <button
          style={{ ...S.saveBtn, width: "100%", padding: "12px", opacity: sel && password ? 1 : 0.4 }}
          disabled={!sel || !password}
          onClick={handleLogin}>
          Sign In
        </button>

        <div style={{ fontSize: "0.7rem", color: "#2A2A2A", textAlign: "center", lineHeight: 1.6 }}>
          Demo passwords: managers use <span style={{ color: "#555" }}>manager1</span> / <span style={{ color: "#555" }}>manager2</span>
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const statusStyle = (s) => ({
  padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "500",
  background: s === "pending" ? "#F59E0B22" : s === "approved" ? "#05966922" : "#DC262622",
  color: s === "pending" ? "#F59E0B" : s === "approved" ? "#6EE7B7" : "#FCA5A5",
});

// ─── STYLES ───────────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  select option { background: #1A1A1A; color: #F5F0E8; }
  button { transition: opacity 0.15s; }
  button:hover { opacity: 0.82; }
`;

const S = {
  app: { minHeight: "100vh", background: "#080808", color: "#F5F0E8", fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px", background: "#0F0F0F", borderBottom: "1px solid #1E1E1E", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap" },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoName: { fontFamily: "'DM Serif Display',serif", fontSize: "1.1rem", letterSpacing: "0.1em", color: "#F59E0B" },
  logoSub: { fontSize: "0.6rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.15em" },
  nav: { display: "flex", gap: "3px", flex: 1, justifyContent: "center" },
  navBtn: { display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", background: "transparent", color: "#777", border: "1px solid transparent", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans',sans-serif" },
  navBtnActive: { background: "#1A1A1A", color: "#F5F0E8", border: "1px solid #2A2A2A" },
  badge: { background: "#F59E0B", color: "#0A0A0A", borderRadius: "10px", padding: "1px 6px", fontSize: "0.68rem", fontWeight: "700" },
  headerRight: { display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#F59E0B22", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "600", flexShrink: 0 },
  greenChipBtn: { padding: "6px 12px", borderRadius: "6px", background: "#05966918", color: "#6EE7B7", border: "1px solid #05966933", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans',sans-serif" },
  ghostBtn: { padding: "5px 10px", borderRadius: "6px", background: "transparent", color: "#555", border: "1px solid #1E1E1E", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'DM Sans',sans-serif" },
  viewWrap: { padding: "24px", maxWidth: "1400px", margin: "0 auto" },
  weekNavBtn: { width: "30px", height: "30px", borderRadius: "7px", background: "#1A1A1A", color: "#F5F0E8", border: "1px solid #2A2A2A", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" },
  chipBtn: { padding: "4px 10px", borderRadius: "5px", background: "#F59E0B22", color: "#F59E0B", border: "1px solid #F59E0B44", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'DM Sans',sans-serif" },
  posFilterBtn: { padding: "4px 10px", borderRadius: "18px", background: "transparent", color: "#777", border: "1px solid #2A2A2A", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'DM Sans',sans-serif" },
  printBtn: { padding: "6px 14px", borderRadius: "7px", background: "#1A1A1A", color: "#F5F0E8", border: "1px solid #2A2A2A", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" },
  dayCol: { background: "#0F0F0F", borderRadius: "10px", border: "1px solid #1E1E1E", overflow: "hidden", minHeight: "240px" },
  dayHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#141414", borderBottom: "1px solid #1E1E1E" },
  dayName: { fontSize: "0.7rem", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" },
  dayDate: { width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "500" },
  shiftCard: { borderRadius: "7px", padding: "7px 9px", cursor: "pointer" },
  addShiftBtn: { width: "100%", padding: "5px", background: "transparent", color: "#2A2A2A", border: "1px dashed #1E1E1E", borderRadius: "5px", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans',sans-serif" },
  reqCard: { background: "#0F0F0F", borderRadius: "11px", border: "1px solid #1E1E1E", padding: "14px 18px" },
  reqTypeBadge: { padding: "3px 9px", borderRadius: "18px", fontSize: "0.76rem", fontWeight: "500" },
  reqAvatar: { width: "34px", height: "34px", borderRadius: "50%", background: "#1A1A1A", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "600", flexShrink: 0 },
  approveBtn: { padding: "6px 16px", borderRadius: "6px", background: "#059669", color: "#F5F0E8", border: "none", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif", fontWeight: "500" },
  denyBtn: { padding: "6px 16px", borderRadius: "6px", background: "#1A1A1A", color: "#FCA5A5", border: "1px solid #DC262633", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif" },
  tabBtn: { padding: "6px 14px", borderRadius: "7px", background: "transparent", color: "#777", border: "1px solid transparent", cursor: "pointer", fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "6px" },
  tabBtnActive: { background: "#1A1A1A", color: "#F5F0E8", border: "1px solid #2A2A2A" },
  modalOverlay: { position: "fixed", inset: 0, background: "#000000CC", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" },
  modal: { background: "#111", borderRadius: "13px", border: "1px solid #222", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: "1px solid #1A1A1A", position: "sticky", top: 0, background: "#111", zIndex: 1 },
  modalTitle: { fontFamily: "'DM Serif Display',serif", fontSize: "1.15rem" },
  modalClose: { background: "none", border: "none", color: "#555", fontSize: "1rem", cursor: "pointer" },
  modalBody: { padding: "18px 22px", display: "flex", flexDirection: "column", gap: "13px" },
  modalFooter: { display: "flex", gap: "8px", justifyContent: "flex-end", padding: "14px 22px", borderTop: "1px solid #1A1A1A", position: "sticky", bottom: 0, background: "#111" },
  formRow: { display: "flex", flexDirection: "column", gap: "5px" },
  formLabel: { fontSize: "0.72rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.07em" },
  formSelect: { background: "#0A0A0A", color: "#F5F0E8", border: "1px solid #2A2A2A", borderRadius: "7px", padding: "8px 11px", fontSize: "0.86rem", fontFamily: "'DM Sans',sans-serif", outline: "none" },
  formInput: { background: "#0A0A0A", color: "#F5F0E8", border: "1px solid #2A2A2A", borderRadius: "7px", padding: "8px 11px", fontSize: "0.86rem", fontFamily: "'DM Sans',sans-serif", outline: "none", colorScheme: "dark" },
  formTextarea: { background: "#0A0A0A", color: "#F5F0E8", border: "1px solid #2A2A2A", borderRadius: "7px", padding: "8px 11px", fontSize: "0.86rem", fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "vertical" },
  dayToggle: { padding: "6px 11px", borderRadius: "6px", background: "#0A0A0A", color: "#555", border: "1px solid #2A2A2A", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif" },
  saveBtn: { padding: "8px 18px", borderRadius: "7px", background: "#F59E0B", color: "#0A0A0A", border: "none", cursor: "pointer", fontSize: "0.83rem", fontFamily: "'DM Sans',sans-serif", fontWeight: "600" },
  cancelBtn: { padding: "8px 14px", borderRadius: "7px", background: "transparent", color: "#555", border: "1px solid #2A2A2A", cursor: "pointer", fontSize: "0.83rem", fontFamily: "'DM Sans',sans-serif" },
  deleteBtn: { padding: "8px 14px", borderRadius: "7px", background: "transparent", color: "#FCA5A5", border: "1px solid #DC262633", cursor: "pointer", fontSize: "0.83rem", fontFamily: "'DM Sans',sans-serif", marginRight: "auto" },
  loginWrap: { minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans',sans-serif" },
  loginCard: { background: "#0F0F0F", borderRadius: "14px", border: "1px solid #1E1E1E", padding: "36px", width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center", gap: "11px" },
};

// Labor Cost specific styles
const LC = {
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" },
  kpiCard: { background: "#0F0F0F", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "16px 18px" },
  progressWrap: { background: "#0F0F0F", border: "1px solid #1E1E1E", borderRadius: "10px", padding: "14px 18px", marginBottom: "24px" },
  progressTrack: { height: "8px", background: "#1A1A1A", borderRadius: "4px", overflow: "visible", position: "relative" },
  progressFill: { height: "100%", borderRadius: "4px", transition: "width 0.4s ease" },
  progressGoalLine: { position: "absolute", top: "-4px", width: "2px", height: "16px", background: "#F59E0B", borderRadius: "1px" },
  tab: { padding: "8px 18px", borderRadius: "8px 8px 0 0", background: "transparent", color: "#666", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif", marginBottom: "-1px" },
  tabActive: { color: "#F5F0E8", borderBottomColor: "#F59E0B", background: "transparent" },
  chartCard: { background: "#0F0F0F", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "18px 18px 10px" },
  chartTitle: { fontSize: "0.78rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" },
  tableCard: { background: "#0F0F0F", border: "1px solid #1E1E1E", borderRadius: "12px", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" },
  th: { padding: "10px 14px", textAlign: "left", fontSize: "0.68rem", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #1A1A1A", background: "#141414" },
  td: { padding: "10px 14px", borderBottom: "1px solid #111", color: "#888", fontSize: "0.82rem" },
  tdNum: { padding: "10px 14px", borderBottom: "1px solid #111", color: "#888", fontSize: "0.82rem", textAlign: "right" },
};
