import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import {
    FaTimes, FaSyncAlt, FaFilePdf, FaArrowLeft, FaIdBadge
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

/* ============================================================
   LOADING HELPERS
   ============================================================ */
const loadImageFromDataUrl = (src) =>
    new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });

/* ============================================================
   REUSABLE UI PIECES
   ============================================================ */
const AvgCompanyLogo = ({ size = 44, className = '' }) => (
    <div
        className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: size, height: size }}
    >
        <img
            src="/logo.jpg"
            alt="Agilavetri Primetech Logo"
            className="w-full h-full object-contain"
        />
    </div>
);

const IssuingAuthoritySignatureSVG = ({ className = '' }) => (
    <svg viewBox="0 0 190 60" className={className} preserveAspectRatio="xMidYMid meet">
        <path
            d="M 12 28 L 24 52 L 38 14 M 44 48 C 45 48 46 49 45 50 M 56 50 C 53 34 64 14 74 16 C 81 18 79 34 76 46 M 54 36 C 66 33 78 30 86 32 M 89 32 C 94 28 100 40 94 54 C 88 68 74 66 70 56 C 67 47 80 39 100 32 C 104 28 108 36 111 32 C 115 28 119 34 123 29 L 156 10"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/* ============================================================
   SVG SOURCES FOR PDF (waves / signature)
   ============================================================ */
const SVG_FRONT_TOP_WAVES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M95,0 L200,0 L200,115 C165,65 135,28 95,0 Z" fill="#0d47a1"/><path d="M55,0 L125,0 C165,40 185,82 200,145 L200,175 C168,98 122,42 55,0 Z" fill="#eab308"/><path d="M25,0 L50,0 C115,44 162,98 200,180 L200,195 C155,112 102,52 25,0 Z" fill="#ca8a04" fill-opacity="0.6"/></svg>`;

const SVG_FRONT_BOTTOM_WAVES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M0,95 C35,145 72,175 115,200 L0,200 Z" fill="#0d47a1"/><path d="M0,30 C35,105 82,158 155,200 L110,200 C55,162 20,115 0,55 Z" fill="#eab308"/><path d="M42,125 C78,162 118,185 175,200 L152,200 C105,182 68,155 42,125 Z" fill="#ca8a04" fill-opacity="0.65"/></svg>`;

const SVG_BACK_TOP_WAVES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M105,0 L200,0 L200,105 C168,60 140,25 105,0 Z" fill="#0d47a1"/><path d="M60,0 L130,0 C168,38 188,80 200,140 L200,170 C170,95 125,40 60,0 Z" fill="#eab308"/><path d="M25,0 L52,0 C115,44 162,98 200,180 L200,192 C155,112 102,52 25,0 Z" fill="#ca8a04" fill-opacity="0.6"/></svg>`;

const SVG_BACK_BOTTOM_WAVES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M0,105 C32,148 68,176 108,200 L0,200 Z" fill="#0d47a1"/><path d="M0,38 C32,108 78,160 148,200 L105,200 C52,162 18,118 0,62 Z" fill="#eab308"/><path d="M38,125 C75,162 115,185 170,200 L148,200 C100,182 64,155 38,125 Z" fill="#ca8a04" fill-opacity="0.65"/></svg>`;

const SVG_SIGNATURE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 60"><path d="M 12 28 L 24 52 L 38 14 M 44 48 C 45 48 46 49 45 50 M 56 50 C 53 34 64 14 74 16 C 81 18 79 34 76 46 M 54 36 C 66 33 78 30 86 32 M 89 32 C 94 28 100 40 94 54 C 88 68 74 66 70 56 C 67 47 80 39 100 32 C 104 28 108 36 111 32 C 115 28 119 34 123 29 L 156 10" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ============================================================
   ASSET RENDERING HELPERS
   ============================================================ */
const svgToPngDataUrl = (svgString, widthPx, heightPx) =>
    new Promise((resolve) => {
        try {
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = widthPx;
                    canvas.height = heightPx;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, widthPx, heightPx);
                    ctx.drawImage(img, 0, 0, widthPx, heightPx);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = dataUrl;
        } catch (e) {
            resolve(null);
        }
    });

