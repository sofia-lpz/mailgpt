import React, { useState, useEffect, useCallback, useRef } from "react";
import "./Dashboard.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type Preset = "day" | "week" | "month" | "year" | "custom";

interface DateRange {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
}

interface TimeSeriesPoint {
    date: string;
    count: number;
}

interface TrendPoint {
    date: string;
    value: number;
}

interface BusyHour {
    hour: number;
    count: number;
}

interface DashboardData {
    emailsReceived: TimeSeriesPoint[];
    emailsAnswered: TimeSeriesPoint[];
    pendingEmails: number;
    avgResponseTime: number;
    medianResponseTime: number;
    responseRateTrend: TrendPoint[];
    busiestHours: BusyHour[];
}

interface DashboardProps {
    onLogout: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_URL = "/api";

function toISO(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function rangeForPreset(preset: Preset): DateRange {
    const today = new Date();
    const to = toISO(today);
    const from = new Date(today);
    if (preset === "day") from.setDate(today.getDate());
    if (preset === "week") {
        const day = today.getDay();
        const diffToMonday = (day === 0 ? -6 : 1 - day);
        return { from: toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday)), to };
    }
    if (preset === "month") {
        return { from: toISO(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    }
    if (preset === "year") {
        return { from: toISO(new Date(today.getFullYear(), 0, 1)), to };
    }
    return { from: toISO(from), to };
}

function formatRangeLabel(range: DateRange): string {
    const fmt = (s: string) =>
        new Date(s + "T00:00:00").toLocaleDateString("es-ES", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    return `${fmt(range.from)} – ${fmt(range.to)}`;
}

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatHour(hour: number): string {
    if (hour === 0) return "12am";
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

function makeMock(range: DateRange): DashboardData {
    const msPerDay = 86400000;
    const days = Math.max(
        1,
        Math.round(
            (new Date(range.to).getTime() - new Date(range.from).getTime()) / msPerDay
        )
    );
    const n = Math.min(days, 30);
    const ts = Array.from({ length: n }, (_, i) => ({
        date: toISO(new Date(new Date(range.from).getTime() + i * msPerDay)),
        count: Math.floor(20 + Math.random() * 80),
    }));
    const ts2 = ts.map((p) => ({
        ...p,
        count: Math.floor(p.count * (0.6 + Math.random() * 0.35)),
    }));
    return {
        emailsReceived: ts,
        emailsAnswered: ts2,
        pendingEmails: Math.floor(12 + Math.random() * 40),
        avgResponseTime: 45 + Math.random() * 120,
        medianResponseTime: 30 + Math.random() * 90,
        responseRateTrend: ts.map((p) => ({
            date: p.date,
            value: 60 + Math.random() * 35,
        })),
        busiestHours: Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            count:
                h >= 8 && h <= 18
                    ? Math.floor(30 + Math.random() * 70)
                    : Math.floor(Math.random() * 20),
        })),
    };
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({
    data,
    color,
    height = 40,
}) => {
    if (data.length < 2) return null;
    const w = 120;
    const h = height;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data
        .map((v, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((v - min) / range) * (h - 6) - 3;
            return `${x},${y}`;
        })
        .join(" ");
    const area = `0,${h} ${pts} ${w},${h}`;
    const id = `sg${color.replace(/[^a-z0-9]/gi, "")}`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ overflow: "visible" }}>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#${id})`} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// ── Bar chart ─────────────────────────────────────────────────────────────────

/*
const BarChart: React.FC<{ data: { label: string; value: number }[]; color: string }> = ({
    data,
    color,
}) => {
    if (!data.length) return null;
    const max = Math.max(...data.map((d) => d.value)) || 1;
    const w = 320;
    const h = 120;
    const barW = Math.floor((w - (data.length - 1) * 4) / data.length);
    return (
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ overflow: "visible" }}>
            {data.map((d, i) => {
                const barH = Math.max(2, (d.value / max) * (h - 20));
                const x = i * (barW + 4);
                const y = h - barH - 16;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
                        <text x={x + barW / 2} y={h} textAnchor="middle" fontSize="9" fill="var(--sage)" fontFamily="DM Sans">
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};
*/

// ── Line chart ────────────────────────────────────────────────────────────────

const LineChart: React.FC<{
    datasets: { label: string; data: number[]; color: string }[];
    labels: string[];
}> = ({ datasets, labels }) => {
    const w = 480;
    const h = 140;
    const padL = 32;
    const padB = 20;
    const innerW = w - padL;
    const innerH = h - padB;
    const allValues = datasets.flatMap((d) => d.data);
    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues, 1);
    const range = max - min || 1;
    const toX = (i: number) => padL + (i / (labels.length - 1 || 1)) * innerW;
    const toY = (v: number) => innerH - ((v - min) / range) * (innerH - 10) - 5;
    const step = Math.ceil(labels.length / 8);

