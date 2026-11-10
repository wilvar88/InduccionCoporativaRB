// Vercel Serverless Function: Lee y guarda automáticamente memoria-progreso.json en el repositorio GitHub
const GITHUB_OWNER = 'wilvar88';
const GITHUB_REPO = 'InduccionCoporativaRB';
const GITHUB_BRANCH = 'main';
const FILE_PATH = 'memoria-progreso.json';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-GitHub-Token');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || req.headers['x-github-token'] || '';
    const ghHeaders = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'InduccionCorporativaRB-Vercel-App'
    };
    if (token) {
        ghHeaders['Authorization'] = `Bearer ${token}`;
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // GET: Consultar el archivo memoria-progreso.json más reciente directamente desde GitHub
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}&_ts=${Date.now()}`, {
                headers: ghHeaders,
                cache: 'no-store'
            });

            if (!response.ok) {
                return res.status(response.status).json({ error: 'No se pudo leer memoria-progreso.json desde GitHub' });
            }

            const data = await response.json();
            const contentJson = Buffer.from(data.content || '', 'base64').toString('utf-8');
            const parsed = JSON.parse(contentJson);
            return res.status(200).json(parsed);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // POST / PUT: Guardar automáticamente memoria-progreso.json en el repositorio GitHub
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!token) {
            return res.status(401).json({
                ok: false,
                needsToken: true,
                message: 'Falta configurar GITHUB_TOKEN en Vercel o en el panel Super Administrador para guardado directo en la nube.'
            });
        }

        try {
            const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!payload || typeof payload !== 'object') {
                return res.status(400).json({ ok: false, message: 'Payload JSON inválido' });
            }

            // 1. Obtener el SHA actual de memoria-progreso.json en GitHub
            let currentSha = undefined;
            const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
                headers: ghHeaders,
                cache: 'no-store'
            });

            if (getRes.ok) {
                const fileMeta = await getRes.json();
                currentSha = fileMeta.sha;
            }

            // 2. Codificar el JSON actualizado en Base64 y hacer commit en GitHub
            const jsonString = JSON.stringify(payload, null, 2);
            const base64Content = Buffer.from(jsonString, 'utf-8').toString('base64');

            const putRes = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    ...ghHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Actualización automática de contenidos y progreso (${new Date().toISOString()})`,
                    content: base64Content,
                    sha: currentSha,
                    branch: GITHUB_BRANCH
                })
            });

            if (!putRes.ok) {
                const errText = await putRes.text();
                return res.status(putRes.status).json({ ok: false, message: errText });
            }

            // 3. Actualizar también memoria-progreso.js de forma opcional para mantener sincronía total
            try {
                const jsPathUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/memoria-progreso.js`;
                const getJsRes = await fetch(`${jsPathUrl}?ref=${GITHUB_BRANCH}`, { headers: ghHeaders, cache: 'no-store' });
                let jsSha = undefined;
                if (getJsRes.ok) {
                    const jsMeta = await getJsRes.json();
                    jsSha = jsMeta.sha;
                }
                const jsContent = `// Archivo de memoria inicial compatible con apertura local (file://) y sincronizado con memoria-progreso.json\nwindow.RB_MEMORIA_INICIAL_JSON = ${jsonString};\n`;
                await fetch(jsPathUrl, {
                    method: 'PUT',
                    headers: { ...ghHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: `Sincronización automática memoria-progreso.js`,
                        content: Buffer.from(jsContent, 'utf-8').toString('base64'),
                        sha: jsSha,
                        branch: GITHUB_BRANCH
                    })
                });
            } catch (e) {}

            return res.status(200).json({ ok: true, updatedAt: payload.ultimaActualizacion });
        } catch (err) {
            return res.status(500).json({ ok: false, message: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