const imageToBase64 = (src) =>
    new Promise((resolve) => {
        if (!src) return resolve(null);
        if (src.startsWith('data:')) return resolve(src);
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = src;
        } catch (e) {
            resolve(null);
        }
    });

const renderCircularAvatar = (photoDataUrl, sizePx = 600) =>
    new Promise((resolve) => {
        if (!photoDataUrl) return resolve(null);
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = sizePx;
                canvas.height = sizePx;
                const ctx = canvas.getContext('2d');
                const c = sizePx / 2;

                const grad = ctx.createLinearGradient(0, 0, sizePx, sizePx);
                grad.addColorStop(0, '#ca8a04');
                grad.addColorStop(0.5, '#eab308');
                grad.addColorStop(1, '#facc15');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(c, c, c, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(c, c, c * 0.92, 0, Math.PI * 2);
                ctx.fill();

                const photoR = c * 0.85;
                ctx.save();
                ctx.beginPath();
                ctx.arc(c, c, photoR, 0, Math.PI * 2);
                ctx.clip();

                const ar = img.width / img.height;
                let dw, dh, dx, dy;
                if (ar > 1) {
                    dh = photoR * 2;
                    dw = dh * ar;
                    dx = c - dw / 2;
                    dy = c - dh / 2;
                } else {
                    dw = photoR * 2;
                    dh = dw / ar;
                    dx = c - dw / 2;
                    dy = c - dh / 2;
                }
                ctx.drawImage(img, dx, dy, dw, dh);
                ctx.restore();

                resolve(canvas.toDataURL('image/png'));
            } catch (e) {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = photoDataUrl;
    });

const renderScriptSignature = (name) =>
    new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 160;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = "italic 92px 'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive";
            ctx.fillText(name || '', canvas.width / 2, canvas.height / 2);
            resolve(canvas.toDataURL('image/png'));
        } catch (e) {
            resolve(null);
        }
    });

/* ============================================================
   CANVAS RENDERERS (HIGH-DPI CARD FACES WITH DM SANS)
   ============================================================ */
const roundedRectPath = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

const ensureDmSansLoaded = async () => {
    if (!document.fonts) return;
    try {
        await Promise.all([
            document.fonts.load('400 16px "DM Sans"'),
            document.fonts.load('500 16px "DM Sans"'),
            document.fonts.load('700 16px "DM Sans"'),
            document.fonts.load('800 16px "DM Sans"'),
            document.fonts.load('900 16px "DM Sans"'),
        ]);
        await document.fonts.ready;
    } catch (e) { /* ignore */ }
};

