// Vercel Serverless Function: Lee, fusiona por usuario y guarda automáticamente memoria-progreso.json en GitHub
const crypto = require('crypto');

const GITHUB_OWNER = 'wilvar88';
const GITHUB_REPO = 'InduccionCoporativaRB';
const GITHUB_BRANCH = 'main';
const FILE_PATH = 'memoria-progreso.json';

// Clave de cifrado derivada en servidor para el vault de sincronización automática multi-navegador
const VAULT_SECRET = crypto
    .createHash('sha256')
    .update(`RB_INDUCCION_SYNC_VAULT_${GITHUB_OWNER}_${GITHUB_REPO}_2026`)
    .digest();

function encryptTokenToVault(plainToken) {
    if (!plainToken || typeof plainToken !== 'string') return null;
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', VAULT_SECRET, iv);
        const encrypted = Buffer.concat([cipher.update(plainToken.trim(), 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
    } catch (e) {
        return null;
    }
}

function decryptTokenFromVault(vaultStr) {
    if (!vaultStr || typeof vaultStr !== 'string') return '';
    try {
        const parts = vaultStr.split('.');
        if (parts.length !== 3) return '';
        const iv = Buffer.from(parts[0], 'base64');
        const tag = Buffer.from(parts[1], 'base64');
        const encrypted = Buffer.from(parts[2], 'base64');
        const decipher = crypto.createDecipheriv('aes-256-gcm', VAULT_SECRET, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8').trim();
    } catch (e) {
        return '';
    }
}

function esMasReciente(incoming, existing) {
    if (!existing) return true;
    if (!incoming) return false;
    if (incoming.updatedAt && existing.updatedAt) {
        return new Date(incoming.updatedAt).getTime() >= new Date(existing.updatedAt).getTime();
    }
    return true;
}

// Fusión atómica en servidor: garantiza que ningún navegador pise o borre el avance de otro navegador o usuario
function fusionarMemoriaEnServidor(actual, entrante) {
    if (!actual || typeof actual !== 'object') return entrante;
    if (!entrante || typeof entrante !== 'object') return actual;

    const resultado = {
        ...actual,
        ...entrante,
        ultimaActualizacion: new Date().toISOString(),
        version: '2.3'
    };

    // Preservar _syncVault si existe en cualquiera de los dos
    if (entrante._syncVault || actual._syncVault) {
        resultado._syncVault = entrante._syncVault || actual._syncVault;
    }

    // 1. Fusionar temasEliminados
    const elimSet = new Set([
        ...(Array.isArray(actual.temasEliminados) ? actual.temasEliminados.map(Number) : [21, 22, 23]),
        ...(Array.isArray(entrante.temasEliminados) ? entrante.temasEliminados.map(Number) : [])
    ].filter(Boolean));
    resultado.temasEliminados = Array.from(elimSet);

    // 2. Fusionar temasAgregados
    const agregadosMap = new Map();
    if (Array.isArray(actual.temasAgregados)) {
        actual.temasAgregados.forEach(item => {
            if (item && item.colIndex && !elimSet.has(Number(item.colIndex))) {
                agregadosMap.set(Number(item.colIndex), item);
            }
        });
    }
    if (Array.isArray(entrante.temasAgregados)) {
        entrante.temasAgregados.forEach(item => {
            if (item && item.colIndex && !elimSet.has(Number(item.colIndex))) {
                const col = Number(item.colIndex);
                const prev = agregadosMap.get(col);
                if (esMasReciente(item, prev)) {
                    agregadosMap.set(col, item);
                }
            }
        });
    }
    resultado.temasAgregados = Array.from(agregadosMap.values());

    // 3. Fusionar contenidosTemas
    const temasCombinados = { ...(actual.contenidosTemas || {}) };
    const temasEntrantes = entrante.contenidosTemas || {};
    Object.keys(temasEntrantes).forEach(k => {
        const numCol = Number(k);
        if (!numCol || elimSet.has(numCol)) return;
        const item = temasEntrantes[k];
        const prev = temasCombinados[k];
        if (esMasReciente(item, prev)) {
            temasCombinados[k] = item;
        }
    });
    elimSet.forEach(colElim => {
        delete temasCombinados[colElim];
        delete temasCombinados[String(colElim)];
    });
    resultado.contenidosTemas = temasCombinados;
    resultado.totalTemasPersonalizados = Object.keys(temasCombinados).length;

    // 4. Fusionar colaboradores y su progreso por usuario (UNIÓN ADITIVA DE AVANCES)
    const colabActuales = actual.colaboradores || {};
    const colabEntrantes = entrante.colaboradores || {};
    const todasCedulas = new Set([...Object.keys(colabActuales), ...Object.keys(colabEntrantes)]);
    const colabFusionados = {};

    todasCedulas.forEach(cedula => {
        const cAct = colabActuales[cedula];
        const cEnt = colabEntrantes[cedula];
        if (!cAct) {
            colabFusionados[cedula] = cEnt;
            return;
        }
        if (!cEnt) {
            colabFusionados[cedula] = cAct;
            return;
        }

        // Unión aditiva de progresoModulos (si un tema fue visto en cualquier navegador del mundo, se conserva en true)
        const progAct = cAct.progresoModulos || {};
        const progEnt = cEnt.progresoModulos || {};
        const modIds = new Set([...Object.keys(progAct), ...Object.keys(progEnt)]);
        const progFusionado = {};

        modIds.forEach(modId => {
            progFusionado[modId] = {
                ...(progAct[modId] || {}),
                ...(progEnt[modId] || {})
            };
        });

        // Determinar cuál registro tiene más avance o actividad más reciente
        const vistosAct = Number(cAct.temasVistos) || 0;
        const vistosEnt = Number(cEnt.temasVistos) || 0;
        const ingresosAct = Number(cAct.cantidadIngresos) || 0;
        const ingresosEnt = Number(cEnt.cantidadIngresos) || 0;
        const preferirEntrante = (vistosEnt >= vistosAct) || (ingresosEnt >= ingresosAct);
        const base = preferirEntrante ? { ...cAct, ...cEnt } : { ...cEnt, ...cAct };

        colabFusionados[cedula] = {
            ...base,
            primerIngreso: (cAct.primerIngreso && cAct.primerIngreso !== 'Sin registro')
                ? cAct.primerIngreso
                : (cEnt.primerIngreso || 'Sin registro'),
            ultimoIngreso: (ingresosEnt >= ingresosAct && cEnt.ultimoIngreso && cEnt.ultimoIngreso !== 'Sin registro')
                ? cEnt.ultimoIngreso
                : (cAct.ultimoIngreso || cEnt.ultimoIngreso || 'Sin registro'),
            cantidadIngresos: Math.max(ingresosAct, ingresosEnt),
            modulosCompletados: Math.max(Number(cAct.modulosCompletados) || 0, Number(cEnt.modulosCompletados) || 0),
            totalModulosHabilitados: Number(cEnt.totalModulosHabilitados) || Number(cAct.totalModulosHabilitados) || 0,
            temasVistos: Math.max(vistosAct, vistosEnt),
            totalTemasHabilitados: Number(cEnt.totalTemasHabilitados) || Number(cAct.totalTemasHabilitados) || 0,
            porcentajeAvance: Math.max(Number(cAct.porcentajeAvance) || 0, Number(cEnt.porcentajeAvance) || 0),
            moduloActual: (vistosEnt >= vistosAct ? cEnt.moduloActual : cAct.moduloActual) || cEnt.moduloActual || cAct.moduloActual || 'Sin iniciar',
            temaActual: (vistosEnt >= vistosAct ? cEnt.temaActual : cAct.temaActual) || cEnt.temaActual || cAct.temaActual || 'Sin iniciar',
            ultimoModuloId: cEnt.ultimoModuloId || cAct.ultimoModuloId || null,
            ultimoModuloNombre: cEnt.ultimoModuloNombre || cAct.ultimoModuloNombre || '',
            ultimoTemaTitulo: cEnt.ultimoTemaTitulo || cAct.ultimoTemaTitulo || '',
            progresoModulos: progFusionado
        };
    });

    resultado.colaboradores = colabFusionados;
    resultado.totalColaboradores = Object.keys(colabFusionados).length;

    return resultado;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-GitHub-Token');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const headerToken = (req.headers['x-github-token'] || '').trim();
    if (headerToken) {
        globalThis.__RB_GH_TOKEN_CACHE = headerToken;
    }

    let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || headerToken || globalThis.__RB_GH_TOKEN_CACHE || '';

    const buildHeaders = (tk) => {
        const h = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'InduccionCorporativaRB-Vercel-App'
        };
        if (tk) h['Authorization'] = `Bearer ${tk}`;
        return h;
    };

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // GET: Consultar el archivo memoria-progreso.json más reciente directamente desde GitHub
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}&_ts=${Date.now()}`, {
                headers: buildHeaders(token),
                cache: 'no-store'
            });

            if (!response.ok) {
                return res.status(response.status).json({ error: 'No se pudo leer memoria-progreso.json desde GitHub' });
            }

            const data = await response.json();
            const contentJson = Buffer.from(data.content || '', 'base64').toString('utf-8');
            const parsed = JSON.parse(contentJson);

            // Si el archivo tiene _syncVault cifrado, hidratar la caché del servidor para permitir escritura desde cualquier navegador
            if (!token && parsed && parsed._syncVault) {
                const unlocked = decryptTokenFromVault(parsed._syncVault);
                if (unlocked) {
                    globalThis.__RB_GH_TOKEN_CACHE = unlocked;
                }
            }

            return res.status(200).json(parsed);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // POST / PUT: Fusionar y guardar automáticamente memoria-progreso.json en el repositorio GitHub
    if (req.method === 'POST' || req.method === 'PUT') {
        try {
            const incomingPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!incomingPayload || typeof incomingPayload !== 'object') {
                return res.status(400).json({ ok: false, message: 'Payload JSON inválido' });
            }

            // Reintentar hasta 3 veces en caso de escrituras simultáneas (409 Conflict)
            for (let attempt = 1; attempt <= 3; attempt++) {
                let currentSha = undefined;
                let currentJsonOnGitHub = null;

                const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}&_ts=${Date.now()}`, {
                    headers: buildHeaders(token),
                    cache: 'no-store'
                });

                if (getRes.ok) {
                    const fileMeta = await getRes.json();
                    currentSha = fileMeta.sha;
                    try {
                        const rawStr = Buffer.from(fileMeta.content || '', 'base64').toString('utf-8');
                        currentJsonOnGitHub = JSON.parse(rawStr);
                    } catch (e) {}
                }

                // Si este navegador no envió token pero memoria-progreso.json ya tiene el _syncVault cifrado, desbloquearlo en el servidor
                if (!token && currentJsonOnGitHub && currentJsonOnGitHub._syncVault) {
                    const unlocked = decryptTokenFromVault(currentJsonOnGitHub._syncVault);
                    if (unlocked) {
                        token = unlocked;
                        globalThis.__RB_GH_TOKEN_CACHE = unlocked;
                    }
                }

                if (!token) {
                    return res.status(401).json({
                        ok: false,
                        needsToken: true,
                        message: 'Falta configurar GITHUB_TOKEN en Vercel o abrir una vez con el navegador Administrador para activar el guardado global.'
                    });
                }

                // Fusionar los datos entrantes con los actuales en GitHub para nunca perder el progreso de ningún usuario
                const mergedPayload = fusionarMemoriaEnServidor(currentJsonOnGitHub, incomingPayload);

                // Si tenemos token válido, asegurar que el _syncVault cifrado quede guardado en memoria-progreso.json
                if (token && !mergedPayload._syncVault) {
                    const encryptedVault = encryptTokenToVault(token);
                    if (encryptedVault) {
                        mergedPayload._syncVault = encryptedVault;
                    }
                }

                const jsonString = JSON.stringify(mergedPayload, null, 2);
                const base64Content = Buffer.from(jsonString, 'utf-8').toString('base64');

                const putRes = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        ...buildHeaders(token),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Actualización automática de progreso y contenidos (${new Date().toISOString()})`,
                        content: base64Content,
                        sha: currentSha,
                        branch: GITHUB_BRANCH
                    })
                });

                if (putRes.ok) {
                    // Solo actualizar memoria-progreso.js cuando cambian contenidos de temas (evita doble commit en cada clic de avance)
                    if (incomingPayload._syncJsFile === true) {
                        try {
                            const jsPathUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/memoria-progreso.js`;
                            const getJsRes = await fetch(`${jsPathUrl}?ref=${GITHUB_BRANCH}`, {
                                headers: buildHeaders(token),
                                cache: 'no-store'
                            });
                            let jsSha = undefined;
                            if (getJsRes.ok) {
                                const jsMeta = await getJsRes.json();
                                jsSha = jsMeta.sha;
                            }
                            const jsContent = `// Archivo de memoria inicial compatible con apertura local (file://) y sincronizado con memoria-progreso.json\nwindow.RB_MEMORIA_INICIAL_JSON = ${jsonString};\n`;
                            await fetch(jsPathUrl, {
                                method: 'PUT',
                                headers: { ...buildHeaders(token), 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    message: `Sincronización automática memoria-progreso.js`,
                                    content: Buffer.from(jsContent, 'utf-8').toString('base64'),
                                    sha: jsSha,
                                    branch: GITHUB_BRANCH
                                })
                            });
                        } catch (e) {}
                    }

                    return res.status(200).json({
                        ok: true,
                        updatedAt: mergedPayload.ultimaActualizacion,
                        colaboradores: mergedPayload.colaboradores
                    });
                }

                // Si hubo conflicto de SHA (409 o 422) por guardados simultáneos, esperar un instante y reintentar
                if ((putRes.status === 409 || putRes.status === 422) && attempt < 3) {
                    await new Promise(r => setTimeout(r, 250 * attempt));
                    continue;
                }

                const errText = await putRes.text();
                return res.status(putRes.status).json({ ok: false, message: errText });
            }
        } catch (err) {
            return res.status(500).json({ ok: false, message: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