    return (
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ overflow: "visible" }}>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = toY(min + t * range);
                return (
                    <g key={t}>
                        <line x1={padL} y1={y} x2={w} y2={y} stroke="var(--mist)" strokeOpacity="0.3" strokeDasharray="4 3" />
                        <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="var(--sage)" fontFamily="DM Sans">
                            {Math.round(min + t * range)}
                        </text>
                    </g>
                );
            })}
            {datasets.map((ds) => {
                const pts = ds.data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
                const area = `${padL},${innerH} ${pts} ${toX(ds.data.length - 1)},${innerH}`;
                const id = `lg${ds.label.replace(/\s/g, "")}`;
                return (
                    <g key={ds.label}>
                        <defs>
                            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={ds.color} stopOpacity="0.2" />
                                <stop offset="100%" stopColor={ds.color} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <polygon points={area} fill={`url(#${id})`} />
                        <polyline points={pts} fill="none" stroke={ds.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {ds.data.map((v, i) => (
                            <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={ds.color} />
                        ))}
                    </g>
                );
            })}
            {labels.map((l, i) =>
                i % step === 0 ? (
                    <text key={i} x={toX(i)} y={h - 4} textAnchor="middle" fontSize="9" fill="var(--sage)" fontFamily="DM Sans">
                        {l}
                    </text>
                ) : null
            )}
        </svg>
    );
};

// ── Heatmap ───────────────────────────────────────────────────────────────────

const HourHeatmap: React.FC<{ data: BusyHour[] }> = ({ data }) => {
    const max = Math.max(...data.map((d) => d.count), 1);
    return (
        <div className="heatmap">
            {data.map((d) => (
                <div
                    key={d.hour}
                    className="heatmap-cell"
                    style={{ opacity: 0.15 + (d.count / max) * 0.85 }}
                    title={`${formatHour(d.hour)}: ${d.count} correos`}
                >
                    <span className="heatmap-label">{formatHour(d.hour)}</span>
                </div>
            ))}
        </div>
    );
};

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
    label: string;
    value: string | number;
    sub?: string;
    sparkData?: number[];
    sparkColor?: string;
    accent?: boolean;
}> = ({ label, value, sub, sparkData, sparkColor = "var(--sage)", accent }) => (
    <div className={`stat-card${accent ? " stat-card--accent" : ""}`}>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {sub && <p className="stat-sub">{sub}</p>}
        {sparkData && sparkData.length > 1 && (
            <div className="stat-spark">
                <Sparkline data={sparkData} color={accent ? "var(--cream)" : sparkColor} />
            </div>
        )}
    </div>
);

// ── Date range picker ─────────────────────────────────────────────────────────

const PRESETS: { key: Preset; label: string }[] = [
    { key: "day", label: "Día" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
    { key: "year", label: "Año" },
];

const DateRangePicker: React.FC<{
    preset: Preset;
    range: DateRange;
    onPreset: (p: Preset) => void;
    onRange: (r: DateRange) => void;
}> = ({ preset, range, onPreset, onRange }) => {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DateRange>(range);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { setDraft(range); }, [range]);

    const handlePreset = (p: Preset) => {
        onPreset(p);
        if (p !== "custom") {
            setOpen(false);
        } else {
            setOpen(true);
        }
    };

    const applyCustom = () => {
        if (draft.from && draft.to && draft.from <= draft.to) {
            onRange(draft);
            setOpen(false);
        }
    };

    return (
        <div className="date-picker" ref={ref}>
            <div className="filter-bar">
                <div className="period-tabs">
                    {PRESETS.map(({ key, label }) => (
                        <button
                            key={key}
                            className={`period-tab${preset === key ? " period-tab--active" : ""}`}
                            onClick={() => handlePreset(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <button className="range-pill" onClick={() => setOpen((o) => !o)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatRangeLabel(range)}
                </button>
            </div>

            {open && (
                <div className="date-dropdown">
                    <p className="date-dropdown-label">Rango de fechas personalizado</p>
                    <div className="date-inputs">
                        <div className="date-input-group">
                            <label>Desde</label>
                            <input
                                type="date"
                                value={draft.from}
                                max={draft.to || toISO(new Date())}
                                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                            />
                        </div>
                        <div className="date-input-sep">→</div>
                        <div className="date-input-group">
                            <label>Hasta</label>
                            <input
                                type="date"
                                value={draft.to}
                                min={draft.from}
                                max={toISO(new Date())}
                                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                            />
                        </div>
                    </div>
                    <button
                        className="btn-apply"
                        onClick={applyCustom}
                        disabled={!draft.from || !draft.to || draft.from > draft.to}
                    >
                        Aplicar rango
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [preset, setPreset] = useState<Preset>("week");
    const [range, setRange] = useState<DateRange>(rangeForPreset("week"));
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [usingMock, setUsingMock] = useState(false);

    const handlePreset = (p: Preset) => {
        setPreset(p);
        if (p !== "custom") setRange(rangeForPreset(p));
    };

    const handleRange = (r: DateRange) => {
        setPreset("custom");
        setRange(r);
    };

    const load = useCallback(async () => {
        setLoading(true);
        const q = `from=${range.from}&to=${range.to}`;
        try {
            const [
                emailsReceived,
                emailsAnswered,
                pendingRes,
                avgRes,
                medianRes,
                responseRateTrend,
                busiestHours,
            ] = await Promise.all([
                fetchJSON<TimeSeriesPoint[]>(`${BASE_URL}/emailsreceived?${q}`),
                fetchJSON<TimeSeriesPoint[]>(`${BASE_URL}/emailsanswered?${q}`),
                fetchJSON<{ count: number }>(`${BASE_URL}/pendingEmails?${q}`),
                fetchJSON<{ minutes: number }>(`${BASE_URL}/avgResponseTime?${q}`),
                fetchJSON<{ minutes: number }>(`${BASE_URL}/medianResponseTime?${q}`),
                fetchJSON<TrendPoint[]>(`${BASE_URL}/responseRateTrend?${q}`),
                fetchJSON<BusyHour[]>(`${BASE_URL}/busiestHours?${q}`),
            ]);
            setData({
                emailsReceived,
                emailsAnswered,
                pendingEmails: pendingRes.count,
                avgResponseTime: avgRes.minutes,
                medianResponseTime: medianRes.minutes,
                responseRateTrend,
                busiestHours,
            });
            setUsingMock(false);
        } catch {
            setData(makeMock(range));
            setUsingMock(true);
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { load(); }, [load]);

    const receivedCounts = data?.emailsReceived.map((p) => p.count) ?? [];
    const answeredCounts = data?.emailsAnswered.map((p) => p.count) ?? [];
    const xLabels = data?.emailsReceived.map((p) => p.date.slice(5)) ?? [];
    const rrtValues = data?.responseRateTrend.map((p) => p.value) ?? [];
    const rrtLabels = data?.responseRateTrend.map((p) => p.date.slice(5)) ?? [];
    const totalReceived = receivedCounts.reduce((a, b) => a + b, 0);
    const totalAnswered = answeredCounts.reduce((a, b) => a + b, 0);
    const answerRate = totalReceived > 0 ? Math.round((totalAnswered / totalReceived) * 100) : 0;

    return (
        <div className="dash-page">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M3 8L10.89 13.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                stroke="#2F2504" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="sidebar-brand-name">trott <span>mail</span></span>
                </div>

                <nav className="sidebar-nav">
                    <a href="#" className="nav-item nav-item--active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                        </svg>
                        Resumen
                    </a>
                    <a href="#" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        Bandeja de entrada
                    </a>
                    <a href="#" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
                        </svg>
                        Configuración
                    </a>
                </nav>

                <button className="sidebar-logout" onClick={onLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Cerrar sesión
                </button>
            </aside>

            <main className="dash-main">
                <header className="dash-header">
                    <div>
                        <h1 className="dash-title">Resumen</h1>
                        <p className="dash-subtitle">
                            {usingMock && <span className="mock-badge">Datos de demo</span>}
                            Rendimiento de correo de un vistazo
                        </p>
                    </div>

                    <DateRangePicker
                        preset={preset}
                        range={range}
                        onPreset={handlePreset}
                        onRange={handleRange}
                    />
                </header>

                {loading ? (
                    <div className="dash-loading">
                        <div className="loading-spinner" />
                        <p>Cargando datos…</p>
                    </div>
                ) : (
                    <div className="dash-content">
                        <div className="stats-row">
                            <StatCard label="Correos recibidos" value={totalReceived.toLocaleString()} sub={formatRangeLabel(range)} />
                            <StatCard label="Correos respondidos" value={totalAnswered.toLocaleString()} sub={`${answerRate}% tasa de respuesta`} />
                            <StatCard label="Correos pendientes" value={data?.pendingEmails ?? "—"} sub="Esperando respuesta" accent />
                            <StatCard label="Tiempo medio de respuesta" value={data ? formatMinutes(data.avgResponseTime) : "—"} sub={`Mediana: ${data ? formatMinutes(data.medianResponseTime) : "—"}`} />
                        </div>

                        <div className="charts-row">
                            <div className="chart-card chart-card--wide">
                                <div className="chart-card-header">
                                    <h3>Volumen de correos</h3>
                                    <div className="chart-legend">
                                        <span className="legend-dot" style={{ background: "var(--umber)" }} /> Recibidos
                                        <span className="legend-dot" style={{ background: "var(--sage)" }} /> Respondidos
                                    </div>
                                </div>
                                <LineChart labels={xLabels} datasets={[
                                    { label: "Recibidos", data: receivedCounts, color: "var(--umber)" },
                                    { label: "Respondidos", data: answeredCounts, color: "var(--sage)" },
                                ]} />
                            </div>
                            <div className="chart-card">
                                <div className="chart-card-header">
                                    <h3>Tasa de respuesta</h3>
                                    <span className="chart-unit">%</span>
                                </div>
                                <LineChart labels={rrtLabels} datasets={[{ label: "Tasa", data: rrtValues, color: "var(--accent)" }]} />
                            </div>
                        </div>

                        <div className="charts-row charts-row--full">
                            <div className="chart-card">
                                <div className="chart-card-header">
                                    <h3>Horas de mayor actividad</h3>
                                    <span className="chart-unit">correos / hora</span>
                                </div>
                                {data && <HourHeatmap data={data.busiestHours} />}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;