const renderFrontCardToCanvas = (data, assets) => {
    const W = 810;
    const H = 1290;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    roundedRectPath(ctx, 0, 0, W, H, 42);
    ctx.save();
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    if (assets.wavesTop) {
        const s = W * 0.58;
        ctx.drawImage(assets.wavesTop, W - s, 0, s, s);
    }
    if (assets.wavesBottom) {
        const s = W * 0.58;
        ctx.drawImage(assets.wavesBottom, 0, H - s, s, s);
    }

    const logoSize = W * 0.14;
    if (assets.logo) {
        ctx.drawImage(assets.logo, (W - logoSize) / 2, H * 0.045, logoSize, logoSize);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#0d47a1';
    ctx.font = '900 42px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.fillText('AGILAVETRI', W / 2, H * 0.235);

    ctx.font = '900 34px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.fillText('PRIMETECH PVT. LTD', W / 2, H * 0.272);

    const grd = ctx.createLinearGradient(W * 0.28, 0, W * 0.72, 0);
    grd.addColorStop(0, 'rgba(234, 179, 8, 0)');
    grd.addColorStop(0.5, '#eab308');
    grd.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.28, H * 0.295);
    ctx.lineTo(W * 0.72, H * 0.295);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '600 20px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.fillText('No.472/7, Balaji Arcade, 1st floor, AVS Compound,', W / 2, H * 0.318);
    ctx.fillText('80ft Road, 4th Block, Ejipura, Koramangala,', W / 2, H * 0.338);
    ctx.fillText('Bengaluru - 560034', W / 2, H * 0.358);

    if (assets.avatar) {
        const avSize = W * 0.42;
        ctx.drawImage(assets.avatar, (W - avSize) / 2, H * 0.395, avSize, avSize);
    }

    ctx.fillStyle = '#0d47a1';
    const nameText = String(data.personal.fullName || 'HR').toUpperCase();
    let nameFontSize = 44;
    ctx.font = `900 ${nameFontSize}px "DM Sans", "Helvetica", Arial, sans-serif`;
    while (ctx.measureText(nameText).width > W * 0.85 && nameFontSize > 22) {
        nameFontSize -= 2;
        ctx.font = `900 ${nameFontSize}px "DM Sans", "Helvetica", Arial, sans-serif`;
    }
    ctx.fillText(nameText, W / 2, H * 0.755);

    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(W * 0.22, H * 0.79);
    ctx.lineTo(W * 0.78, H * 0.79);
    ctx.stroke();

    const desigText = String(data.employment.designation || '').toUpperCase();
    let desigFontSize = 30;
    ctx.font = `800 ${desigFontSize}px "DM Sans", "Helvetica", Arial, sans-serif`;
    while (ctx.measureText(desigText).width > W * 0.85 && desigFontSize > 16) {
        desigFontSize -= 2;
        ctx.font = `800 ${desigFontSize}px "DM Sans", "Helvetica", Arial, sans-serif`;
    }
    ctx.fillText(desigText, W / 2, H * 0.825);

    ctx.fillStyle = '#010a1f';
    ctx.font = '900 26px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.fillText(`HR ID: ${data.personal.employeeId || ''}`, W / 2, H * 0.858);

    if (assets.signature) {
        const sigW = W * 0.30;
        const sigH = sigW * (60 / 190);
        ctx.drawImage(assets.signature, W * 0.62, H * 0.882, sigW, sigH);
    }

    ctx.fillStyle = '#1e293b';
    ctx.font = '800 16px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Signature of', W * 0.95, H * 0.945);
    ctx.fillText('Issuing Authority', W * 0.95, H * 0.968);

    ctx.restore();
    return canvas.toDataURL('image/png');
};

const renderBackCardToCanvas = (data, assets) => {
    const W = 810;
    const H = 1290;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    roundedRectPath(ctx, 0, 0, W, H, 42);
    ctx.save();
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    if (assets.wavesTop) {
        const s = W * 0.58;
        ctx.drawImage(assets.wavesTop, W - s, 0, s, s);
    }
    if (assets.wavesBottom) {
        const s = W * 0.58;
        ctx.drawImage(assets.wavesBottom, 0, H - s, s, s);
    }

    if (assets.logo) {
        ctx.globalAlpha = 0.05;
        const wmSize = W * 0.75;
        ctx.drawImage(assets.logo, (W - wmSize) / 2, (H - wmSize) / 2, wmSize, wmSize);
        ctx.globalAlpha = 1;
    }

    const rows = [
        ['Date Of Birth', data.personal.dobIdCard],
        ['Blood Group', data.personal.bloodGroup],
        ['HR ID', data.personal.employeeId],
        ['Phone No', data.personal.phone],
        ['Emergency No', data.emergency.phone],
    ];

    const labelX = W * 0.10;
    const colonX = W * 0.46;
    const valueX = W * 0.50;
    const startY = H * 0.07;
    const rowGap = H * 0.043;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    rows.forEach(([label, value], i) => {
        const y = startY + i * rowGap;
        ctx.fillStyle = '#1e293b';
        ctx.font = '800 24px "DM Sans", "Helvetica", Arial, sans-serif';
        ctx.fillText(label, labelX, y);
        ctx.fillText(':', colonX, y);
        ctx.fillStyle = '#334155';
        ctx.font = '700 23px "DM Sans", "Helvetica", Arial, sans-serif';
        let val = String(value || '');
        const maxW = W - valueX - W * 0.06;
        while (ctx.measureText(val).width > maxW && val.length > 5) {
            val = val.slice(0, -4) + '...';
        }
        ctx.fillText(val, valueX, y);
    });

    const addrY = startY + rows.length * rowGap + H * 0.008;
    ctx.fillStyle = '#1e293b';
    ctx.font = '800 24px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.fillText('Address', labelX, addrY);
    ctx.fillText(':', colonX, addrY);

    ctx.fillStyle = '#334155';
    ctx.font = '700 22px "DM Sans", "Helvetica", Arial, sans-serif';
    const addrMaxW = W - valueX - W * 0.06;
    const words = String(data.personal.address || '').split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > addrMaxW && line) {
            lines.push(line);
            line = w;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    const addrLineH = H * 0.028;
    lines.slice(0, 3).forEach((ln, i) => {
        ctx.fillText(ln, valueX, addrY + i * addrLineH);
    });

    const emailY = addrY + Math.min(lines.length, 3) * addrLineH + H * 0.012;
    ctx.fillStyle = '#1e293b';
    ctx.font = '800 24px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.fillText('Email', labelX, emailY);
    ctx.fillText(':', colonX, emailY);
    ctx.fillStyle = '#334155';
    ctx.font = '700 22px "DM Sans", "Helvetica", Arial, sans-serif';
    let emailText = String(data.personal.email || '');
    const emailMaxW = W - valueX - W * 0.06;
    while (ctx.measureText(emailText).width > emailMaxW && emailText.length > 5) {
        emailText = emailText.slice(0, -4) + '...';
    }
    ctx.fillText(emailText, valueX, emailY);

    const mottoY = H * 0.63;
    if (assets.logo) {
        const mSize = W * 0.115;
        ctx.drawImage(assets.logo, (W - mSize) / 2, mottoY, mSize, mSize);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = '900 22px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.fillText('CREATING MILLIONAIRES', W / 2, mottoY + H * 0.10);
    ctx.font = '700 19px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.fillText('2026-2027', W / 2, mottoY + H * 0.122);

    if (assets.scriptName) {
        const sigW = W * 0.42;
        const sigH = sigW * (160 / 600);
        ctx.drawImage(assets.scriptName, W * 0.54, H * 0.855, sigW, sigH);
    }
    ctx.fillStyle = '#1e293b';
    ctx.font = '800 18px "DM Sans", "Helvetica", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Employee Signature', W * 0.94, H * 0.968);

    ctx.restore();
    return canvas.toDataURL('image/png');
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const HRVirtualIDCom = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [activeCardSide, setActiveCardSide] = useState('both');
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const hrIdentifier = user?.hr_id || user?.email;

    /* -------- Inject DM Sans -------- */
    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-dm-sans', 'true');
        styleEl.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
            .dm-sans-root, .dm-sans-root *:not(code):not(pre):not(.font-mono) {
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .dm-sans-root .font-mono, .dm-sans-root code, .dm-sans-root pre {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .dm-sans-root input, .dm-sans-root select, .dm-sans-root textarea, .dm-sans-root button {
                font-family: inherit;
            }
        `;
        document.head.appendChild(styleEl);
        ensureDmSansLoaded();
        return () => {
            if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
        };
    }, []);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'Not Provided';
        return new Date(dateString).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDobForIdCard = (dateString) => {
        if (!dateString) return 'Not Provided';
        const d = new Date(dateString);
        if (isNaN(d)) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const fetchProfile = async () => {
        if (!hrIdentifier) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hr-profile/${hrIdentifier}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });
            const data = response.data;

            setProfileData({
                personal: {
                    photo: data.profile_photo || "/logo.jpg",
                    fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                    firstName: data.first_name || 'HR',
                    employeeId: data.hr_id,
                    dob: formatDateForDisplay(data.dob),
                    dobIdCard: formatDobForIdCard(data.dob),
                    rawDob: data.dob,
                    bloodGroup: data.blood_group || 'Not Provided',
                    gender: data.gender,
                    phone: data.phone,
                    email: data.email,
                    address: data.address || 'Not Provided'
                },
                employment: {
                    company: data.company || "AGILAVETRI PRIMETECH PVT. LTD",
                    branch: data.branch || "Not Assigned",
                    department: data.department || "Whole Branch HR",
                    designation: data.designation || "HR Administrator",
                    location: data.location || data.branch || "Not Assigned",
                    shift: data.shift || "General Shift",
                    joiningDate: formatDateForDisplay(data.joining_date),
                    status: data.status || "Unknown"
                },
                emergency: {
                    name: data.emergency_name || "Not Provided",
                    relationship: data.emergency_relationship || "Not Provided",
                    phone: data.emergency_phone || "Not Provided"
                }
            });
        } catch (error) {
            console.error("Error fetching profile data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hrIdentifier]);

    /* --------- PDF DOWNLOAD --------- */
    const handleDownloadPDF = async () => {
        if (isDownloadingPdf || !profileData) return;
        setIsDownloadingPdf(true);

        try {
            await ensureDmSansLoaded();

            const [
                logoData,
                photoData,
                frontTopWavesData,
                frontBottomWavesData,
                backTopWavesData,
                backBottomWavesData,
                signatureData,
                scriptNameData
            ] = await Promise.all([
                imageToBase64('/logo.jpg'),
                imageToBase64(profileData.personal.photo),
                svgToPngDataUrl(SVG_FRONT_TOP_WAVES, 600, 600),
                svgToPngDataUrl(SVG_FRONT_BOTTOM_WAVES, 600, 600),
                svgToPngDataUrl(SVG_BACK_TOP_WAVES, 600, 600),
                svgToPngDataUrl(SVG_BACK_BOTTOM_WAVES, 600, 600),
                svgToPngDataUrl(SVG_SIGNATURE, 900, 300),
                renderScriptSignature(profileData.personal.firstName)
            ]);

            const avatarData = await renderCircularAvatar(photoData, 600);

            const [
                logoImg,
                wavesFrontTopImg,
                wavesFrontBottomImg,
                wavesBackTopImg,
                wavesBackBottomImg,
                signatureImg,
                avatarImg,
                scriptNameImg
            ] = await Promise.all([
                loadImageFromDataUrl(logoData),
                loadImageFromDataUrl(frontTopWavesData),
                loadImageFromDataUrl(frontBottomWavesData),
                loadImageFromDataUrl(backTopWavesData),
                loadImageFromDataUrl(backBottomWavesData),
                loadImageFromDataUrl(signatureData),
                loadImageFromDataUrl(avatarData),
                loadImageFromDataUrl(scriptNameData)
            ]);

            const frontCardDataUrl = renderFrontCardToCanvas(profileData, {
                logo: logoImg,
                avatar: avatarImg,
                wavesTop: wavesFrontTopImg,
                wavesBottom: wavesFrontBottomImg,
                signature: signatureImg
            });
            const backCardDataUrl = renderBackCardToCanvas(profileData, {
                logo: logoImg,
                wavesTop: wavesBackTopImg,
                wavesBottom: wavesBackBottomImg,
                scriptName: scriptNameImg
            });

            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
            const pageW = 210;
            const pageH = 297;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(13, 71, 161);
            doc.text('HR VIRTUAL ID CARD', pageW / 2, 22, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text('Agilavetri Primetech Pvt. Ltd  •  Digital Identity Pass', pageW / 2, 28, { align: 'center' });

            const cardW = 90;
            const cardH = cardW * (86 / 54);
            const gap = 12;
            const totalW = cardW * 2 + gap;
            const startX = (pageW - totalW) / 2;
            const cardY = 42;
            const frontX = startX;
            const backX = startX + cardW + gap;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text('FRONT SIDE', frontX + cardW / 2, cardY - 5, { align: 'center' });
            doc.text('BACK SIDE', backX + cardW / 2, cardY - 5, { align: 'center' });

            try {
                doc.addImage(frontCardDataUrl, 'PNG', frontX, cardY, cardW, cardH, undefined, 'FAST');
            } catch (e) { console.error(e); }
            try {
                doc.addImage(backCardDataUrl, 'PNG', backX, cardY, cardW, cardH, undefined, 'FAST');
            } catch (e) { console.error(e); }

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `Generated on ${new Date().toLocaleString('en-IN')}  •  This is a computer-generated virtual ID card.`,
                pageW / 2,
                pageH - 15,
                { align: 'center' }
            );

            const safeName = (profileData.personal.fullName || 'HR').replace(/\s+/g, '_');
            const safeId = profileData.personal.employeeId || 'ID';
            doc.save(`Virtual_ID_Card_${safeName}_${safeId}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate the ID card PDF. Please try again.');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    /* ==================== SHIMMER ==================== */
    if (loading || !profileData) {
        return (
            <div className="dm-sans-root space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 w-full md:w-1/3">
                            <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="h-10 bg-slate-200 rounded-xl w-full md:w-32"></div>
                            <div className="h-10 bg-slate-200 rounded-xl w-full md:w-36"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row items-start justify-center gap-6 sm:gap-10">
                        <div className="w-full max-w-[330px] aspect-[54/86] bg-slate-200 rounded-2xl"></div>
                        <div className="w-full max-w-[330px] aspect-[54/86] bg-slate-200 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dm-sans-root space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#0437cc] transition-colors mb-2"
                        >
                            <FaArrowLeft className="text-[9px]" />
                            Back
                        </button>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2 ml-3">
                            <FaIdBadge className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Digital Identity</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">My Virtual ID Card</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
                            Official HR identity pass — download, print, or view anytime.
                        </p>
                    </div>
                </div>
            </div>

            {/* ==================== CARD VIEWER ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Toolbar */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 backdrop-blur-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1">
                            <img src="/logo.jpg" alt="AVG Logo" className="w-full h-full object-contain rounded" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Official Virtual ID Card</h2>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                                Agilavetri Primetech Pvt. Ltd • Digital Identity Pass
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <div className="inline-flex bg-slate-200/70 p-1 rounded-xl text-[11px] font-bold">
                            <button
                                type="button"
                                onClick={() => setActiveCardSide('both')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${activeCardSide === 'both' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-600 hover:text-[#010a1f]'}`}
                            >
                                Both
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveCardSide('front')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${activeCardSide === 'front' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-600 hover:text-[#010a1f]'}`}
                            >
                                Front
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveCardSide('back')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${activeCardSide === 'back' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-600 hover:text-[#010a1f]'}`}
                            >
                                Back
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleDownloadPDF}
                            disabled={isDownloadingPdf}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-[#0437cc] hover:bg-[#0437cc] hover:text-white text-xs font-bold transition-colors border border-blue-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-50 disabled:hover:text-[#0437cc]"
                            title="Download as PDF"
                        >
                            {isDownloadingPdf ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-[#0437cc]/40 border-t-[#0437cc] rounded-full animate-spin"></span>
                                    <span className="hidden sm:inline">Generating…</span>
                                </>
                            ) : (
                                <>
                                    <FaFilePdf className="text-xs" />
                                    <span className="hidden sm:inline">Download PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-8 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40">
                    <div className="flex flex-col lg:flex-row items-start justify-center gap-6 sm:gap-10">

                        {/* ==================== FRONT SIDE ==================== */}
                        {(activeCardSide === 'both' || activeCardSide === 'front') && (
                            <div className="flex flex-col items-center w-full max-w-[330px]">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
                                    Front Side
                                </span>

                                <div className="relative w-full aspect-[54/86] bg-white rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(1,10,31,0.18)] border border-slate-200/80 select-none">
                                    <svg className="absolute top-0 right-0 w-32 h-32 pointer-events-none" viewBox="0 0 200 200">
                                        <path d="M95,0 L200,0 L200,115 C165,65 135,28 95,0 Z" fill="#0d47a1" />
                                        <path d="M55,0 L125,0 C165,40 185,82 200,145 L200,175 C168,98 122,42 55,0 Z" fill="#eab308" />
                                        <path d="M25,0 L50,0 C115,44 162,98 200,180 L200,195 C155,112 102,52 25,0 Z" fill="#ca8a04" opacity="0.6" />
                                    </svg>

                                    <svg className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" viewBox="0 0 200 200">
                                        <path d="M0,95 C35,145 72,175 115,200 L0,200 Z" fill="#0d47a1" />
                                        <path d="M0,30 C35,105 82,158 155,200 L110,200 C55,162 20,115 0,55 Z" fill="#eab308" />
                                        <path d="M42,125 C78,162 118,185 175,200 L152,200 C105,182 68,155 42,125 Z" fill="#ca8a04" opacity="0.65" />
                                    </svg>

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="pt-5 flex flex-col items-center px-4">
                                            <AvgCompanyLogo size={40} />
                                            <h3 className="mt-2 text-[12px] font-black text-[#0d47a1] tracking-[0.08em] leading-tight text-center uppercase">
                                                AGILAVETRI
                                            </h3>
                                            <h4 className="text-[11px] font-black text-[#0d47a1] tracking-[0.08em] leading-tight text-center uppercase">
                                                PRIMETECH PVT. LTD
                                            </h4>
                                            <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#eab308] to-transparent mx-auto mt-2"></div>
                                            <p className="text-[7px] sm:text-[7.5px] font-semibold text-slate-600 text-center leading-[1.45] mt-2 px-1">
                                                No.472/7, Balaji Arcade, 1<sup className="text-[5px]">st</sup> floor, AVS Compound, 80ft Road, 4<sup className="text-[5px]">th</sup> Block, Ejipura, Koramangala, Bengaluru - 560034
                                            </p>
                                        </div>

                                        <div className="flex-1 flex items-center justify-center py-3">
                                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-[#ca8a04] via-[#eab308] to-[#facc15] shadow-lg">
                                                <div className="w-full h-full rounded-full p-1 bg-white">
                                                    <img
                                                        src={profileData.personal.photo}
                                                        alt={profileData.personal.fullName}
                                                        className="w-full h-full rounded-full object-cover bg-slate-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center px-4">
                                            <h2 className="text-[13px] sm:text-[14px] font-black text-[#0d47a1] uppercase tracking-wide leading-snug break-words">
                                                {profileData.personal.fullName}
                                            </h2>
                                            <div className="w-3/4 h-[2px] bg-[#0d47a1] mx-auto my-1.5 rounded-full"></div>
                                            <p className="text-[10px] sm:text-[10.5px] font-extrabold text-[#0d47a1] uppercase tracking-wider">
                                                {profileData.employment.designation}
                                            </p>
                                            <p className="text-[10px] sm:text-[10.5px] font-black text-[#010a1f] uppercase tracking-wider mt-1.5">
                                                HR ID: <span className="font-mono">{profileData.personal.employeeId}</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end pr-4 pb-3 pt-3">
                                            <IssuingAuthoritySignatureSVG className="w-20 sm:w-24 h-8 -mb-1" />
                                            <div className="text-right leading-tight">
                                                <p className="text-[8px] font-bold text-slate-800">Signature of</p>
                                                <p className="text-[8px] font-bold text-slate-800">Issuing Authority</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== BACK SIDE ==================== */}
                        {(activeCardSide === 'both' || activeCardSide === 'back') && (
                            <div className="flex flex-col items-center w-full max-w-[330px]">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
                                    Back Side
                                </span>

                                <div className="relative w-full aspect-[54/86] bg-white rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(1,10,31,0.18)] border border-slate-200/80 flex flex-col justify-between select-none p-5">
                                    <svg className="absolute top-0 right-0 w-32 h-32 pointer-events-none" viewBox="0 0 200 200">
                                        <path d="M105,0 L200,0 L200,105 C168,60 140,25 105,0 Z" fill="#0d47a1" />
                                        <path d="M60,0 L130,0 C168,38 188,80 200,140 L200,170 C170,95 125,40 60,0 Z" fill="#eab308" />
                                        <path d="M25,0 L52,0 C115,44 162,98 200,180 L200,192 C155,112 102,52 25,0 Z" fill="#ca8a04" opacity="0.6" />
                                    </svg>

                                    <svg className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" viewBox="0 0 200 200">
                                        <path d="M0,105 C32,148 68,176 108,200 L0,200 Z" fill="#0d47a1" />
                                        <path d="M0,38 C32,108 78,160 148,200 L105,200 C52,162 18,118 0,62 Z" fill="#eab308" />
                                        <path d="M38,125 C75,162 115,185 170,200 L148,200 C100,182 64,155 38,125 Z" fill="#ca8a04" opacity="0.65" />
                                    </svg>

                                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                                        <img src="/logo.jpg" alt="" className="w-44 h-44 object-contain" />
                                    </div>

                                    <div className="relative z-10 pt-2 space-y-2 text-[10px] sm:text-[10.5px] leading-snug">
                                        <div className="grid grid-cols-12 items-baseline gap-1">
                                            <span className="col-span-5 font-extrabold text-[#1e293b]">Date Of Birth</span>
                                            <span className="col-span-7 font-semibold text-slate-800">: {profileData.personal.dobIdCard}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline gap-1">
                                            <span className="col-span-5 font-extrabold text-[#1e293b]">Blood Group</span>
                                            <span className="col-span-7 font-semibold text-slate-800">: {profileData.personal.bloodGroup}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline gap-1">
                                            <span className="col-span-5 font-extrabold text-[#1e293b]">HR ID</span>
                                            <span className="col-span-7 font-semibold text-slate-800 truncate">: {profileData.personal.employeeId}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline gap-1">
                                            <span className="col-span-5 font-extrabold text-[#1e293b]">Phone No</span>
                                            <span className="col-span-7 font-semibold text-slate-800 truncate">: {profileData.personal.phone}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline gap-1">
                                            <span className="col-span-5 font-extrabold text-[#1e293b]">Address</span>
                                            <span className="col-span-7 font-semibold text-slate-800 break-words line-clamp-3">
                                                : {profileData.personal.address}
                                            </span>
                                        </div>
                                        <div className="pt-1 flex items-baseline gap-1.5">
                                            <span className="font-extrabold text-[#1e293b] shrink-0">Email :</span>
                                            <span className="font-semibold text-slate-800 truncate text-[9.5px]">
                                                {profileData.personal.email}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center justify-center text-center my-1">
                                        <AvgCompanyLogo size={32} showTm={true} />
                                        <p className="text-[7.5px] font-extrabold tracking-[0.08em] text-slate-700 uppercase mt-1.5">
                                            CREATING MILLIONAIRES
                                        </p>
                                        <p className="text-[7.5px] font-bold text-slate-600 mt-0.5">
                                            2026-2027
                                        </p>
                                    </div>

                                    <div className="relative z-10 pb-1 pr-2 flex flex-col items-end">
                                        <div
                                            className="text-lg sm:text-xl italic text-slate-800 tracking-wide px-2 -mb-1 select-none"
                                            style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
                                        >
                                            {profileData.personal.firstName}
                                        </div>
                                        <p className="text-[9px] font-extrabold text-[#1e293b] tracking-wide">
                                            Employee Signature
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
                        This virtual ID card is dynamically linked to your verified employee profile.
                    </p>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            icon={FaSyncAlt}
                            onClick={() => setActiveCardSide(prev => prev === 'front' ? 'back' : prev === 'back' ? 'both' : 'front')}
                            className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50 text-xs py-2 rounded-xl"
                        >
                            Switch View
                        </Button>
                        <Button
                            variant="outline"
                            icon={FaArrowLeft}
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white text-xs py-2 rounded-xl"
                        >
                            Back to Profile
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRVirtualIDCom;