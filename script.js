// =============================================================================
// PLATAFORMA DE INDUCCIÓN CORPORATIVA RECAUDO BOGOTÁ - SCRIPT PRINCIPAL
// =============================================================================

// CONFIGURACIÓN DE GOOGLE SHEETS
const GOOGLE_SHEET_ID = '1JWiXz7C8vH46-1snEPv7mDzY9AOikKo9-nmu4pLYLPo';
const EMPLOYEES_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv`;
const MODULES_CARGO_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=M%C3%B3dulos%20por%20cargo`;

const DEFAULT_AVATAR = 'assets/Foto predeterminada perfil.png';

// ESTADO GLOBAL DE LA APLICACIÓN
let colaboradoresData = [];
let modulosPorCargoData = [];
let currentUser = null;
let currentCategoriaFilter = 'todos';
let activeAudio = null;
let currentZoomOrg = 1;
let currentModuloIdViewer = null;
let currentSubtemaIndexViewer = 0;
let activeBlobUrl = null;
let superAdminVerTodosModulos = false;

// Estado de seguimiento del 50% de visualización en el visor
let viewerProgressTimer = null;
let currentViewerPercent = 0;
let currentViewerAutoMarked = false;

// Handle de archivo físico memoria-progreso.json (File System Access API)
let jsonFileHandleDisco = null;

// Estado del Editor Super Administrador
let saCurrentModuloId = 1;
let saCurrentSubtemaColIndex = 1;
let saCurrentMaterialType = 'video';
let saTempUploadedData = {
    videoDataUrl: null,
    videoFileName: null,
    pdfDataUrl: null,
    pdfFileName: null,
    audioDataUrl: null
};

// JERARQUÍA OFICIAL DE CARGOS (DE MAYOR A MENOR)
const JERARQUIA_CARGOS = [
    'PRESIDENTE',
    'GERENTE',
    'DIRECTOR',
    'JEFE',
    'COORDINADOR',
    'SUPERVISOR',
    'ANALISTA SENIOR',
    'ANALISTA III',
    'ANALISTAS III',
    'ANALISTA II',
    'ANALISTAS II',
    'ANALISTA I',
    'ANALISTAS I',
    'ASISTENTE',
    'AUXILIAR',
    'PRACTICANTE',
    'APRENDIZ'
];

// =============================================================================
// CATÁLOGO COMPLETO DE LOS 14 MÓDULOS Y LOS 81 TEMAS DE LA HOJA "MÓDULOS POR CARGO"
// Cada subtema tiene `colIndex` (1..81) que corresponde exactamente a la columna
// en la hoja "Módulos por cargo" (Columna B = 1 ... Columna CD = 81).
// =============================================================================
const CATALOGO_MODULOS_BASE = [
    {
        id: 1,
        slug: 'bienvenida',
        numero: 'Módulo 1',
        titulo: 'Bienvenida e introducción corporativa',
        icono: 'fas fa-handshake',
        imagen: 'assets/Imagenes bienvenida Inducción Corporativa.jpg',
        subtemas: [
            {
                colIndex: 1,
                titulo: 'Bienvenida',
                tipo: 'video',
                url: 'https://drive.google.com/file/d/1dFfBkMjmj4kT9VCFzPoDiB4hr_CtR-3I/preview',
                audio: 'assets/audios/modulo1-bienvenida.mp3',
                popup: { titulo: 'Mensaje de la Presidencia', content: '<p>Bienvenido a Recaudo Bogotá S.A.S. Nos complace tenerte en nuestro equipo.</p>' }
            },
            {
                colIndex: 2,
                titulo: 'Objetivo de la inducción',
                tipo: 'html',
                content: '<h3>Objetivo de la Inducción</h3><p>Facilitar la integración de los nuevos colaboradores a la cultura, estructura y operaciones de Recaudo Bogotá S.A.S.</p>',
                audio: 'assets/audios/modulo1-objetivo.mp3'
            },
            {
                colIndex: 3,
                titulo: '¿Quiénes somos?',
                tipo: 'html',
                content: '<h3>¿Quiénes somos?</h3><p>Somos la empresa concesionaria responsable de la recaudación, control de flota e información al usuario del Sistema Integrado de Transporte Público (SITP) de Bogotá.</p>'
            },
            {
                colIndex: 4,
                titulo: 'Misión',
                tipo: 'html',
                content: '<h3>Misión</h3><p>Proveer soluciones tecnológicas integrales para el recaudo, control de flota e información al usuario del transporte público con excelencia operacional y vocación de servicio.</p>'
            },
            {
                colIndex: 5,
                titulo: 'Visión',
                tipo: 'html',
                content: '<h3>Visión</h3><p>Ser referentes globales en sistemas inteligentes de transporte masivo e innovación en movilidad urbana sostenible.</p>'
            },
            {
                colIndex: 6,
                titulo: 'Historia de la compañía',
                tipo: 'html',
                content: '<h3>Nuestra Historia</h3><p>Desde 2011 hemos transformado la movilidad de la capital conectando a millones de usuarios diariamente a través del sistema integrado de recaudo.</p>'
            },
            {
                colIndex: 7,
                titulo: 'Contexto general de la organización',
                tipo: 'html',
                content: '<h3>Contexto General de la Organización</h3><p>Operamos la red tecnológica troncal y zonal más importante del país en articulación con TransMilenio S.A. y los concesionarios de transporte.</p>'
            }
        ]
    },
    {
        id: 2,
        slug: 'negocio',
        numero: 'Módulo 2',
        titulo: 'Conociendo nuestro negocio',
        icono: 'fas fa-bus',
        imagen: 'assets/video-procesos.jpg',
        subtemas: [
            { colIndex: 8, titulo: 'Transmilenio', tipo: 'html', content: '<h3>Componente Troncal - TransMilenio</h3><p>Comprende el sistema de buses articulados y biarticulados que circulan por corredores exclusivos y estaciones troncales de Bogotá.</p>' },
            { colIndex: 9, titulo: 'SITP', tipo: 'html', content: '<h3>Sistema Integrado de Transporte Público (SITP)</h3><p>Integra el transporte urbano, complementario, especial y alimentador bajo un esquema tarifario y operativo unificado.</p>' },
            { colIndex: 10, titulo: 'Tullave', tipo: 'html', content: '<h3>Tarjeta inteligente Tullave</h3><p>Medio de pago electrónico unificado que permite a los ciudadanos acceder a todos los componentes del sistema y disfrutar de beneficios como transbordos.</p>' },
            { colIndex: 11, titulo: 'SIRCI', tipo: 'html', content: '<h3>Sistema SIRCI</h3><p>Sistema Integrado de Recaudo, Control de Flota e Información al Usuario operado por Recaudo Bogotá S.A.S.</p>' },
            { colIndex: 12, titulo: 'Recaudo', tipo: 'html', content: '<h3>Operación de Recaudo</h3><p>Gestión y aseguramiento de los ingresos tarifarios a través de la red de recarga interna, externa y medios digitales.</p>' },
            { colIndex: 13, titulo: 'Control de flota', tipo: 'html', content: '<h3>Control de Flota</h3><p>Monitoreo satelital (GPS) y gestión en tiempo real de la operación de los buses del sistema.</p>' },
            { colIndex: 14, titulo: 'Información al usuario', tipo: 'html', content: '<h3>Información al Usuario</h3><p>Ecosistema de paneles informativos en estaciones, pantallas a bordo, canales digitales y atención presencial.</p>' },
            { colIndex: 15, titulo: 'Estructura general del sistema', tipo: 'html', content: '<h3>Estructura General del Sistema</h3><p>Interacción operativa entre el Ente Gestor (TransMilenio S.A.), Concesionarios de Operación y el Concesionario SIRCI (Recaudo Bogotá).</p>' }
        ]
    },
    {
        id: 3,
        slug: 'tecnologia_recaudo',
        numero: 'Módulo 3',
        titulo: 'Tecnología y sistemas de recaudo',
        icono: 'fas fa-microchip',
        imagen: 'assets/video-seguridad.jpg',
        subtemas: [
            { colIndex: 16, titulo: 'Estructura tecnológica de recaudo', tipo: 'html', content: '<h3>Estructura Tecnológica de Recaudo</h3><p>Arquitectura de alta disponibilidad que conecta los dispositivos de validación y recarga con los servidores centrales.</p>' },
            { colIndex: 17, titulo: 'Pago de pasaje', tipo: 'html', content: '<h3>Proceso de Pago de Pasaje</h3><p>Flujo transaccional sin contacto desde la validación de la tarjeta hasta la compensación centralizada.</p>' },
            { colIndex: 18, titulo: 'Tecnología zonal y troncal', tipo: 'html', content: '<h3>Tecnología Zonal y Troncal</h3><p>Equipamiento embarcado en buses zonales y equipamiento fijo en estaciones y portales troncales.</p>' },
            { colIndex: 19, titulo: 'Validadores y Torniquetes', tipo: 'html', content: '<h3>Validadores y Torniquetes</h3><p>Lectores sin contacto de alta velocidad instalados en buses y accesos de estaciones.</p>' },
            { colIndex: 20, titulo: 'BCA, DCA, TCS', tipo: 'html', content: '<h3>Dispositivos BCA, DCA y TCS</h3><p>Barreras de Control de Acceso (BCA), Dispositivos de Control de Acceso para personas con movilidad reducida (DCA) y Terminales de Taquilla (TCS).</p>' },
            { colIndex: 21, titulo: 'Dispositivos de recarga', tipo: 'html', content: '<h3>Dispositivos de Recarga</h3><p>Taquillas troncales, máquinas de autorrecarga (ATM), dispositivos POS en la red externa y recargas web.</p>' },
            { colIndex: 22, titulo: 'Control de flota', tipo: 'html', content: '<h3>Tecnología de Control de Flota</h3><p>Unidades lógicas a bordo (OBU), consolas del conductor y comunicación de datos en tiempo real con el Centro de Control.</p>' },
            { colIndex: 23, titulo: 'Principales equipos y dispositivos', tipo: 'html', content: '<h3>Principales Equipos y Dispositivos</h3><p>Resumen del hardware operativo que soporta la continuidad del servicio en vía y estaciones.</p>' }
        ]
    },
    {
        id: 4,
        slug: 'tarjetas',
        numero: 'Módulo 4',
        titulo: 'Tarjetas y medios de acceso',
        icono: 'fas fa-id-card',
        imagen: 'assets/Acoso laboral y Sexual.jpg',
        subtemas: [
            { colIndex: 24, titulo: 'Tarjeta básica', tipo: 'html', content: '<h3>Tarjeta Tullave Básica</h3><p>Tarjeta al portador que permite el ingreso al sistema sin registro previo de datos personales.</p>' },
            { colIndex: 25, titulo: 'Personalizada Plus', tipo: 'html', content: '<h3>Tarjeta Tullave Plus (Personalizada)</h3><p>Tarjeta marcada con los datos del usuario que otorga beneficios de transbordo a menor costo, viaje a crédito y recuperación de saldo en caso de pérdida.</p>' },
            { colIndex: 26, titulo: 'Discapacidad', tipo: 'html', content: '<h3>Tarjeta de Discapacidad</h3><p>Medio de acceso con beneficio de subsidio mensual dirigido a población con discapacidad registrada en el Distrito.</p>' },
            { colIndex: 27, titulo: 'Adulto Mayor', tipo: 'html', content: '<h3>Tarjeta Adulto Mayor</h3><p>Tarifa diferencial para personas mayores beneficiarias de acuerdo con la normatividad distrital vigente.</p>' },
            { colIndex: 28, titulo: 'Apoyo Ciudadano', tipo: 'html', content: '<h3>Tarjeta Apoyo Ciudadano (Sisbén)</h3><p>Incentivo tarifario focalizado para ciudadanos clasificados en los grupos definidos del Sisbén en Bogotá.</p>' },
            { colIndex: 29, titulo: 'Tarjetas híbridas', tipo: 'html', content: '<h3>Tarjetas Híbridas y Bancarias</h3><p>Tarjetas débito/crédito de entidades financieras aliadas con funcionalidad de transporte integrada.</p>' },
            { colIndex: 30, titulo: 'Características y usos', tipo: 'html', content: '<h3>Características y Usos de los Medios de Pago</h3><p>Reglas de uso, vigencia, cuidado del chip sin contacto y canales de personalización.</p>' }
        ]
    },
    {
        id: 5,
        slug: 'organizacion',
        numero: 'Módulo 5',
        titulo: 'Organización y roles',
        icono: 'fas fa-sitemap',
        imagen: 'assets/Gobierno Corporativo.jpg',
        subtemas: [
            { colIndex: 31, titulo: 'Organigrama', tipo: 'html', content: '<h3>Organigrama Corporativo</h3><p>Puedes consultar tu línea de mando y equipo de área haciendo clic en el botón <strong>Organigrama</strong> en la barra superior.</p>' },
            { colIndex: 32, titulo: 'Estructura de la organización', tipo: 'html', content: '<h3>Estructura de la Organización</h3><p>Presidencia, Vicepresidencia Operativa, Gerencias y Jefaturas que articulan nuestra gestión estratégica y táctica.</p>' },
            { colIndex: 33, titulo: 'Principales áreas', tipo: 'html', content: '<h3>Principales Áreas de Recaudo Bogotá</h3><p>Operaciones, Mantenimiento, Tecnología (TI), Gestión Humana y HSE, Financiera, Jurídica y Compras.</p>' },
            { colIndex: 34, titulo: 'Roles operativos:', tipo: 'html', content: '<h3>Roles Operativos</h3><p>Equipos de campo, técnicos de mantenimiento, personal de taquillas, anfitriones, supervisores y analistas de centro de control.</p>' }
        ]
    },
    {
        id: 6,
        slug: 'hse_politica',
        numero: 'Módulo 6',
        titulo: 'Política HSE',
        icono: 'fas fa-shield-heart',
        imagen: 'assets/HSE Caratula.jpg',
        subtemas: [
            { colIndex: 35, titulo: 'Política HSE', tipo: 'html', content: '<h3>Política Integral HSE</h3><p>Directrices del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) y Gestión Ambiental de Recaudo Bogotá S.A.S.</p>' },
            { colIndex: 36, titulo: 'Compromiso de la organización con la salud, seguridad y ambiente', tipo: 'html', content: '<h3>Compromiso con la Salud, Seguridad y Ambiente</h3><p>Compromiso permanente con la identificación de peligros, valoración de riesgos, prevención de lesiones y mitigación del impacto ambiental.</p>' },
            { colIndex: 37, titulo: 'Principios y responsabilidades generales', tipo: 'html', content: '<h3>Principios y Responsabilidades Generales</h3><p>Autocuidado, cumplimiento de normas de seguridad, participación en brigadas y reporte oportuno de condiciones o actos inseguros.</p>' }
        ]
    },
    {
        id: 7,
        slug: 'hse_mantenimiento',
        numero: 'Módulo 7',
        titulo: 'Políticas HSE – Mantenimiento',
        icono: 'fas fa-tools',
        imagen: 'assets/HSE Caratula.jpg',
        subtemas: [
            { colIndex: 38, titulo: 'Políticas HSE específicas para Mantenimiento', tipo: 'html', content: '<h3>Políticas HSE Específicas para Mantenimiento</h3><p>Protocolos de seguridad para tareas de alto riesgo, trabajo en alturas, riesgo eléctrico y bloqueo/etiquetado (LOTO).</p>' },
            { colIndex: 39, titulo: 'Riesgos asociados a las actividades de mantenimiento', tipo: 'html', content: '<h3>Riesgos Asociados a Mantenimiento</h3><p>Prevención frente a riesgos mecánicos, eléctricos, locativos, biomecánicos, públicos y viales durante las intervenciones técnicas.</p>' },
            { colIndex: 40, titulo: 'Lineamientos específicos aplicables al cargo', tipo: 'html', content: '<h3>Lineamientos Específicos Aplicables al Cargo</h3><p>Uso obligatorio de Elementos de Protección Personal (EPP) certificados, inspección preoperacional de herramientas y permisos de trabajo.</p>' }
        ]
    },
    {
        id: 8,
        slug: 'seguridad_informatica',
        numero: 'Módulo 8',
        titulo: 'Seguridad informática',
        icono: 'fas fa-lock',
        imagen: 'assets/seguridad de la información.jpg',
        subtemas: [
            { colIndex: 41, titulo: 'Seguridad informática general', tipo: 'html', content: '<h3>Seguridad Informática General</h3><p>Principios de Confidencialidad, Integridad y Disponibilidad de la información corporativa.</p>' },
            { colIndex: 42, titulo: 'Ciberseguridad general (Introducción)', tipo: 'html', content: '<h3>Introducción a la Ciberseguridad</h3><p>Importancia de proteger la infraestructura tecnológica crítica del sistema de recaudo de la ciudad.</p>' },
            { colIndex: 43, titulo: 'Buenas prácticas en el uso de equipos', tipo: 'html', content: '<h3>Buenas Prácticas en el Uso de Equipos</h3><p>Bloqueo de sesión al ausentarse (Win + L), prohibición de instalar software no autorizado y cuidado de equipos asignados.</p>' },
            { colIndex: 44, titulo: 'Protección de credenciales', tipo: 'html', content: '<h3>Protección de Credenciales</h3><p>Uso de contraseñas seguras, personales e intransferibles y autenticación multifactor.</p>' },
            { colIndex: 45, titulo: 'Manejo seguro de la información', tipo: 'html', content: '<h3>Manejo Seguro de la Información</h3><p>Clasificación de la información, escritorio limpio y uso exclusivo de canales corporativos autorizados.</p>' },
            { colIndex: 46, titulo: 'Prevención frente a amenazas digitales', tipo: 'html', content: '<h3>Prevención frente a Amenazas Digitales</h3><p>Cómo identificar y reportar intentos de Phishing, ingeniería social, malware y enlaces sospechosos.</p>' }
        ]
    },
    {
        id: 9,
        slug: 'gobierno_etica',
        numero: 'Módulo 9',
        titulo: 'Gobierno corporativo y ética',
        icono: 'fas fa-balance-scale',
        imagen: 'assets/Gobierno Corporativo.jpg',
        subtemas: [
            { colIndex: 47, titulo: 'Gobierno corporativo', tipo: 'html', content: '<h3>Gobierno Corporativo y Código de Ética</h3><p>Valores corporativos, transparencia, prevención de conflictos de interés y actuación íntegra en Recaudo Bogotá S.A.S.</p>' },
            { colIndex: 48, titulo: 'Tratamiento y Protección de datos personales 🎥', tipo: 'html', content: '<h3>Tratamiento y Protección de Datos Personales</h3><p>Cumplimiento de la Ley 1581 de 2012 (Habeas Data) en el manejo de información de usuarios y colaboradores.</p>' },
            { colIndex: 49, titulo: 'Acoso laboral y Acoso sexual 🎥', tipo: 'html', content: '<h3>Prevención del Acoso Laboral y Sexual</h3><p>Política de cero tolerancia frente a cualquier conducta de acoso laboral o sexual y ruta de atención del Comité de Convivencia.</p>' },
            { colIndex: 50, titulo: 'Conductas esperadas y Canales de reporte', tipo: 'html', content: '<h3>Conductas Esperadas y Línea Ética</h3><p>Canales confidenciales para el reporte de dilemas éticos, incumplimientos o situaciones irregulares.</p>' },
            { colIndex: 51, titulo: 'SARLAFT / SAGRILAFT', tipo: 'html', content: '<h3>SARLAFT / SAGRILAFT</h3><p>Sistema de Autocontrol y Gestión del Riesgo Integral de Lavado de Activos, Financiación del Terrorismo y Financiamiento de la Proliferación de Armas de Destrucción Masiva.</p>' }
        ]
    },
    {
        id: 10,
        slug: 'cultura_operacional',
        numero: 'Módulo 10',
        titulo: 'Normas y cultura operacional',
        icono: 'fas fa-user-check',
        imagen: 'assets/sello Incluyente.jpg',
        subtemas: [
            { colIndex: 52, titulo: 'Seguridad física y otros lineamientos', tipo: 'html', content: '<h3>Seguridad Física y Lineamientos Generales</h3><p>Controles de ingreso, permanencia y circulación segura en sedes administrativas, patios y estaciones.</p>' },
            { colIndex: 53, titulo: 'Presentación personal y Uso del uniforme', tipo: 'html', content: '<h3>Presentación Personal y Uso del Uniforme</h3><p>Porte adecuado de la dotación corporativa y carné institucional visible en todo momento.</p>' },
            { colIndex: 54, titulo: 'Uso del celular y Orden del puesto', tipo: 'html', content: '<h3>Uso del Celular y Orden del Puesto</h3><p>Restricción del uso de dispositivos móviles en labores operativas o de atención y metodología de orden y aseo.</p>' },
            { colIndex: 55, titulo: 'Alimentación, Acceso a instalaciones y Visitantes', tipo: 'html', content: '<h3>Alimentación, Acceso a Instalaciones y Visitantes</h3><p>Consumo de alimentos únicamente en zonas autorizadas y protocolo de registro y acompañamiento de visitantes.</p>' },
            { colIndex: 56, titulo: 'Actividades comerciales', tipo: 'html', content: '<h3>Prohibición de Actividades Comerciales</h3><p>Normativa sobre ventas, rifas o actividades comerciales no autorizadas dentro de las instalaciones de la compañía.</p>' },
            { colIndex: 57, titulo: 'Conflictos y peleas', tipo: 'html', content: '<h3>Resolución Pacífica y Respeto</h3><p>Trato respetuoso con compañeros, superiores y usuarios del sistema; prohibición absoluta de agresiones verbales o físicas.</p>' },
            { colIndex: 58, titulo: 'Alcohol, drogas y armas', tipo: 'html', content: '<h3>Política de Alcohol, Drogas y Armas</h3><p>Prohibición estricta de presentarse bajo el efecto de alcohol o sustancias psicoactivas, así como el porte de armas.</p>' },
            { colIndex: 59, titulo: 'Reporte de actividades sospechosas', tipo: 'html', content: '<h3>Reporte de Actividades Sospechosas</h3><p>Protocolo de aviso inmediato a Seguridad Física o Centro de Control ante eventos inusuales o riesgos de fraude.</p>' }
        ]
    },
    {
        id: 11,
        slug: 'bienestar',
        numero: 'Módulo 11',
        titulo: 'Bienestar y beneficios',
        icono: 'fas fa-heart',
        imagen: 'assets/Imagenes bienvenida Inducción Corporativa.jpg',
        subtemas: [
            { colIndex: 60, titulo: 'Bienestar', tipo: 'html', content: '<h3>Bienestar en Recaudo Bogotá</h3><p>Estrategia integral enfocada en la calidad de vida, clima laboral y desarrollo humano de nuestros colaboradores.</p>' },
            { colIndex: 61, titulo: 'Beneficios corporativos', tipo: 'html', content: '<h3>Beneficios Corporativos</h3><p>Portafolio de auxilios, tiempo flexible y reconocimientos diseñados para ti.</p>' },
            { colIndex: 62, titulo: 'Convenios', tipo: 'html', content: '<h3>Convenios Institucionales</h3><p>Alianzas con entidades educativas, recreativas, financieras y de salud con tarifas preferenciales.</p>' },
            { colIndex: 63, titulo: 'Programas de bienestar', tipo: 'html', content: '<h3>Programas de Bienestar</h3><p>Actividades deportivas, culturales, celebraciones especiales y promoción de la salud física y mental.</p>' },
            { colIndex: 64, titulo: 'Beneficios para colaboradores', tipo: 'html', content: '<h3>Beneficios para Colaboradores</h3><p>Requisitos de antigüedad y condiciones para acceder a los beneficios extralegales vigentes.</p>' },
            { colIndex: 65, titulo: 'Beneficios para la familia (si aplica)', tipo: 'html', content: '<h3>Beneficios para la Familia</h3><p>Actividades e incentivos extensivos al núcleo familiar del colaborador.</p>' },
            { colIndex: 66, titulo: 'Canales/plataformas para consultar beneficios', tipo: 'html', content: '<h3>Canales para Consultar Beneficios</h3><p>Cómo solicitar y consultar todos tus beneficios a través de la plataforma BUK y los canales de Gestión Humana.</p>' }
        ]
    },
    {
        id: 12,
        slug: 'herramientas',
        numero: 'Módulo 12',
        titulo: 'Herramientas corporativas',
        icono: 'fas fa-laptop-house',
        imagen: 'assets/seguridad de la información.jpg',
        subtemas: [
            { colIndex: 67, titulo: 'Correo corporativo', tipo: 'html', content: '<h3>Correo Corporativo</h3><p>Uso institucional de la cuenta de correo electrónico y herramientas ofimáticas asignadas.</p>' },
            { colIndex: 68, titulo: 'Workforce', tipo: 'html', content: '<h3>Workforce</h3><p>Plataforma para la programación de turnos, marcación y gestión de tiempos operativos.</p>' },
            { colIndex: 69, titulo: 'Moodle', tipo: 'html', content: '<h3>Campus Virtual Moodle</h3><p>Aula virtual corporativa para el desarrollo de cursos, entrenamientos y evaluaciones de formación.</p>' },
            { colIndex: 70, titulo: 'BUK', tipo: 'html', content: '<h3>Plataforma BUK</h3><p>Portal de autogestión del colaborador para desprendibles de nómina, vacaciones, certificaciones y beneficios.</p>' },
            { colIndex: 71, titulo: 'Biblioteca de Gestión del Conocimiento', tipo: 'html', content: '<h3>Biblioteca de Gestión del Conocimiento</h3><p>Repositorio oficial de manuales, procedimientos, instructivos y documentación del sistema de gestión.</p>' },
            { colIndex: 72, titulo: 'Otros sistemas corporativos', tipo: 'html', content: '<h3>Otros Sistemas Corporativos</h3><p>Mesa de servicios TI, intranet corporativa y aplicativos específicos según el rol.</p>' }
        ]
    },
    {
        id: 13,
        slug: 'tarjeta_funcionario',
        numero: 'Módulo 13',
        titulo: 'Tarjeta Funcionario',
        icono: 'fas fa-id-badge',
        imagen: 'assets/video-bienvenida.jpg',
        subtemas: [
            { colIndex: 73, titulo: '¿Qué es? y Funcionamiento', tipo: 'html', content: '<h3>¿Qué es la Tarjeta Funcionario y cómo funciona?</h3><p>Documento de identificación y medio de acceso personal e intransferible asignado al colaborador de Recaudo Bogotá.</p>' },
            { colIndex: 74, titulo: 'Recargas', tipo: 'html', content: '<h3>Recargas de Pasajes</h3><p>Esquema de asignación y recarga periódica del beneficio de transporte según las políticas de la compañía.</p>' },
            { colIndex: 75, titulo: 'Inicio de jornada', tipo: 'html', content: '<h3>Registro de Inicio de Jornada</h3><p>Uso correcto de la tarjeta al iniciar el turno o ingresar a las instalaciones operativas.</p>' },
            { colIndex: 76, titulo: 'Fin de jornada', tipo: 'html', content: '<h3>Registro de Fin de Jornada</h3><p>Validación de salida al finalizar las labores diarias.</p>' },
            { colIndex: 77, titulo: 'Break', tipo: 'html', content: '<h3>Registro de Break / Descanso</h3><p>Lineamientos para el registro de tiempos de descanso o alimentación durante el turno.</p>' },
            { colIndex: 78, titulo: 'Validaciones', tipo: 'html', content: '<h3>Validaciones en el Sistema</h3><p>Reglas para la validación en torniquetes y buses dentro de los desplazamientos autorizados.</p>' },
            { colIndex: 79, titulo: 'Prohibiciones y Uso correcto', tipo: 'html', content: '<h3>Prohibiciones y Uso Correcto</h3><p>Queda estrictamente prohibido prestar, vender o ceder la Tarjeta Funcionario a terceros. Su uso indebido acarrea sanciones disciplinarias.</p>' }
        ]
    },
    {
        id: 14,
        slug: 'procesos_admin',
        numero: 'Módulo 14',
        titulo: 'Procesos administrativos',
        icono: 'fas fa-file-invoice-dollar',
        imagen: 'assets/Proceso de Compras.jpg',
        subtemas: [
            { colIndex: 80, titulo: 'Compras:', tipo: 'html', content: '<h3>Proceso de Compras</h3><p>Lineamientos para la solicitud de bienes y servicios, cotizaciones, órdenes de compra y recepción de proveedores.</p>' },
            { colIndex: 81, titulo: 'Contratos:', tipo: 'html', content: '<h3>Gestión de Contratos</h3><p>Etapas de estructuración, revisión jurídica, firma, pólizas y supervisión de contratos.</p>' }
        ]
    }
];

// Copia de trabajo mutable donde se inyectan los contenidos subidos por el Super Administrador
let CATALOGO_MODULOS = JSON.parse(JSON.stringify(CATALOGO_MODULOS_BASE));

// =============================================================================
// HELPERS DE NORMALIZACIÓN Y FORMATO DE URLS
// =============================================================================
function cleanCedula(str) {
    return String(str || '').replace(/\D/g, '').trim();
}

function normalizeStr(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

function isSuperAdmin(user) {
    if (!user || !user.rol) return false;
    const r = normalizeStr(user.rol);
    return r.includes('SUPER ADMINISTRADOR') || r === 'SUPERADMIN';
}

function isAnyAdmin(user) {
    if (!user || !user.rol) return false;
    const r = normalizeStr(user.rol);
    return r.includes('SUPER ADMINISTRADOR') || r.includes('ADMINISTRADOR') || r === 'SUPERADMIN' || r === 'ADMIN';
}

function formatFotoUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return DEFAULT_AVATAR;
    const match = url.match(/\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return url;
}

// Extrae el ID de 11 caracteres de cualquier enlace de YouTube (youtu.be, watch?v=, embed/, shorts/, live/)
function extractYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = decodeURIComponent(url.trim());
    const patterns = [
        /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/embed=)([a-zA-Z0-9_-]{11})/i,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const regex of patterns) {
        const match = trimmed.match(regex);
        if (match && match[1]) return match[1];
    }
    return null;
}

// Convierte automáticamente enlaces de YouTube (watch?v= / youtu.be) y Google Drive (/view) a enlaces embebibles limpios
function formatEmbedUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();

    const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^\/\?&]+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    const ytId = extractYouTubeId(trimmed);
    if (ytId) {
        return `https://www.youtube.com/embed/${ytId}`;
    }

    return trimmed;
}

// Construye la URL final para el iframe del visor evitando el "Error 153" de YouTube cuando se abre desde file://
function buildViewerMediaUrl(url) {
    const normalized = formatEmbedUrl(url);
    if (!normalized) return '';

    const ytId = extractYouTubeId(normalized);
    if (ytId) {
        // Cuando la herramienta se abre localmente (file://), el navegador omite la cabecera HTTP Referer
        // y YouTube bloquea /embed/ directo con "Error 153". Al cargarlo mediante el widget HTTPS de Embedly,
        // el reproductor se sirve desde un origen HTTPS válido con Referer y reproduce sin Error 153.
        if (window.location.protocol === 'file:') {
            const embedSrc = `https://www.youtube.com/embed/${ytId}?feature=oembed`;
            const watchUrl = `https://www.youtube.com/watch?v=${ytId}`;
            const thumbUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
            return `https://cdn.embedly.com/widgets/media.html?src=${encodeURIComponent(embedSrc)}&url=${encodeURIComponent(watchUrl)}&image=${encodeURIComponent(thumbUrl)}&type=text%2Fhtml&schema=youtube`;
        }
        return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`;
    }

    return normalized;
}

// =============================================================================
// BASE DE DATOS LOCAL DE RESPALDO (FALLBACK OFFLINE SINCRONIZADO CON GOOGLE SHEETS)
// =============================================================================
const FALLBACK_COLABORADORES = [
    { cedula: "51.881.799", nombre: "Acosta Barrera Diana Maria", cargo: "GERENTE DE GESTIÓN HUMANA", area: "GERENCIA DE GESTIÓN HUMANA", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "65.770.504", rol: "Estudiante", foto: "https://drive.google.com/file/d/1FS6gQ-t51Zbeg-d90ZGNDFZJgbWwfzLm/view?usp=sharing" },
    { cedula: "1.012.347.133", nombre: "Albarracín Quintana Diana Marcela", cargo: "AUXILIAR ADMINISTRATIVO", area: "Compensación y Nómina", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "1.030.638.474", rol: "Estudiante", foto: "" },
    { cedula: "1.022.331.455", nombre: "Arias Parada Catalina", cargo: "COORDINADOR DE RELACIONES LABORALES", area: "Relaciones Laborales", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "51.881.799", rol: "Estudiante", foto: "" },
    { cedula: "52.782.882", nombre: "Marleny Avila Gomez", cargo: "JEFE DE GESTIÓN HUMANA Y HSE", area: "Gestión Humana y HSE", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "51.881.799", rol: "Estudiante", foto: "https://drive.google.com/file/d/1ecE5GjdCRzuyfYxWsWom4gjdiDWI3xuI/view?usp=sharing" },
    { cedula: "1.026.580.615", nombre: "Campo Camacho Yenny Lizeth", cargo: "ANALISTA I BIENESTAR", area: "Bienestar", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "1.234.089.463", nombre: "Coronado Cardenas Luisa Fernanda", cargo: "ANALISTA II GESTION HUMANA", area: "Compensación y Nómina", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "1.030.638.474", rol: "Estudiante", foto: "" },
    { cedula: "1.054.802.543", nombre: "Cruz Galindo Yeimy Viviana", cargo: "ANALISTA III DE HSE", area: "HSE", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "1.094.915.183", rol: "Estudiante", foto: "" },
    { cedula: "1.024.560.218", nombre: "Daza Buitrago Luis Fernando", cargo: "AUXILIAR ADMINISTRATIVO", area: "Compensación y Nómina", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "1.030.638.474", rol: "Estudiante", foto: "" },
    { cedula: "1.024.519.562", nombre: "Gonzalez Borda Yeraldin", cargo: "ANALISTA III DE GESTION HUMANA", area: "Selección", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "https://drive.google.com/file/d/1e3jUH3nF2vf27Fsg4R6VJ5gSkTemj4Ct/view?usp=sharing" },
    { cedula: "1.007.339.915", nombre: "Valentina Laguna Leiva", cargo: "ANALISTA I DE FORMACION", area: "Formación", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "https://drive.google.com/file/d/1zVbPoYdg2GNuZLRVrM2sb-phIEQtWEFN/view?usp=sharing" },
    { cedula: "1.094.915.183", nombre: "Leal Vera Luisa Fernanda", cargo: "COORDINADOR HSE", area: "HSE", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "1.030.617.839", nombre: "López Moreno Paola Andrea", cargo: "ANALISTA III DE HSE", area: "HSE", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "1.094.915.183", rol: "Estudiante", foto: "" },
    { cedula: "1.001.343.976", nombre: "Lugo Nieto Laura Valentina", cargo: "ANALISTA I DE RELACIONES LABORALES", area: "Relaciones Laborales", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "1.022.331.455", rol: "Estudiante", foto: "" },
    { cedula: "1.010.008.411", nombre: "Pérez Martínez Juan Carlos", cargo: "AUXILIAR ADMINISTRATIVO", area: "HSE", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "52.978.541", nombre: "Otalvaro López Diana Patricia", cargo: "ANALISTA III DE GESTION HUMANA", area: "Selección", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "1.002.817.615", nombre: "Patiño Giraldo Daniel", cargo: "PRACTICANTE", area: "HSE", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "1.003.304.818", nombre: "Polo Lasso Michael Andres", cargo: "AUXILIAR ADMINISTRATIVO", area: "Formación", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "52.850.911", nombre: "Dora Yeny Ramirez Mora", cargo: "Analista III de Formación", area: "Formación", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Super Administrador", foto: "https://drive.google.com/file/d/1XwBxJFlTADFDsaVr_r_HSooKGLpv18bq/view?usp=sharing" },
    { cedula: "1.012.385.268", nombre: "Sanjuan Gutierrez Jefferson", cargo: "ANALISTA I DE COMUNICACIONES", area: "Comunicaciones", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "1.030.638.474", nombre: "William Andres Soto", cargo: "COORDINADOR DE COMPENSACIÓN Y NOMINA", area: "Compensación y Nómina", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "51.881.799", rol: "Estudiante", foto: "" },
    { cedula: "1.003.233.400", nombre: "Zapata Villarroel Fernando Andres", cargo: "AUXILIAR RELACIONES LABORALES", area: "Relaciones Laborales", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "1.022.331.455", rol: "Estudiante", foto: "" },
    { cedula: "1.013.096.635", nombre: "Zarta Giraldo Giovanny Alejandro", cargo: "PRACTICANTE", area: "HSE", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "1.094.915.183", rol: "Estudiante", foto: "" },
    { cedula: "1.063.281.986", nombre: "Galvan Higuita Juranys", cargo: "AUXILIAR ADMINISTRATIVO", area: "Selección", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "1.023.363.326", nombre: "Acevedo Garzon Karoll Hasbleidy", cargo: "AUXILIAR ADMINISTRATIVO", area: "Bienestar", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "52.782.882", rol: "Estudiante", foto: "" },
    { cedula: "65.770.504", nombre: "Paula Andrea Lopez Vargas", cargo: "VICEPRESIDENCIA OPERATIVA", area: "VICEPRESIDENCIA OPERATIVA", gerencia: "VICEPRESIDENCIA OPERATIVA", jefe: "420.859", rol: "Estudiante", foto: "https://drive.google.com/file/d/1Sz-ZEJesLJxWfOQYfX2SsqAPfR1N3C61/view?usp=sharing" },
    { cedula: "420.859", nombre: "Javier Cancela Frias", cargo: "PRESIDENCIA", area: "PRESIDENCIA", gerencia: "PRESIDENCIA", jefe: "", rol: "Estudiante", foto: "https://drive.google.com/file/d/1SlQFP-l1a6DcQXlmaQSakoJF31kZOCse/view?usp=drive_link" },
    { cedula: "1.069.432.843", nombre: "Wilson Varela Muñoz", cargo: "ANALISTA SENIOR DE CAPACITACIÓN", area: "Formación", gerencia: "GERENCIA DE GESTIÓN HUMANA", jefe: "51.881.799", rol: "Super Administrador", foto: "" }
];

const FALLBACK_MODULOS_CARGO = [
    {
        cargo: "ANALISTA III DE HSE",
        enabledCols: { 1: true, 2: true, 3: true },
        modulosHabilitados: {
            "BIENVENIDA": true,
            "OBJETIVO DE LA INDUCCION": true,
            "¿QUIENES SOMOS?": true
        }
    },
    {
        cargo: "Analista III de Formación",
        enabledCols: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true, 14: true },
        modulosHabilitados: {
            "BIENVENIDA": true,
            "OBJETIVO DE LA INDUCCION": true,
            "¿QUIENES SOMOS?": true,
            "MISION": true,
            "VISION": true,
            "HISTORIA DE LA COMPANIA": true,
            "CONTEXTO GENERAL DE LA ORGANIZACION": true,
            "TRANSMILENIO": true,
            "SITP": true,
            "TULLAVE": true,
            "SIRCI": true,
            "RECAUDO": true,
            "CONTROL DE FLOTA": true,
            "INFORMACION AL USUARIO": true
        }
    }
];

// =============================================================================
// PERSISTENCIA DE CONTENIDOS Y MEMORIA JSON (IndexedDB + LocalStorage + .JSON)
// =============================================================================
const IDB_NAME = 'rb_induccion_corporativa_db';
const IDB_VERSION = 2;
const IDB_STORE = 'custom_subtemas';
const IDB_STORE_MEMORIA = 'memoria_json_store';

function abrirIndexedDB() {
    return new Promise((resolve) => {
        if (!window.indexedDB) {
            resolve(null);
            return;
        }
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE, { keyPath: 'colIndex' });
            }
            if (!db.objectStoreNames.contains(IDB_STORE_MEMORIA)) {
                db.createObjectStore(IDB_STORE_MEMORIA, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = () => resolve(null);
    });
}

async function guardarSubtemaCustomEnDB(colIndex, customData) {
    try {
        const metaMap = JSON.parse(localStorage.getItem('rb_custom_subtemas_v2') || '{}');
        metaMap[colIndex] = customData;
        localStorage.setItem('rb_custom_subtemas_v2', JSON.stringify(metaMap));
    } catch (e) {}

    const db = await abrirIndexedDB();
    if (!db) return;
    return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put({ colIndex, ...customData });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}

async function eliminarSubtemaCustomDeDB(colIndex) {
    try {
        const metaMap = JSON.parse(localStorage.getItem('rb_custom_subtemas_v2') || '{}');
        delete metaMap[colIndex];
        localStorage.setItem('rb_custom_subtemas_v2', JSON.stringify(metaMap));
    } catch (e) {}

    const db = await abrirIndexedDB();
    if (!db) return;
    return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.delete(colIndex);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}

async function cargarTodosSubtemasCustomDeDB() {
    const customMap = {};

    try {
        const lsData = JSON.parse(localStorage.getItem('rb_custom_subtemas_v2') || '{}');
        Object.keys(lsData).forEach(k => {
            customMap[k] = lsData[k];
        });
    } catch (e) {}

    const db = await abrirIndexedDB();
    if (db) {
        await new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const store = tx.objectStore(IDB_STORE);
            const req = store.getAll();
            req.onsuccess = () => {
                if (Array.isArray(req.result)) {
                    req.result.forEach(item => {
                        customMap[item.colIndex] = item;
                    });
                }
                resolve();
            };
            req.onerror = () => resolve();
        });
    }

    CATALOGO_MODULOS = JSON.parse(JSON.stringify(CATALOGO_MODULOS_BASE));
    CATALOGO_MODULOS.forEach(mod => {
        mod.subtemas.forEach((st, idx) => {
            const custom = customMap[st.colIndex];
            if (custom) {
                mod.subtemas[idx] = {
                    ...st,
                    tipo: custom.tipo || st.tipo,
                    url: custom.url !== undefined ? custom.url : st.url,
                    content: custom.content !== undefined ? custom.content : st.content,
                    fileDataUrl: custom.fileDataUrl || null,
                    fileName: custom.fileName || null,
                    audio: custom.audio !== undefined ? custom.audio : st.audio,
                    popup: custom.popup !== undefined ? custom.popup : st.popup,
                    isCustomized: true
                };
            }
        });
    });
}

// =============================================================================
// SISTEMA DE MEMORIA .JSON PARA COLABORADORES (INGRESOS, AVANCE, MÓDULO Y TEMA ACTUAL)
// =============================================================================
async function inicializarMemoriaJSON() {
    // 1. Si existe window.RB_MEMORIA_INICIAL_JSON (de memoria-progreso.js), fusionar datos
    if (window.RB_MEMORIA_INICIAL_JSON && window.RB_MEMORIA_INICIAL_JSON.colaboradores) {
        fusionarDatosMemoriaExterna(window.RB_MEMORIA_INICIAL_JSON);
    }

    // 2. Intentar leer memoria-progreso.json si estamos en servidor http/https
    if (window.location.protocol.startsWith('http')) {
        try {
            const res = await fetch(`memoria-progreso.json?_ts=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                if (json && json.colaboradores) {
                    fusionarDatosMemoriaExterna(json);
                }
            }
        } catch (e) {}
    }

    // 3. Intentar leer de IndexedDB por si hay respaldo previo
    const db = await abrirIndexedDB();
    if (db && db.objectStoreNames.contains(IDB_STORE_MEMORIA)) {
        await new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE_MEMORIA, 'readonly');
            const store = tx.objectStore(IDB_STORE_MEMORIA);
            const req = store.get('memoria_global');
            req.onsuccess = () => {
                if (req.result && req.result.data && req.result.data.colaboradores) {
                    fusionarDatosMemoriaExterna(req.result.data);
                }
                resolve();
            };
            req.onerror = () => resolve();
        });
    }
}

function fusionarDatosMemoriaExterna(jsonObj) {
    if (!jsonObj || !jsonObj.colaboradores) return;

    const logs = JSON.parse(localStorage.getItem('rb_user_logs') || '{}');
    const progressData = JSON.parse(localStorage.getItem('rb_user_progress') || '{}');

    Object.keys(jsonObj.colaboradores).forEach(cCedulaKey => {
        const cCedula = cleanCedula(cCedulaKey);
        const entry = jsonObj.colaboradores[cCedulaKey];
        if (!entry) return;

        // Fusionar logs de ingreso
        if (!logs[cCedula]) {
            logs[cCedula] = {
                primerIngreso: entry.primerIngreso || 'Sin registro',
                ultimoIngreso: entry.ultimoIngreso || 'Sin registro',
                cantidadIngresos: entry.cantidadIngresos || 0,
                ultimoModuloId: entry.ultimoModuloId || null,
                ultimoModuloNombre: entry.ultimoModuloNombre || '',
                ultimoTemaTitulo: entry.ultimoTemaTitulo || ''
            };
        } else {
            if ((entry.cantidadIngresos || 0) > (logs[cCedula].cantidadIngresos || 0)) {
                logs[cCedula].cantidadIngresos = entry.cantidadIngresos;
                logs[cCedula].ultimoIngreso = entry.ultimoIngreso || logs[cCedula].ultimoIngreso;
            }
            if (logs[cCedula].primerIngreso === 'Sin registro' && entry.primerIngreso && entry.primerIngreso !== 'Sin registro') {
                logs[cCedula].primerIngreso = entry.primerIngreso;
            }
            if (!logs[cCedula].ultimoModuloNombre && entry.ultimoModuloNombre) {
                logs[cCedula].ultimoModuloId = entry.ultimoModuloId;
                logs[cCedula].ultimoModuloNombre = entry.ultimoModuloNombre;
                logs[cCedula].ultimoTemaTitulo = entry.ultimoTemaTitulo;
            }
        }

        // Fusionar progreso de temas vistos
        if (entry.progresoModulos && typeof entry.progresoModulos === 'object') {
            if (!progressData[cCedula]) progressData[cCedula] = {};
            Object.keys(entry.progresoModulos).forEach(modId => {
                if (!progressData[cCedula][modId]) progressData[cCedula][modId] = {};
                Object.assign(progressData[cCedula][modId], entry.progresoModulos[modId]);
            });
        }
    });

    localStorage.setItem('rb_user_logs', JSON.stringify(logs));
    localStorage.setItem('rb_user_progress', JSON.stringify(progressData));
}

function construirObjetoMemoriaJSON() {
    const logs = JSON.parse(localStorage.getItem('rb_user_logs') || '{}');
    const progressData = JSON.parse(localStorage.getItem('rb_user_progress') || '{}');
    const colaboradoresMap = {};

    colaboradoresData.forEach(colab => {
        const cCedula = cleanCedula(colab.cedula);
        const stats = calcularEstadisticasAvance(colab.cedula);
        const infoIngreso = getIngresosUsuario(colab.cedula);

        colaboradoresMap[cCedula] = {
            cedula: colab.cedula,
            nombre: colab.nombre,
            cargo: colab.cargo,
            area: colab.area,
            gerencia: colab.gerencia || 'GERENCIA DE GESTIÓN HUMANA',
            jefe: colab.jefe || '',
            rol: colab.rol || 'Estudiante',
            primerIngreso: infoIngreso.primerIngreso,
            ultimoIngreso: infoIngreso.ultimoIngreso,
            cantidadIngresos: infoIngreso.cantidadIngresos,
            moduloActual: stats.moduloActualTexto,
            temaActual: stats.temaActualTexto,
            ultimoModuloId: infoIngreso.ultimoModuloId || null,
            ultimoModuloNombre: infoIngreso.ultimoModuloNombre || '',
            ultimoTemaTitulo: infoIngreso.ultimoTemaTitulo || '',
            modulosCompletados: stats.completados,
            totalModulosHabilitados: stats.total,
            temasVistos: stats.temasVistos,
            totalTemasHabilitados: stats.totalTemas,
            porcentajeAvance: stats.porcentaje,
            progresoModulos: progressData[cCedula] || {}
        };
    });

    // Incluir también cualquier registro en logs que no esté aún en colaboradoresData
    Object.keys(logs).forEach(cCedula => {
        if (!colaboradoresMap[cCedula]) {
            colaboradoresMap[cCedula] = {
                cedula: cCedula,
                ...logs[cCedula],
                progresoModulos: progressData[cCedula] || {}
            };
        }
    });

    return {
        ultimaActualizacion: new Date().toISOString(),
        version: '2.0',
        totalColaboradores: Object.keys(colaboradoresMap).length,
        colaboradores: colaboradoresMap
    };
}

async function sincronizarMemoriaJSONPersistente() {
    const payload = construirObjetoMemoriaJSON();

    // 1. Guardar en localStorage
    try {
        localStorage.setItem('rb_memoria_progreso_json', JSON.stringify(payload));
    } catch (e) {}

    // 2. Guardar en IndexedDB
    const db = await abrirIndexedDB();
    if (db && db.objectStoreNames.contains(IDB_STORE_MEMORIA)) {
        try {
            const tx = db.transaction(IDB_STORE_MEMORIA, 'readwrite');
            tx.objectStore(IDB_STORE_MEMORIA).put({ id: 'memoria_global', data: payload });
        } catch (e) {}
    }

    // 3. Si el Super Admin vinculó el archivo físico memoria-progreso.json en disco, escribir automáticamente
    if (jsonFileHandleDisco) {
        try {
            const writable = await jsonFileHandleDisco.createWritable();
            await writable.write(JSON.stringify(payload, null, 2));
            await writable.close();
        } catch (err) {
            console.warn('No se pudo escribir automáticamente en el archivo JSON vinculado:', err);
        }
    }
}

async function vincularArchivoMemoriaJSONEnDisco() {
    if (!window.showSaveFilePicker) {
        alert('Tu navegador descargará directamente el archivo memoria-progreso.json al pulsar "Descargar .JSON".');
        descargarMemoriaProgresoJSON();
        return;
    }
    try {
        jsonFileHandleDisco = await window.showSaveFilePicker({
            suggestedName: 'memoria-progreso.json',
            types: [{
                description: 'Archivo JSON de Memoria de Inducción',
                accept: { 'application/json': ['.json'] }
            }]
        });
        await sincronizarMemoriaJSONPersistente();
        const btn = document.getElementById('btnVincularJsonDisco');
        if (btn) {
            btn.classList.add('linked-active');
            btn.innerHTML = '<i class="fas fa-check-circle"></i> .JSON Vinculado (Auto-Guardando)';
        }
        alert('✓ Archivo memoria-progreso.json vinculado correctamente. Cada vez que un colaborador ingrese o avance, este archivo se actualizará automáticamente.');
    } catch (e) {}
}

function descargarMemoriaProgresoJSON() {
    const payload = construirObjetoMemoriaJSON();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoria-progreso.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarMemoriaProgresoJSON(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const json = JSON.parse(e.target.result);
            if (!json || !json.colaboradores) {
                alert('El archivo JSON no contiene la estructura de colaboradores esperada.');
                return;
            }
            fusionarDatosMemoriaExterna(json);
            await sincronizarMemoriaJSONPersistente();
            renderizarCategoriasLaterales();
            renderizarModulos(currentUser);
            renderizarTablaAdmin(document.getElementById('adminSearchInput') ? document.getElementById('adminSearchInput').value : '');
            alert('✓ Memoria de progreso (.json) cargada y sincronizada correctamente.');
        } catch (err) {
            alert('Error al leer el archivo JSON de memoria.');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// =============================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarAplicacion();
});

// Escuchar mensajes postMessage desde el iframe del visor (para detección exacta del 50% en HTML, Videos locales y YouTube)
window.addEventListener('message', (event) => {
    if (!event.data) return;
    let data = event.data;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return; }
    }
    if (!data || typeof data !== 'object') return;

    if (data.type === 'RB_VIEWER_PROGRESS_UPDATE') {
        const pct = Number(data.percent) || 0;
        if (pct > currentViewerPercent) {
            actualizarProgresoVisualizacionTema(pct);
        }
    } else if (data.context === 'player.js' && data.event === 'timeupdate' && data.value) {
        // Eventos en tiempo real emitidos por el reproductor de YouTube / Embedly
        const dur = Number(data.value.duration) || 0;
        const sec = Number(data.value.seconds) || 0;
        if (dur > 0) {
            const pct = Math.min(100, (sec / dur) * 100);
            if (pct > currentViewerPercent) {
                actualizarProgresoVisualizacionTema(pct);
            }
        }
    } else if (data.event === 'infoDelivery' && data.info && data.info.currentTime && data.info.duration) {
        const pct = Math.min(100, (Number(data.info.currentTime) / Number(data.info.duration)) * 100);
        if (pct > currentViewerPercent) {
            actualizarProgresoVisualizacionTema(pct);
        }
    }
});

async function inicializarAplicacion() {
    mostrarLoading(true);
    actualizarSheetStatus('<i class="fas fa-sync fa-spin"></i> Sincronizando en vivo con Google Sheets...');

    await cargarTodosSubtemasCustomDeDB();
    await cargarDatosGoogleSheets();
    await inicializarMemoriaJSON();

    mostrarLoading(false);

    // Verificar si hay sesión previa guardada y refrescar sus datos desde Google Sheets
    const savedUser = sessionStorage.getItem('rb_user');
    if (savedUser) {
        try {
            const parsed = JSON.parse(savedUser);
            const freshUser = colaboradoresData.find(c => cleanCedula(c.cedula) === cleanCedula(parsed.cedula)) || parsed;
            currentUser = freshUser;
            sessionStorage.setItem('rb_user', JSON.stringify(freshUser));
            ocultarModalAuth();
            iniciarSesionUsuario(freshUser, false); // false = no incrementar contador en simple F5 si ya estaba en sesión
        } catch (e) {
            mostrarModalAuth();
        }
    } else {
        mostrarModalAuth();
    }
}

// =============================================================================
// CARGA DE GOOGLE SHEETS SIN BLOQUEO CORS (SOPORTA file:// Y http:// VÍA JSONP)
// =============================================================================
function fetchGoogleSheetViaJSONP(sheetName = null, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const cbName = `gvizCb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        const script = document.createElement('script');
        let timer = null;

        const cleanup = () => {
            if (timer) clearTimeout(timer);
            try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
            if (script.parentNode) script.parentNode.removeChild(script);
        };

        window[cbName] = (response) => {
            cleanup();
            if (response && response.status === 'ok' && response.table) {
                resolve(response.table);
            } else {
                reject(new Error('Respuesta inválida de Google Sheets JSONP'));
            }
        };

        timer = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout conectando a Google Sheets'));
        }, timeoutMs);

        const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
        script.src = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=responseHandler:${cbName}&headers=1${sheetParam}&_ts=${Date.now()}`;
        script.onerror = () => {
            cleanup();
            reject(new Error('Error de red cargando script de Google Sheets'));
        };

        document.head.appendChild(script);
    });
}

function parseGvizTableToColaboradores(table) {
    const cols = (table.cols || []).map(c => (c && c.label ? c.label.trim() : ''));
    const rows = table.rows || [];
    const list = [];

    rows.forEach(r => {
        if (!r || !Array.isArray(r.c)) return;
        const rowVals = r.c.map(cell => {
            if (!cell) return '';
            if (cell.f !== undefined && cell.f !== null) return String(cell.f).trim();
            if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
            return '';
        });

        const item = mapColaboradores(cols, rowVals);
        if (item && cleanCedula(item.cedula)) {
            list.push(item);
        }
    });

    return list;
}

function parseGvizTableToModulosCargo(table) {
    const cols = (table.cols || []).map(c => (c && c.label ? c.label.trim() : ''));
    const rows = table.rows || [];
    const list = [];

    let headers = cols;
    let startRowIdx = 0;
    const hasValidColLabels = cols.some((l, idx) => idx > 0 && l.length > 0);
    if (!hasValidColLabels && rows.length > 0) {
        headers = (rows[0].c || []).map(cell => (cell && (cell.f || cell.v) ? String(cell.f || cell.v).trim() : ''));
        startRowIdx = 1;
    }

    for (let i = startRowIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !Array.isArray(r.c)) continue;
        const rowVals = r.c.map(cell => {
            if (!cell) return '';
            if (cell.f !== undefined && cell.f !== null) return String(cell.f).trim();
            if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
            return '';
        });

        const item = mapModulosCargo(headers, rowVals);
        if (item) {
            list.push(item);
        }
    }

    return list;
}

async function cargarDatosGoogleSheets() {
    let loadedColab = false;
    let loadedModulos = false;

    try {
        const tableColab = await fetchGoogleSheetViaJSONP(null);
        const parsedColab = parseGvizTableToColaboradores(tableColab);
        if (parsedColab.length > 0) {
            colaboradoresData = parsedColab;
            loadedColab = true;
        }
    } catch (errJsonp1) {
        console.warn('JSONP Colaboradores aviso:', errJsonp1);
    }

    try {
        const tableMod = await fetchGoogleSheetViaJSONP('Módulos por cargo');
        const parsedMod = parseGvizTableToModulosCargo(tableMod);
        if (parsedMod.length > 0) {
            modulosPorCargoData = parsedMod;
            loadedModulos = true;
        }
    } catch (errJsonp2) {
        console.warn('JSONP Módulos por cargo aviso:', errJsonp2);
    }

    if (!loadedColab) {
        try {
            const resColab = await fetch(EMPLOYEES_CSV_URL);
            if (resColab.ok) {
                const csvText = await resColab.text();
                const parsed = parseCSV(csvText, mapColaboradores);
                if (parsed.length > 0) {
                    colaboradoresData = parsed;
                    loadedColab = true;
                }
            }
        } catch (e) {}
    }

    if (!loadedModulos) {
        try {
            const resMod = await fetch(MODULES_CARGO_CSV_URL);
            if (resMod.ok) {
                const csvModText = await resMod.text();
                const parsed = parseCSV(csvModText, mapModulosCargo);
                if (parsed.length > 0) {
                    modulosPorCargoData = parsed;
                    loadedModulos = true;
                }
            }
        } catch (e) {}
    }

    if (!colaboradoresData || colaboradoresData.length === 0) {
        colaboradoresData = FALLBACK_COLABORADORES;
    }
    if (!modulosPorCargoData || modulosPorCargoData.length === 0) {
        modulosPorCargoData = FALLBACK_MODULOS_CARGO;
    }

    actualizarSheetStatus(`✓ Sincronizado con Google Sheets: ${colaboradoresData.length} colaboradores activos.`);
}

// ROBUST CSV PARSER (RESPALDO)
function parseCSV(text, mapRowFn) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return [];

    const result = [];
    const headers = parseCSVLine(lines[0]);

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = parseCSVLine(lines[i]);
        if (row.length >= 2) {
            const item = mapRowFn(headers, row);
            if (item) result.push(item);
        }
    }
    return result;
}

function parseCSVLine(line) {
    const values = [];
    let insideQuote = false;
    let value = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            values.push(value.trim().replace(/^["']|["']$/g, ''));
            value = '';
        } else {
            value += char;
        }
    }
    values.push(value.trim().replace(/^["']|["']$/g, ''));
    return values;
}

function mapColaboradores(headers, row) {
    const getVal = (colName) => {
        const idx = headers.findIndex(h => normalizeStr(h).includes(normalizeStr(colName)));
        return idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : '';
    };

    const cedula = row[0] ? String(row[0]).trim() : getVal('cedula');
    const nombre = getVal('nombre') || row[1] || '';
    const cargo = getVal('cargo') || row[2] || '';
    const area = getVal('area') || row[3] || '';
    const gerencia = getVal('gerencia') || row[4] || 'GERENCIA DE GESTIÓN HUMANA';
    const jefe = getVal('jefe') || row[5] || '';
    const foto = getVal('foto') || row[6] || '';
    const rol = getVal('rol') || row[7] || 'Estudiante';

    if (!cleanCedula(cedula) && !nombre) return null;

    return { cedula, nombre, cargo, area, gerencia, jefe, foto, rol };
}

function mapModulosCargo(headers, row) {
    const cargo = row[0] ? String(row[0]).trim() : '';
    if (!cargo || normalizeStr(cargo) === 'CARGO') return null;

    const modulosHabilitados = {};
    const enabledCols = {};

    const maxLen = Math.max(headers.length, row.length);
    for (let i = 1; i < maxLen; i++) {
        const topic = headers[i] ? String(headers[i]).trim() : '';
        const val = row[i] ? String(row[i]).toUpperCase().trim() : '';
        if (val === 'X') {
            enabledCols[i] = true;
            if (topic) {
                modulosHabilitados[topic] = true;
                modulosHabilitados[normalizeStr(topic)] = true;
            }
        }
    }

    return { cargo, modulosHabilitados, enabledCols };
}

// =============================================================================
// VALIDACIÓN, REGISTRO DE INGRESOS Y SESIÓN DE USUARIO
// =============================================================================
function validarUsuario(e) {
    e.preventDefault();
    const rawInput = document.getElementById('cedulaInput').value.trim();
    const cleanInput = cleanCedula(rawInput);

    const errorBox = document.getElementById('authErrorMsg');
    const errorText = document.getElementById('authErrorText');

    errorBox.style.display = 'none';

    if (!cleanInput) {
        errorText.textContent = 'Por favor ingresa tu número de cédula.';
        errorBox.style.display = 'flex';
        return;
    }

    const colab = colaboradoresData.find(c => cleanCedula(c.cedula) === cleanInput);

    if (colab) {
        currentUser = colab;
        sessionStorage.setItem('rb_user', JSON.stringify(colab));
        ocultarModalAuth();
        iniciarSesionUsuario(colab, true); // true = nuevo inicio de sesión -> incrementa cantidadIngresos
    } else {
        errorText.textContent = 'Cédula no encontrada en la base de datos de RB. Los responsables de RB deben actualizar tu registro antes de tu primer ingreso.';
        errorBox.style.display = 'flex';
    }
}

function registrarIngresoUsuario(user, isNewLogin = true) {
    const cCedula = cleanCedula(user.cedula);
    const logs = JSON.parse(localStorage.getItem('rb_user_logs') || '{}');
    const nowStr = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });

    if (!logs[cCedula]) {
        logs[cCedula] = {
            primerIngreso: nowStr,
            ultimoIngreso: nowStr,
            cantidadIngresos: 1,
            ultimoModuloId: null,
            ultimoModuloNombre: '',
            ultimoTemaTitulo: ''
        };
    } else {
        if (isNewLogin) {
            logs[cCedula].ultimoIngreso = nowStr;
            logs[cCedula].cantidadIngresos = (Number(logs[cCedula].cantidadIngresos) || 1) + 1;
        } else if (!logs[cCedula].cantidadIngresos) {
            logs[cCedula].cantidadIngresos = 1;
        }
    }

    localStorage.setItem('rb_user_logs', JSON.stringify(logs));
    sincronizarMemoriaJSONPersistente();
}

function registrarPosicionActualUsuario(cedula, moduloObj, subtemaObj) {
    if (!cedula || !moduloObj || !subtemaObj) return;
    const cCedula = cleanCedula(cedula);
    const logs = JSON.parse(localStorage.getItem('rb_user_logs') || '{}');
    if (!logs[cCedula]) {
        const nowStr = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });
        logs[cCedula] = {
            primerIngreso: nowStr,
            ultimoIngreso: nowStr,
            cantidadIngresos: 1
        };
    }
    logs[cCedula].ultimoModuloId = moduloObj.id;
    logs[cCedula].ultimoModuloNombre = `${moduloObj.numero}: ${moduloObj.titulo}`;
    logs[cCedula].ultimoTemaTitulo = subtemaObj.titulo;
    localStorage.setItem('rb_user_logs', JSON.stringify(logs));
    sincronizarMemoriaJSONPersistente();
}

function getIngresosUsuario(cedula) {
    const cCedula = cleanCedula(cedula);
    const logs = JSON.parse(localStorage.getItem('rb_user_logs') || '{}');
    const entry = logs[cCedula];
    if (!entry) {
        return {
            primerIngreso: 'Sin registro',
            ultimoIngreso: 'Sin registro',
            cantidadIngresos: 0,
            ultimoModuloId: null,
            ultimoModuloNombre: '',
            ultimoTemaTitulo: ''
        };
    }
    return {
        primerIngreso: entry.primerIngreso || 'Sin registro',
        ultimoIngreso: entry.ultimoIngreso || 'Sin registro',
        cantidadIngresos: Number(entry.cantidadIngresos) || (entry.primerIngreso && entry.primerIngreso !== 'Sin registro' ? 1 : 0),
        ultimoModuloId: entry.ultimoModuloId || null,
        ultimoModuloNombre: entry.ultimoModuloNombre || '',
        ultimoTemaTitulo: entry.ultimoTemaTitulo || ''
    };
}

function iniciarSesionUsuario(user, isNewLogin = true) {
    registrarIngresoUsuario(user, isNewLogin);

    // Configurar header
    document.getElementById('userProfileBadge').style.display = 'flex';
    document.getElementById('userNameHeader').textContent = user.nombre;
    document.getElementById('userCargoHeader').textContent = `${user.cargo} - ${user.area}`;

    const avatarImg = document.getElementById('userAvatarHeader');
    avatarImg.src = formatFotoUrl(user.foto);

    // Mostrar botones de Super Administrador / Administrador según Columna H (Rol)
    const btnSuperAdmin = document.getElementById('btnSuperAdminContent');
    const btnAdminConfig = document.getElementById('btnAdminConfig');
    const btnToggleSAView = document.getElementById('btnToggleSuperAdminView');

    if (isSuperAdmin(user)) {
        if (btnSuperAdmin) btnSuperAdmin.style.display = 'flex';
        if (btnAdminConfig) btnAdminConfig.style.display = 'flex';
        if (btnToggleSAView) btnToggleSAView.style.display = 'flex';
    } else if (isAnyAdmin(user)) {
        if (btnSuperAdmin) btnSuperAdmin.style.display = 'none';
        if (btnAdminConfig) btnAdminConfig.style.display = 'flex';
        if (btnToggleSAView) btnToggleSAView.style.display = 'none';
    } else {
        if (btnSuperAdmin) btnSuperAdmin.style.display = 'none';
        if (btnAdminConfig) btnAdminConfig.style.display = 'none';
        if (btnToggleSAView) btnToggleSAView.style.display = 'none';
    }

    // Configurar Banner
    const primerNombre = user.nombre ? user.nombre.trim().split(/\s+/)[0] : 'Colaborador';
    document.getElementById('welcomeGreeting').textContent = `¡Hola, ${primerNombre}!`;
    document.getElementById('welcomeSubtext').textContent = `Tu cargo (${user.cargo}) en la Gerencia de ${user.gerencia} - Área ${user.area} tiene los siguientes módulos y temas habilitados para tu inducción.`;

    currentCategoriaFilter = 'todos';
    actualizarBotonToggleSuperAdmin();
    renderizarCategoriasLaterales();
    renderizarModulos(user);
    actualizarGraficaCircularBanner(user);
}

function toggleVistaSuperAdminModulos() {
    if (!currentUser || !isSuperAdmin(currentUser)) return;
    superAdminVerTodosModulos = !superAdminVerTodosModulos;
    currentCategoriaFilter = 'todos';
    actualizarBotonToggleSuperAdmin();
    renderizarCategoriasLaterales();
    renderizarModulos(currentUser, document.getElementById('busquedaInput').value);
    actualizarGraficaCircularBanner(currentUser);
}

function actualizarBotonToggleSuperAdmin() {
    const btnText = document.getElementById('btnToggleSuperAdminText');
    if (!btnText) return;
    if (superAdminVerTodosModulos) {
        btnText.textContent = 'Modo Super Admin: Viendo Todos (14) · Clic para ver según mi cargo';
    } else {
        btnText.textContent = 'Modo Super Admin: Ver todos los módulos (14)';
    }
}

function cerrarSesion() {
    cerrarModuloViewer();
    sessionStorage.removeItem('rb_user');
    currentUser = null;
    superAdminVerTodosModulos = false;
    document.getElementById('userProfileBadge').style.display = 'none';
    mostrarModalAuth();
}

// =============================================================================
// FILTRADO ESTRICTO DE MÓDULOS Y TEMAS POR CARGO SEGÚN LAS "X" EN GOOGLE SHEETS
// Si el cargo no tiene ninguna "X" o un tema no tiene "X", NO se muestra ese tema
// =============================================================================
function isSubtemaHabilitadoParaCargo(subtema, cargoPerms) {
    if (!cargoPerms) return false;
    // 1. Verificar por índice exacto de columna en la hoja "Módulos por cargo" (1..81)
    if (cargoPerms.enabledCols && subtema.colIndex && cargoPerms.enabledCols[subtema.colIndex]) {
        return true;
    }
    // 2. Verificar por título normalizado (solo si no hay colIndex o coincide único)
    if (!subtema.colIndex && cargoPerms.modulosHabilitados) {
        if (cargoPerms.modulosHabilitados[subtema.titulo] || cargoPerms.modulosHabilitados[normalizeStr(subtema.titulo)]) {
            return true;
        }
    }
    return false;
}

function getModulosHabilitadosParaCargo(cargoUser, ignoreSuperAdminToggle = false) {
    // Si el Super Administrador activó explícitamente el modo vista completa de 14 módulos
    if (!ignoreSuperAdminToggle && superAdminVerTodosModulos && currentUser && isSuperAdmin(currentUser)) {
        return CATALOGO_MODULOS;
    }

    if (!cargoUser) return [];

    const cargoNorm = normalizeStr(cargoUser);

    // Buscar coincidencia en la hoja de Módulos por Cargo
    const cargoPerms = modulosPorCargoData.find(m => normalizeStr(m.cargo) === cargoNorm);

    const hasAnyX = cargoPerms && (
        (cargoPerms.enabledCols && Object.keys(cargoPerms.enabledCols).length > 0) ||
        (cargoPerms.modulosHabilitados && Object.keys(cargoPerms.modulosHabilitados).length > 0)
    );

    // REGLA ESTRICTA: Si el cargo no tiene ninguna "X" en la hoja "Módulos por cargo", retorna 0 módulos / 0 temas
    if (!hasAnyX) {
        return [];
    }

    // Filtrar cada módulo para conservar ÚNICAMENTE los subtemas que tienen 'X' para ese cargo
    const modulosFiltrados = [];
    CATALOGO_MODULOS.forEach(modulo => {
        const subtemasHabilitados = modulo.subtemas.filter(st => isSubtemaHabilitadoParaCargo(st, cargoPerms));
        if (subtemasHabilitados.length > 0) {
            modulosFiltrados.push({
                ...modulo,
                subtemas: subtemasHabilitados
            });
        }
    });

    return modulosFiltrados;
}

// =============================================================================
// GRÁFICA CIRCULAR (DONUT) Y RENDERIZADO DE CATEGORÍAS Y TARJETAS DE MÓDULOS
// =============================================================================
function actualizarGraficaCircularBanner(user) {
    const cCedula = user ? user.cedula : '';
    const stats = cCedula
        ? calcularEstadisticasAvance(cCedula, !superAdminVerTodosModulos)
        : { completados: 0, total: 0, temasVistos: 0, totalTemas: 0, porcentaje: 0 };

    const circle = document.getElementById('donutProgressCircle');
    const pctText = document.getElementById('donutPercentText');
    const modText = document.getElementById('donutModulosText');
    const temText = document.getElementById('donutTemasText');

    const circumference = 2 * Math.PI * 58; // r=58 -> 364.42
    const offset = circumference - (stats.porcentaje / 100) * circumference;

    if (circle) {
        circle.style.strokeDasharray = `${circumference.toFixed(2)}`;
        circle.style.strokeDashoffset = `${offset.toFixed(2)}`;
    }
    if (pctText) pctText.textContent = `${stats.porcentaje}%`;
    if (modText) modText.textContent = `${stats.completados}/${stats.total} módulos`;
    if (temText) temText.textContent = `${stats.temasVistos}/${stats.totalTemas} temas hab.`;
}

function renderizarCategoriasLaterales() {
    const track = document.getElementById('carruselTrack');
    const enabledModulos = getModulosHabilitadosParaCargo(currentUser ? currentUser.cargo : '');
    const totalTemas = enabledModulos.reduce((acc, m) => acc + m.subtemas.length, 0);

    let html = `
        <div class="categoria-item-vertical ${currentCategoriaFilter === 'todos' ? 'active' : ''}" onclick="filtrarCategoria('todos')">
            <i class="fas fa-th"></i>
            <span>Todos (${enabledModulos.length})</span>
        </div>
    `;

    enabledModulos.forEach(mod => {
        const isComp = currentUser ? isModuloCompletadoParaModObj(currentUser.cedula, mod) : false;
        html += `
            <div class="categoria-item-vertical ${currentCategoriaFilter === mod.slug ? 'active' : ''} ${isComp ? 'mod-completed-sidebar' : ''}" onclick="filtrarCategoria('${mod.slug}')">
                <i class="${mod.icono}"></i>
                <span style="flex:1;">${mod.numero}: ${mod.titulo} (${mod.subtemas.length})</span>
                ${isComp ? '<i class="fas fa-check-circle" style="color: #2ecc71;" title="Módulo Completado"></i>' : ''}
            </div>
        `;
    });

    track.innerHTML = html;

    const modLabel = enabledModulos.length === 1 ? '1 Módulo' : `${enabledModulos.length} Módulos`;
    const temaLabel = totalTemas === 1 ? '1 Tema Habilitado' : `${totalTemas} Temas Habilitados`;
    document.getElementById('statModulosCount').textContent = `${modLabel} · ${temaLabel}`;
}

function renderizarModulos(user, filterSearch = '') {
    const grid = document.getElementById('modulosGrid');
    const enabledModulos = getModulosHabilitadosParaCargo(user ? user.cargo : '');

    if (enabledModulos.length === 0) {
        const superAdminHint = (user && isSuperAdmin(user))
            ? `<div style="margin-top: 1.2rem;">
                    <button type="button" class="btn-sa-save" style="margin: 0 auto;" onclick="toggleVistaSuperAdminModulos()">
                        <i class="fas fa-eye"></i> Activar Vista Completa de Super Administrador (14 Módulos)
                    </button>
               </div>`
            : '';

        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3.5rem 2rem; background: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0; color: #475569;">
                <i class="fas fa-clipboard-list" style="font-size: 2.6rem; color: #0088cc; margin-bottom: 1rem;"></i>
                <h3 style="color: #001e47; margin-bottom: 0.5rem;">Sin temas habilitados actualmente para este cargo</h3>
                <p style="max-width: 560px; margin: 0 auto; font-size: 0.95rem;">
                    El cargo <strong>${user ? user.cargo : ''}</strong> no tiene temas marcados con <strong>"X"</strong> en la hoja <em>"Módulos por cargo"</em> de Google Sheets.
                </p>
                ${superAdminHint}
            </div>
        `;
        actualizarGraficaCircularBanner(user);
        return;
    }

    let modulosFiltrados = enabledModulos;

    if (currentCategoriaFilter !== 'todos') {
        modulosFiltrados = modulosFiltrados.filter(m => m.slug === currentCategoriaFilter);
    }

    if (filterSearch) {
        const query = filterSearch.toLowerCase();
        modulosFiltrados = modulosFiltrados.filter(m =>
            m.titulo.toLowerCase().includes(query) ||
            m.numero.toLowerCase().includes(query) ||
            m.subtemas.some(st => st.titulo.toLowerCase().includes(query))
        );
    }

    if (modulosFiltrados.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No se encontraron módulos disponibles para este filtro.</p>
            </div>
        `;
        return;
    }

    let html = '';
    modulosFiltrados.forEach(mod => {
        const modCompletado = user ? isModuloCompletadoParaModObj(user.cedula, mod) : false;
        const vistosEnMod = user
            ? mod.subtemas.filter((st, idx) => isSubtemaVistoPorUsuario(user.cedula, mod.id, st, idx)).length
            : 0;

        const quickEditBtn = (currentUser && isSuperAdmin(currentUser))
            ? `<button onclick="event.stopPropagation(); abrirEditorDirectoModulo(${mod.id})" title="Subir o editar material de este módulo" style="margin-top: 0.45rem; background: #f1f5f9; color: #001e47; border: 1px solid #cbd5e1; padding: 0.5rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                    <i class="fas fa-cloud-upload-alt" style="color: #0088cc;"></i> Subir / Editar Material (${mod.subtemas.length} temas)
               </button>`
            : '';

        const headerBadgeRight = modCompletado
            ? `<div class="modulo-completed-badge"><i class="fas fa-check-circle"></i> Completado</div>`
            : `<div class="modulo-card-icon"><i class="${mod.icono}"></i></div>`;

        html += `
            <div class="modulo-card ${modCompletado ? 'modulo-completado' : ''}">
                <div class="modulo-card-header" style="background-image: url('${mod.imagen}');">
                    <span class="modulo-number-badge">${mod.numero} · ${vistosEnMod}/${mod.subtemas.length} Temas</span>
                    ${headerBadgeRight}
                </div>
                <div class="modulo-card-body">
                    <h3 class="modulo-card-title">
                        ${mod.titulo}
                        ${modCompletado ? '<i class="fas fa-check-circle" style="color: #27ae60; margin-left: 6px;" title="Módulo 100% visto"></i>' : ''}
                    </h3>
                    <ul class="modulo-topics-list">
                        ${mod.subtemas.slice(0, 4).map((st, idx) => {
                            const seen = user ? isSubtemaVistoPorUsuario(user.cedula, mod.id, st, idx) : false;
                            return `<li class="modulo-topic-item ${seen ? 'topic-seen' : 'topic-pending'}">
                                <i class="fas ${seen ? 'fa-check-circle' : 'fa-circle'}"></i> ${st.titulo}
                            </li>`;
                        }).join('')}
                        ${mod.subtemas.length > 4 ? `<li class="modulo-topic-item"><em>+ ${mod.subtemas.length - 4} temas habilitados adicionales</em></li>` : ''}
                    </ul>
                    <button class="btn-open-modulo" style="${modCompletado ? 'background: #27ae60;' : ''}" onclick="abrirModuloViewer(${mod.id})">
                        <i class="fas ${modCompletado ? 'fa-check-double' : 'fa-play-circle'}"></i> ${modCompletado ? 'Módulo Completado (Repasar)' : 'Ingresar al Módulo'}
                    </button>
                    ${quickEditBtn}
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
    actualizarGraficaCircularBanner(user);
}

// EVENT LISTENERS DE BÚSQUEDA Y FILTROS
document.getElementById('busquedaInput').addEventListener('input', (e) => {
    renderizarModulos(currentUser, e.target.value);
});

function filtrarCategoria(slug) {
    currentCategoriaFilter = slug;
    renderizarCategoriasLaterales();
    renderizarModulos(currentUser, document.getElementById('busquedaInput').value);
}

// =============================================================================
// LÓGICA DE PROGRESO, CÁLCULO DE AVANCE POR TEMAS Y MÓDULOS, Y ESTADO ACTUAL
// =============================================================================
function getProgresoUsuario(cedula) {
    const cCedula = cleanCedula(cedula);
    const progressData = JSON.parse(localStorage.getItem('rb_user_progress') || '{}');
    return progressData[cCedula] || {};
}

function isSubtemaVistoPorUsuario(cedula, moduloId, subtema, indexInList) {
    const userProg = getProgresoUsuario(cedula);
    const modProg = userProg[moduloId] || {};
    if (subtema && subtema.colIndex && modProg[`col_${subtema.colIndex}`] === true) {
        return true;
    }
    return modProg[indexInList] === true;
}

function isModuloCompletadoParaModObj(cedula, modObj) {
    if (!modObj || !modObj.subtemas || modObj.subtemas.length === 0) return false;
    return modObj.subtemas.every((st, idx) => isSubtemaVistoPorUsuario(cedula, modObj.id, st, idx));
}

function guardarProgresoSubtema(cedula, moduloId, indexSubtema, colIndex = null) {
    const cCedula = cleanCedula(cedula);
    const progressData = JSON.parse(localStorage.getItem('rb_user_progress') || '{}');

    if (!progressData[cCedula]) {
        progressData[cCedula] = {};
    }
    if (!progressData[cCedula][moduloId]) {
        progressData[cCedula][moduloId] = {};
    }

    progressData[cCedula][moduloId][indexSubtema] = true;
    if (colIndex) {
        progressData[cCedula][moduloId][`col_${colIndex}`] = true;
    }
    localStorage.setItem('rb_user_progress', JSON.stringify(progressData));
    sincronizarMemoriaJSONPersistente();
}

function isModuloCompletado(cedula, moduloId) {
    const user = colaboradoresData.find(c => cleanCedula(c.cedula) === cleanCedula(cedula));
    const enabledModulos = getModulosHabilitadosParaCargo(user ? user.cargo : '', true);
    const mod = enabledModulos.find(m => m.id === moduloId);
    if (!mod) return null; // No aplica para este cargo

    return isModuloCompletadoParaModObj(cedula, mod);
}

function calcularEstadisticasAvance(cedula, ignoreSuperAdminToggle = true) {
    const user = colaboradoresData.find(c => cleanCedula(c.cedula) === cleanCedula(cedula));
    const enabledModulos = getModulosHabilitadosParaCargo(user ? user.cargo : '', ignoreSuperAdminToggle);
    const ingresos = getIngresosUsuario(cedula);

    if (enabledModulos.length === 0) {
        return {
            completados: 0,
            total: 0,
            temasVistos: 0,
            totalTemas: 0,
            porcentaje: 0,
            moduloActualTexto: 'Sin módulos asignados',
            temaActualTexto: 'Sin temas asignados'
        };
    }

    let completadosCount = 0;
    let temasVistosCount = 0;
    let totalTemasCount = 0;
    let primerModuloPendiente = null;
    let primerTemaPendiente = null;

    enabledModulos.forEach(mod => {
        let todosVistosEnMod = true;
        mod.subtemas.forEach((st, idx) => {
            totalTemasCount++;
            const visto = isSubtemaVistoPorUsuario(cedula, mod.id, st, idx);
            if (visto) {
                temasVistosCount++;
            } else {
                todosVistosEnMod = false;
                if (!primerModuloPendiente) {
                    primerModuloPendiente = mod;
                    primerTemaPendiente = st;
                }
            }
        });
        if (todosVistosEnMod && mod.subtemas.length > 0) {
            completadosCount++;
        }
    });

    const total = enabledModulos.length;
    // El % de avance se calcula proporcional a la cantidad de temas vistos sobre el total de temas habilitados
    const porcentaje = totalTemasCount > 0 ? Math.round((temasVistosCount / totalTemasCount) * 100) : 0;

    let moduloActualTexto = 'Sin iniciar';
    let temaActualTexto = 'Sin iniciar';

    if (temasVistosCount === totalTemasCount && totalTemasCount > 0) {
        moduloActualTexto = 'Completado (100%)';
        temaActualTexto = 'Todos los temas vistos';
    } else if (ingresos.ultimoModuloNombre && temasVistosCount > 0) {
        moduloActualTexto = primerModuloPendiente ? `${primerModuloPendiente.numero}: ${primerModuloPendiente.titulo}` : ingresos.ultimoModuloNombre;
        temaActualTexto = primerTemaPendiente ? primerTemaPendiente.titulo : (ingresos.ultimoTemaTitulo || 'En curso');
    } else if (temasVistosCount > 0 && primerModuloPendiente) {
        moduloActualTexto = `${primerModuloPendiente.numero}: ${primerModuloPendiente.titulo}`;
        temaActualTexto = primerTemaPendiente ? primerTemaPendiente.titulo : 'En curso';
    } else if (ingresos.ultimoModuloNombre) {
        moduloActualTexto = ingresos.ultimoModuloNombre;
        temaActualTexto = ingresos.ultimoTemaTitulo || 'En visualización';
    }

    return {
        completados: completadosCount,
        total,
        temasVistos: temasVistosCount,
        totalTemas: totalTemasCount,
        porcentaje,
        moduloActualTexto,
        temaActualTexto
    };
}

// =============================================================================
// VISOR DE MÓDULOS Y DETECCIÓN AUTOMÁTICA DEL 50% (VIDEO, PDF, HTML)
// =============================================================================
function getModuloParaVisor(moduloId) {
    const enabledModulos = getModulosHabilitadosParaCargo(currentUser ? currentUser.cargo : '');
    return enabledModulos.find(m => m.id === moduloId) || CATALOGO_MODULOS.find(m => m.id === moduloId);
}

function abrirModuloViewer(moduloId, startIndex = 0) {
    const mod = getModuloParaVisor(moduloId);
    if (!mod) return;

    currentModuloIdViewer = moduloId;
    const safeIdx = (startIndex >= 0 && startIndex < mod.subtemas.length) ? startIndex : 0;

    document.getElementById('viewerModuloTag').textContent = mod.numero;
    document.getElementById('viewerModuloTitulo').textContent = mod.titulo;

    renderizarTabsSubtemas(moduloId);
    cargarSubtemaMedia(moduloId, safeIdx);

    document.getElementById('moduloViewerModal').classList.add('active');
}

function renderizarTabsSubtemas(moduloId) {
    const mod = getModuloParaVisor(moduloId);
    if (!mod) return;

    const tabsContainer = document.getElementById('subtemasTabs');
    let tabsHtml = '';
    mod.subtemas.forEach((st, idx) => {
        const isSeen = currentUser ? isSubtemaVistoPorUsuario(currentUser.cedula, moduloId, st, idx) : false;
        tabsHtml += `
            <div class="subtema-tab ${idx === currentSubtemaIndexViewer ? 'active' : ''} ${isSeen ? 'tab-visto' : ''}" onclick="cargarSubtemaMedia(${mod.id}, ${idx})">
                ${isSeen ? '<i class="fas fa-check-circle" style="color: #27ae60; margin-right: 4px;"></i>' : ''}
                ${st.titulo}
            </div>
        `;
    });
    tabsContainer.innerHTML = tabsHtml;
}

function detenerTracking50Porciento() {
    if (viewerProgressTimer) {
        clearInterval(viewerProgressTimer);
        viewerProgressTimer = null;
    }
}

function iniciarTracking50Porciento(moduloId, indexSubtema, subtema, yaEstabaVisto) {
    detenerTracking50Porciento();

    if (yaEstabaVisto) {
        currentViewerPercent = 100;
        currentViewerAutoMarked = true;
        renderizarBarraProgresoVisor(100, true);
        return;
    }

    currentViewerPercent = 0;
    currentViewerAutoMarked = false;
    renderizarBarraProgresoVisor(0, false);

    // Tiempo estimado para alcanzar el 100% en contenidos embebidos (Drive/PDF/HTML):
    // En 8 segundos de visualización activa alcanza el 50% (o antes si hace scroll / reproduce video local)
    const incrementPerTick = subtema.tipo === 'video' ? 1.25 : (subtema.tipo === 'pdf' ? 1.5 : 2.0);

    viewerProgressTimer = setInterval(() => {
        const modal = document.getElementById('moduloViewerModal');
        if (!modal || !modal.classList.contains('active')) {
            detenerTracking50Porciento();
            return;
        }
        const nextPct = Math.min(100, currentViewerPercent + incrementPerTick);
        actualizarProgresoVisualizacionTema(nextPct);
    }, 250);
}

function actualizarProgresoVisualizacionTema(pct) {
    currentViewerPercent = Math.min(100, Math.max(0, pct));

    // Al llegar al 50% del contenido (Video, PDF o HTML), se marca automáticamente el check en el tema visto
    if (currentViewerPercent >= 50 && !currentViewerAutoMarked) {
        currentViewerAutoMarked = true;
        marcarSubtemaComoVisto(true);
    }

    renderizarBarraProgresoVisor(currentViewerPercent, currentViewerAutoMarked);

    if (currentViewerPercent >= 100) {
        detenerTracking50Porciento();
    }
}

function renderizarBarraProgresoVisor(pct, isCompleted) {
    const fill = document.getElementById('viewerProgressBarFill');
    const text = document.getElementById('viewerProgressText');
    const icon = document.getElementById('viewerProgressIcon');

    const rounded = Math.round(pct);
    if (fill) {
        fill.style.width = `${rounded}%`;
    }
    if (text) {
        if (isCompleted || rounded >= 50) {
            text.innerHTML = `<strong style="color: #166534;">✓ Tema Visto (${rounded}% visualizado — Superó el 50% requerido)</strong>`;
        } else {
            text.textContent = `Visualizando contenido (${rounded}%) — Al llegar al 50% se marcará visto automáticamente`;
        }
    }
    if (icon) {
        icon.className = (isCompleted || rounded >= 50) ? 'fas fa-check-circle' : 'fas fa-clock';
        icon.style.color = (isCompleted || rounded >= 50) ? '#27ae60' : '#0088cc';
    }
}

function liberarBlobUrlActivo() {
    if (activeBlobUrl) {
        try { URL.revokeObjectURL(activeBlobUrl); } catch (e) {}
        activeBlobUrl = null;
    }
}

function dataUrlToBlobUrl(dataUrl) {
    try {
        const parts = dataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        activeBlobUrl = URL.createObjectURL(blob);
        return activeBlobUrl;
    } catch (e) {
        return dataUrl;
    }
}

function cargarSubtemaMedia(moduloId, indexSubtema) {
    currentModuloIdViewer = moduloId;
    currentSubtemaIndexViewer = indexSubtema;

    const mod = getModuloParaVisor(moduloId);
    if (!mod || !mod.subtemas[indexSubtema]) return;

    const subtema = mod.subtemas[indexSubtema];
    const iframe = document.getElementById('moduloIframe');
    const mediaBar = document.getElementById('temaMultimediaBar');

    // Registrar en memoria JSON en qué módulo y tema se encuentra actualmente el colaborador
    if (currentUser) {
        registrarPosicionActualUsuario(currentUser.cedula, mod, subtema);
    }

    if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
    }
    liberarBlobUrlActivo();

    let mediaBarHtml = '';

    if (subtema.audio) {
        mediaBarHtml += `
            <button class="btn-media-audio" onclick="reproducirAudioTema('${subtema.audio}')">
                <i class="fas fa-volume-up"></i> Reproducir Audio Explicativo
            </button>
        `;
    }

    if (subtema.popup && (subtema.popup.titulo || subtema.popup.content)) {
        const safePopupTitle = (subtema.popup.titulo || 'Información Adicional').replace(/'/g, "\\'");
        mediaBarHtml += `
            <button class="btn-media-popup" onclick="abrirInfoPopupSubtemaActual()">
                <i class="fas fa-external-link-alt"></i> ${safePopupTitle}
            </button>
        `;
    }

    const ytVideoId = extractYouTubeId(subtema.url || '');
    if (ytVideoId) {
        mediaBarHtml += `
            <a class="btn-media-popup" href="https://www.youtube.com/watch?v=${ytVideoId}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; background:#dc2626; color:#ffffff; border-color:#dc2626;">
                <i class="fab fa-youtube"></i> Abrir en YouTube
            </a>
        `;
    }

    if (currentUser && isSuperAdmin(currentUser)) {
        mediaBarHtml += `
            <button class="btn-media-audio" style="margin-left: auto; background: #001e47;" onclick="editarSubtemaActualEnSuperAdmin(${moduloId}, ${subtema.colIndex})">
                <i class="fas fa-cloud-upload-alt"></i> Subir / Cambiar Material de este Tema
            </button>
        `;
    }

    mediaBar.innerHTML = mediaBarHtml;
    mediaBar.style.display = mediaBarHtml.trim() ? 'flex' : 'none';

    renderizarTabsSubtemas(moduloId);

    iframe.style.display = 'block';

    // Script que se inyecta en iframes HTML/Video locales para reportar el % exacto de reproducción o lectura/scroll
    const trackerScriptHtml = `
        <script>
            (function() {
                function reportPct(p) {
                    window.parent.postMessage({ type: 'RB_VIEWER_PROGRESS_UPDATE', percent: p }, '*');
                }
                const vid = document.querySelector('video');
                if (vid) {
                    vid.addEventListener('timeupdate', function() {
                        if (vid.duration > 0) {
                            reportPct((vid.currentTime / vid.duration) * 100);
                        }
                    });
                }
                window.addEventListener('scroll', function() {
                    const doc = document.documentElement;
                    const scrollTotal = doc.scrollHeight - doc.clientHeight;
                    if (scrollTotal > 30) {
                        const pct = ((doc.scrollTop + doc.clientHeight) / doc.scrollHeight) * 100;
                        reportPct(pct);
                    }
                });
            })();
        <\/script>
    `;

    if (subtema.tipo === 'video') {
        if (subtema.fileDataUrl || (subtema.url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(subtema.url))) {
            const videoSrc = subtema.fileDataUrl ? dataUrlToBlobUrl(subtema.fileDataUrl) : subtema.url;
            iframe.removeAttribute('src');
            iframe.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; height: 100vh; }
                        video { max-width: 100%; max-height: 100vh; width: 100%; height: 100%; outline: none; }
                    </style>
                </head>
                <body>
                    <video src="${videoSrc}" controls autoplay></video>
                    ${trackerScriptHtml}
                </body>
                </html>
            `;
        } else {
            iframe.removeAttribute('srcdoc');
            iframe.src = buildViewerMediaUrl(subtema.url || '');
        }
    } else if (subtema.tipo === 'pdf') {
        iframe.removeAttribute('srcdoc');
        if (subtema.fileDataUrl) {
            iframe.src = dataUrlToBlobUrl(subtema.fileDataUrl);
        } else {
            iframe.src = buildViewerMediaUrl(subtema.url || '');
        }
    } else if (subtema.tipo === 'url') {
        iframe.removeAttribute('srcdoc');
        iframe.src = buildViewerMediaUrl(subtema.url || '');
    } else if (subtema.tipo === 'html') {
        if (subtema.url && subtema.url.trim() !== '' && (!subtema.content || subtema.content.trim() === '')) {
            iframe.removeAttribute('srcdoc');
            iframe.src = subtema.url.trim();
        } else {
            iframe.removeAttribute('src');
            const rawHtml = subtema.content || '';
            const isFullHtmlDoc = /<!DOCTYPE\s+html|<html[\s>]/i.test(rawHtml);
            if (isFullHtmlDoc) {
                iframe.srcdoc = rawHtml + trackerScriptHtml;
            } else {
                iframe.srcdoc = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
                        <style>
                            body { font-family: 'Outfit', sans-serif; padding: 2.5rem; color: #1e293b; line-height: 1.6; background: #ffffff; }
                            h3 { color: #001e47; font-size: 1.4rem; margin-bottom: 1rem; border-bottom: 2px solid #0088cc; padding-bottom: 0.5rem; }
                            p { font-size: 1.05rem; color: #334155; margin-bottom: 1rem; }
                            img, video, iframe { max-width: 100%; border-radius: 12px; }
                        </style>
                    </head>
                    <body>
                        ${rawHtml}
                        ${trackerScriptHtml}
                    </body>
                    </html>
                `;
            }
        }
    }

    const isSeen = currentUser ? isSubtemaVistoPorUsuario(currentUser.cedula, moduloId, subtema, indexSubtema) : false;
    actualizarEstadoBotonCompletarTema(isSeen);
    iniciarTracking50Porciento(moduloId, indexSubtema, subtema, isSeen);
}

function actualizarEstadoBotonCompletarTema(isSeen) {
    const btnCompletar = document.getElementById('btnCompletarTema');
    if (!btnCompletar) return;
    if (isSeen) {
        btnCompletar.classList.add('visto');
        btnCompletar.innerHTML = '<i class="fas fa-check-double"></i> Tema Visto';
    } else {
        btnCompletar.classList.remove('visto');
        btnCompletar.innerHTML = '<i class="fas fa-check-circle"></i> Marcar Tema como Visto';
    }
}

function reproducirAudioTema(audioUrl) {
    if (activeAudio) {
        activeAudio.pause();
    }
    activeAudio = new Audio(audioUrl);
    activeAudio.play().catch(() => {
        alert(`Para reproducir este audio, asegúrate de colocar el archivo MP3 en la ruta configurada o subirlo desde el módulo Super Administrador:\n${audioUrl}`);
    });
}

function abrirInfoPopupSubtemaActual() {
    const mod = getModuloParaVisor(currentModuloIdViewer);
    if (!mod || !mod.subtemas[currentSubtemaIndexViewer]) return;
    const popup = mod.subtemas[currentSubtemaIndexViewer].popup;
    if (popup) {
        abrirInfoPopup(popup.titulo || 'Información Complementaria', popup.content || '');
    }
}

function marcarSubtemaComoVisto(isAuto50 = false) {
    if (!currentUser || !currentModuloIdViewer) return;
    const mod = getModuloParaVisor(currentModuloIdViewer);
    const subtema = mod && mod.subtemas[currentSubtemaIndexViewer] ? mod.subtemas[currentSubtemaIndexViewer] : null;

    guardarProgresoSubtema(currentUser.cedula, currentModuloIdViewer, currentSubtemaIndexViewer, subtema ? subtema.colIndex : null);
    currentViewerAutoMarked = true;

    if (!isAuto50) {
        currentViewerPercent = 100;
        detenerTracking50Porciento();
        renderizarBarraProgresoVisor(100, true);
    }

    actualizarEstadoBotonCompletarTema(true);
    renderizarTabsSubtemas(currentModuloIdViewer);
    renderizarCategoriasLaterales();
    renderizarModulos(currentUser, document.getElementById('busquedaInput').value);
    actualizarGraficaCircularBanner(currentUser);
}

function cerrarModuloViewer() {
    detenerTracking50Porciento();
    if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
    }
    liberarBlobUrlActivo();
    const modal = document.getElementById('moduloViewerModal');
    if (modal) modal.classList.remove('active');
    const iframe = document.getElementById('moduloIframe');
    if (iframe) {
        iframe.removeAttribute('srcdoc');
        iframe.src = '';
    }
}

// POPUP INFORMATIVO EMERGENTE
function abrirInfoPopup(titulo, htmlContent) {
    document.getElementById('infoPopupTitle').innerHTML = `<i class="fas fa-info-circle"></i> ${titulo}`;
    document.getElementById('infoPopupBody').innerHTML = htmlContent;
    document.getElementById('infoPopupModal').classList.add('active');
}

function cerrarInfoPopup() {
    document.getElementById('infoPopupModal').classList.remove('active');
}

// =============================================================================
// MÓDULO SUPER ADMINISTRADOR (GESTOR DE CONTENIDOS + STATUS Y EXCEL DE COLABORADORES)
// =============================================================================
function abrirPanelAdmin(defaultTab = 'contenidos') {
    if (!currentUser || !isAnyAdmin(currentUser)) {
        alert('Acceso restringido únicamente para usuarios con rol de Super Administrador o Administrador.');
        return;
    }

    const tabBtnContenidos = document.getElementById('tabBtnContenidos');
    if (isSuperAdmin(currentUser)) {
        tabBtnContenidos.style.display = 'flex';
    } else {
        tabBtnContenidos.style.display = 'none';
        defaultTab = 'avance';
    }

    inicializarSelectorModulosSA();
    renderizarTablaAdmin();
    cambiarTabAdmin(defaultTab);

    document.getElementById('adminModal').classList.add('active');
}

function cerrarPanelAdmin() {
    document.getElementById('adminModal').classList.remove('active');
}

function cambiarTabAdmin(tab) {
    const tabContenidos = document.getElementById('adminTabContenidos');
    const tabAvance = document.getElementById('adminTabAvance');
    const btnContenidos = document.getElementById('tabBtnContenidos');
    const btnAvance = document.getElementById('tabBtnAvance');

    if (tab === 'contenidos' && isSuperAdmin(currentUser)) {
        tabContenidos.style.display = 'flex';
        tabAvance.style.display = 'none';
        btnContenidos.classList.add('active');
        btnAvance.classList.remove('active');
    } else {
        tabContenidos.style.display = 'none';
        tabAvance.style.display = 'flex';
        btnContenidos.classList.remove('active');
        btnAvance.classList.add('active');
        renderizarTablaAdmin(document.getElementById('adminSearchInput') ? document.getElementById('adminSearchInput').value : '');
    }
}

function abrirEditorDirectoModulo(moduloId) {
    saCurrentModuloId = moduloId;
    const mod = CATALOGO_MODULOS.find(m => m.id === moduloId);
    if (mod && mod.subtemas.length > 0) {
        saCurrentSubtemaColIndex = mod.subtemas[0].colIndex;
    }
    abrirPanelAdmin('contenidos');
}

function editarSubtemaActualEnSuperAdmin(moduloId, colIndex) {
    cerrarModuloViewer();
    saCurrentModuloId = moduloId;
    saCurrentSubtemaColIndex = colIndex;
    abrirPanelAdmin('contenidos');
}

function inicializarSelectorModulosSA() {
    const select = document.getElementById('saSelectModulo');
    if (!select) return;

    select.innerHTML = CATALOGO_MODULOS.map(mod =>
        `<option value="${mod.id}" ${mod.id === saCurrentModuloId ? 'selected' : ''}>${mod.numero}: ${mod.titulo} (${mod.subtemas.length} temas)</option>`
    ).join('');

    renderizarListaTemasSA();
}

function onChangeSaModulo() {
    const select = document.getElementById('saSelectModulo');
    saCurrentModuloId = parseInt(select.value, 10) || 1;
    const mod = CATALOGO_MODULOS.find(m => m.id === saCurrentModuloId);
    if (mod && mod.subtemas.length > 0) {
        saCurrentSubtemaColIndex = mod.subtemas[0].colIndex;
    }
    renderizarListaTemasSA();
}

function renderizarListaTemasSA() {
    const mod = CATALOGO_MODULOS.find(m => m.id === saCurrentModuloId);
    const listEl = document.getElementById('saTemasList');
    if (!mod || !listEl) return;

    if (!mod.subtemas.some(st => st.colIndex === saCurrentSubtemaColIndex)) {
        saCurrentSubtemaColIndex = mod.subtemas[0].colIndex;
    }

    let html = '';
    mod.subtemas.forEach(st => {
        const isActive = st.colIndex === saCurrentSubtemaColIndex;
        const typeBadge = (st.tipo || 'html').toUpperCase();
        const customIcon = st.isCustomized ? '<i class="fas fa-star" style="color:#f59e0b; margin-right:4px;" title="Contenido personalizado por Super Admin"></i>' : '';
        html += `
            <div class="sa-tema-item ${isActive ? 'active' : ''}" onclick="seleccionarTemaSA(${st.colIndex})">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${customIcon}${st.titulo}</span>
                <span class="sa-tema-type-pill">${typeBadge}</span>
            </div>
        `;
    });

    listEl.innerHTML = html;
    cargarDatosTemaEnFormularioSA();
}

function seleccionarTemaSA(colIndex) {
    saCurrentSubtemaColIndex = colIndex;
    renderizarListaTemasSA();
}

function obtenerSubtemaCatalogoPorCol(colIndex) {
    for (const mod of CATALOGO_MODULOS) {
        const found = mod.subtemas.find(st => st.colIndex === colIndex);
        if (found) return { mod, subtema: found };
    }
    return null;
}

function cargarDatosTemaEnFormularioSA() {
    const found = obtenerSubtemaCatalogoPorCol(saCurrentSubtemaColIndex);
    if (!found) return;

    const { mod, subtema } = found;

    saTempUploadedData = {
        videoDataUrl: subtema.tipo === 'video' ? (subtema.fileDataUrl || null) : null,
        videoFileName: subtema.tipo === 'video' ? (subtema.fileName || null) : null,
        pdfDataUrl: subtema.tipo === 'pdf' ? (subtema.fileDataUrl || null) : null,
        pdfFileName: subtema.tipo === 'pdf' ? (subtema.fileName || null) : null,
        audioDataUrl: null
    };

    document.getElementById('saEditorModuloBadge').textContent = `${mod.numero} · ${mod.titulo}`;
    document.getElementById('saEditorTemaTitulo').textContent = subtema.titulo;
    document.getElementById('saSaveFeedback').textContent = '';

    document.getElementById('saVideoUrlInput').value = (subtema.tipo === 'video' && subtema.url) ? subtema.url : '';
    document.getElementById('saVideoFileStatus').textContent = saTempUploadedData.videoFileName
        ? `✓ Archivo de video cargado: ${saTempUploadedData.videoFileName}`
        : 'Haz clic aquí o arrastra un archivo de video (.mp4)';

    document.getElementById('saHtmlUrlInput').value = (subtema.tipo === 'html' && subtema.url) ? subtema.url : '';
    document.getElementById('saHtmlContentInput').value = subtema.content || '';
    document.getElementById('saHtmlFileStatus').textContent = (subtema.tipo === 'html' && subtema.fileName)
        ? `✓ Archivo HTML cargado: ${subtema.fileName}`
        : 'Haz clic aquí para seleccionar tu archivo .HTML (se cargará su contenido completo)';

    document.getElementById('saPdfUrlInput').value = (subtema.tipo === 'pdf' && subtema.url) ? subtema.url : '';
    document.getElementById('saPdfFileStatus').textContent = saTempUploadedData.pdfFileName
        ? `✓ Documento PDF cargado: ${saTempUploadedData.pdfFileName}`
        : 'Haz clic aquí para seleccionar y cargar un documento .PDF desde tu equipo';

    document.getElementById('saAudioUrlInput').value = subtema.audio || '';
    document.getElementById('saPopupTitleInput').value = (subtema.popup && subtema.popup.titulo) ? subtema.popup.titulo : '';
    document.getElementById('saPopupContentInput').value = (subtema.popup && subtema.popup.content) ? subtema.popup.content : '';

    const tipo = (subtema.tipo === 'video' || subtema.tipo === 'pdf' || subtema.tipo === 'html') ? subtema.tipo : 'html';
    seleccionarTipoMaterialSA(tipo);
    actualizarAyudaUrlVideo();
}

function seleccionarTipoMaterialSA(tipo) {
    saCurrentMaterialType = tipo;

    document.getElementById('saTypeBtnVideo').classList.toggle('active', tipo === 'video');
    document.getElementById('saTypeBtnHtml').classList.toggle('active', tipo === 'html');
    document.getElementById('saTypeBtnPdf').classList.toggle('active', tipo === 'pdf');

    document.getElementById('saPaneVideo').style.display = tipo === 'video' ? 'flex' : 'none';
    document.getElementById('saPaneHtml').style.display = tipo === 'html' ? 'flex' : 'none';
    document.getElementById('saPanePdf').style.display = tipo === 'pdf' ? 'flex' : 'none';
}

function actualizarAyudaUrlVideo() {
    const raw = document.getElementById('saVideoUrlInput').value.trim();
    const helper = document.getElementById('saVideoUrlHelper');
    if (!raw) {
        helper.innerHTML = '💡 Puedes pegar cualquier enlace normal de <strong>YouTube</strong> o <strong>Google Drive</strong>; el sistema lo convierte automáticamente a formato integrable (<code>/embed/</code> o <code>/preview</code>).';
        return;
    }
    const converted = formatEmbedUrl(raw);
    if (converted !== raw) {
        helper.innerHTML = `✅ Enlace convertido automáticamente para el visor: <code>${converted}</code>`;
    } else {
        helper.innerHTML = `🔗 Enlace listo para el visor: <code>${converted}</code>`;
    }
}

function procesarSubidaArchivoSA(event, tipo) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (tipo === 'html') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const htmlText = e.target.result;
            document.getElementById('saHtmlContentInput').value = htmlText;
            document.getElementById('saHtmlUrlInput').value = '';
            document.getElementById('saHtmlFileStatus').textContent = `✓ Archivo HTML cargado: ${file.name} (${Math.round(file.size / 1024)} KB) — Pulsa "Guardar Contenido"`;
            saTempUploadedData.htmlFileName = file.name;
        };
        reader.readAsText(file, 'UTF-8');
    } else if (tipo === 'pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
            saTempUploadedData.pdfDataUrl = e.target.result;
            saTempUploadedData.pdfFileName = file.name;
            document.getElementById('saPdfFileStatus').textContent = `✓ PDF listo: ${file.name} (${Math.round(file.size / 1024)} KB) — Pulsa "Guardar Contenido"`;
        };
        reader.readAsDataURL(file);
    } else if (tipo === 'video') {
        const reader = new FileReader();
        reader.onload = (e) => {
            saTempUploadedData.videoDataUrl = e.target.result;
            saTempUploadedData.videoFileName = file.name;
            document.getElementById('saVideoFileStatus').textContent = `✓ Video listo: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB) — Pulsa "Guardar Contenido"`;
        };
        reader.readAsDataURL(file);
    }
}

function procesarSubidaAudioSA(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('saAudioUrlInput').value = e.target.result;
        document.getElementById('saSaveFeedback').textContent = `🎵 Audio ${file.name} cargado. Recuerda pulsar Guardar.`;
    };
    reader.readAsDataURL(file);
}

async function guardarContenidoTemaSA() {
    const found = obtenerSubtemaCatalogoPorCol(saCurrentSubtemaColIndex);
    if (!found) return;

    const { subtema } = found;
    const tipo = saCurrentMaterialType;

    let newUrl = '';
    let newContent = '';
    let newFileDataUrl = null;
    let newFileName = null;

    if (tipo === 'video') {
        const rawUrl = document.getElementById('saVideoUrlInput').value.trim();
        newUrl = rawUrl ? formatEmbedUrl(rawUrl) : '';
        newFileDataUrl = saTempUploadedData.videoDataUrl || null;
        newFileName = saTempUploadedData.videoFileName || null;

        if (!newUrl && !newFileDataUrl) {
            alert('Por favor ingresa el link del video (YouTube / Google Drive) o sube un archivo de video (.mp4).');
            return;
        }
    } else if (tipo === 'html') {
        newUrl = document.getElementById('saHtmlUrlInput').value.trim();
        newContent = document.getElementById('saHtmlContentInput').value;
        newFileName = saTempUploadedData.htmlFileName || subtema.fileName || null;

        if (!newUrl && !newContent.trim()) {
            alert('Por favor sube un archivo .HTML, escribe el código HTML o indica la ruta del archivo.');
            return;
        }
    } else if (tipo === 'pdf') {
        const rawPdfUrl = document.getElementById('saPdfUrlInput').value.trim();
        newUrl = rawPdfUrl ? formatEmbedUrl(rawPdfUrl) : '';
        newFileDataUrl = saTempUploadedData.pdfDataUrl || null;
        newFileName = saTempUploadedData.pdfFileName || null;

        if (!newUrl && !newFileDataUrl) {
            alert('Por favor sube un archivo .PDF desde tu equipo o pega el enlace del PDF (ej. Google Drive).');
            return;
        }
    }

    const audioVal = document.getElementById('saAudioUrlInput').value.trim();
    const popupTitle = document.getElementById('saPopupTitleInput').value.trim();
    const popupContent = document.getElementById('saPopupContentInput').value.trim();
    const popupObj = (popupTitle || popupContent) ? { titulo: popupTitle || 'Información Adicional', content: popupContent } : null;

    const customRecord = {
        colIndex: saCurrentSubtemaColIndex,
        tipo,
        url: newUrl,
        content: newContent,
        fileDataUrl: newFileDataUrl,
        fileName: newFileName,
        audio: audioVal,
        popup: popupObj,
        updatedAt: new Date().toISOString()
    };

    await guardarSubtemaCustomEnDB(saCurrentSubtemaColIndex, customRecord);
    await cargarTodosSubtemasCustomDeDB();

    renderizarListaTemasSA();
    renderizarCategoriasLaterales();
    renderizarModulos(currentUser, document.getElementById('busquedaInput').value);

    const feedback = document.getElementById('saSaveFeedback');
    feedback.innerHTML = '<i class="fas fa-check-circle"></i> ¡Contenido guardado y publicado exitosamente en el tema!';
    setTimeout(() => {
        if (feedback) feedback.textContent = '';
    }, 4500);
}

async function restaurarTemaPorDefectoSA() {
    if (!confirm('¿Deseas restaurar este tema a su contenido original por defecto?')) return;

    await eliminarSubtemaCustomDeDB(saCurrentSubtemaColIndex);
    await cargarTodosSubtemasCustomDeDB();

    renderizarListaTemasSA();
    renderizarCategoriasLaterales();
    renderizarModulos(currentUser, document.getElementById('busquedaInput').value);

    const feedback = document.getElementById('saSaveFeedback');
    feedback.innerHTML = '<i class="fas fa-undo"></i> Tema restaurado al valor por defecto.';
}

function previsualizarTemaActualEnVisor() {
    const found = obtenerSubtemaCatalogoPorCol(saCurrentSubtemaColIndex);
    if (!found) return;

    const { mod, subtema } = found;
    cerrarPanelAdmin();

    const visibleMod = getModuloParaVisor(mod.id);
    let idx = visibleMod ? visibleMod.subtemas.findIndex(st => st.colIndex === subtema.colIndex) : -1;
    if (idx === -1) {
        superAdminVerTodosModulos = true;
        actualizarBotonToggleSuperAdmin();
        renderizarCategoriasLaterales();
        renderizarModulos(currentUser);
        const allMod = getModuloParaVisor(mod.id);
        idx = allMod ? allMod.subtemas.findIndex(st => st.colIndex === subtema.colIndex) : 0;
    }

    abrirModuloViewer(mod.id, Math.max(0, idx));
}

// EXPORTAR E IMPORTAR RESPALDO DE CONTENIDOS (JSON)
async function exportarCatalogoContenidos() {
    const db = await abrirIndexedDB();
    let exportedCustom = {};
    try {
        exportedCustom = JSON.parse(localStorage.getItem('rb_custom_subtemas_v2') || '{}');
    } catch (e) {}

    if (db) {
        await new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const store = tx.objectStore(IDB_STORE);
            const req = store.getAll();
            req.onsuccess = () => {
                if (Array.isArray(req.result)) {
                    req.result.forEach(item => {
                        exportedCustom[item.colIndex] = item;
                    });
                }
                resolve();
            };
            req.onerror = () => resolve();
        });
    }

    const blob = new Blob([JSON.stringify(exportedCustom, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Contenidos_Induccion_RB_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarCatalogoContenidos(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            const keys = Object.keys(imported);
            for (const k of keys) {
                const colIdx = parseInt(k, 10);
                if (colIdx) {
                    await guardarSubtemaCustomEnDB(colIdx, imported[k]);
                }
            }
            await cargarTodosSubtemasCustomDeDB();
            renderizarListaTemasSA();
            renderizarCategoriasLaterales();
            renderizarModulos(currentUser);
            alert(`✓ Se importaron satisfactoriamente ${keys.length} temas configurados.`);
        } catch (err) {
            alert('El archivo seleccionado no tiene un formato de respaldo JSON válido.');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// =============================================================================
// CONTROLES DE ZOOM EN ORGANIGRAMA
// =============================================================================
function zoomOrganigrama(delta) {
    currentZoomOrg = Math.min(Math.max(0.5, currentZoomOrg + delta), 2.0);
    const body = document.getElementById('orgModalBody');
    if (body) {
        body.style.transform = `scale(${currentZoomOrg})`;
        body.style.transformOrigin = 'top center';
    }
}

function resetZoomOrganigrama() {
    currentZoomOrg = 1.0;
    const body = document.getElementById('orgModalBody');
    if (body) {
        body.style.transform = 'scale(1.0)';
    }
}

function abrirOrganigrama() {
    if (!currentUser) return;

    resetZoomOrganigrama();
    const modalBody = document.getElementById('orgModalBody');
    modalBody.innerHTML = construirOrganigramaHTML(currentUser);

    document.getElementById('orgModal').classList.add('active');
}

function cerrarOrganigrama() {
    document.getElementById('orgModal').classList.remove('active');
}

function construirOrganigramaHTML(user) {
    const jerarquiaCadena = [];
    let curr = user;
    const visited = new Set();

    if (curr.jefe) {
        let j = colaboradoresData.find(c => cleanCedula(c.cedula) === cleanCedula(curr.jefe));
        while (j && !visited.has(cleanCedula(j.cedula))) {
            visited.add(cleanCedula(j.cedula));
            jerarquiaCadena.unshift(j);
            if (j.jefe) {
                j = colaboradoresData.find(c => cleanCedula(c.cedula) === cleanCedula(j.jefe));
            } else {
                j = null;
            }
        }
    }

    const jefeDirectoCedula = user.jefe ? cleanCedula(user.jefe) : null;

    const colaboradoresMismoJefe = colaboradoresData.filter(c => {
        return jefeDirectoCedula && cleanCedula(c.jefe) === jefeDirectoCedula;
    });

    const pool = colaboradoresMismoJefe.length > 0
        ? colaboradoresMismoJefe
        : colaboradoresData.filter(c => c.gerencia === user.gerencia && cleanCedula(c.cedula) !== jefeDirectoCedula);

    const agrupadoPorArea = {};
    pool.forEach(c => {
        const areaName = c.area || 'General';
        if (!agrupadoPorArea[areaName]) {
            agrupadoPorArea[areaName] = [];
        }
        agrupadoPorArea[areaName].push(c);
    });

    const aCargo = colaboradoresData.filter(c => cleanCedula(c.jefe) === cleanCedula(user.cedula));

    let html = `<div class="org-tree">`;

    jerarquiaCadena.forEach((boss, index) => {
        html += `
            <div class="org-level">
                ${renderNodeCard(boss, false, index === jerarquiaCadena.length - 1 ? 'JEFE DIRECTO' : 'SUPERIOR')}
            </div>
            <div class="org-connector-line"></div>
        `;
    });

    html += `<div class="org-areas-branches-wrapper">`;

    Object.keys(agrupadoPorArea).forEach(areaName => {
        const personasArea = agrupadoPorArea[areaName];
        const contieneTarget = personasArea.some(p => cleanCedula(p.cedula) === cleanCedula(user.cedula));

        html += `
            <div class="org-area-branch ${contieneTarget ? 'branch-target-area' : ''}">
                <div class="org-area-branch-header">
                    <i class="fas fa-layer-group"></i> ${areaName} (${personasArea.length})
                </div>
                <div class="org-area-branch-content">
        `;

        personasArea.forEach(person => {
            const isTarget = cleanCedula(person.cedula) === cleanCedula(user.cedula);
            html += renderNodeCard(person, isTarget, isTarget ? 'TÚ' : 'COMPAÑERO');
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `</div>`;

    if (aCargo.length > 0) {
        html += `<div class="org-connector-line"></div>`;
        html += `<div class="org-level-header"><i class="fas fa-users"></i> Colaboradores a su Cargo Directo</div>`;
        html += `<div class="org-level">`;
        aCargo.forEach(sub => {
            html += renderNodeCard(sub, false, 'A CARGO');
        });
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function renderNodeCard(person, isTarget = false, tagText = '') {
    const fotoSrc = formatFotoUrl(person.foto);
    const badgeHtml = isTarget
        ? `<div class="org-node-badge badge-tu">TÚ</div>`
        : (tagText ? `<div class="org-node-badge">${tagText}</div>` : '');

    return `
        <div class="org-node-card ${isTarget ? 'active-user' : ''}">
            ${badgeHtml}
            <img src="${fotoSrc}" class="org-node-avatar" onerror="this.src='${DEFAULT_AVATAR}'">
            <div class="org-node-name">${person.nombre}</div>
            <div class="org-node-cargo">${person.cargo}</div>
            <div class="org-node-gerencia"><i class="fas fa-building"></i> ${person.gerencia || 'Recaudo Bogotá'}</div>
            <div class="org-node-area"><i class="fas fa-sitemap"></i> ${person.area}</div>
        </div>
    `;
}

// =============================================================================
// VENTANA DE STATUS DE COLABORADORES, REPORTE EXCEL (.XLSX) Y ACTAS PDF
// =============================================================================
function renderizarTablaAdmin(filterText = '') {
    const tbody = document.getElementById('tablaAdminBody');
    if (!tbody) return;
    const query = filterText.toLowerCase().trim();

    let colaboradoresFiltrados = colaboradoresData;
    if (query) {
        colaboradoresFiltrados = colaboradoresFiltrados.filter(c =>
            c.nombre.toLowerCase().includes(query) ||
            cleanCedula(c.cedula).includes(query) ||
            c.cargo.toLowerCase().includes(query) ||
            c.area.toLowerCase().includes(query) ||
            (c.gerencia || '').toLowerCase().includes(query)
        );
    }

    let rowsHtml = '';
    let totalCompletadosGlobal = 0;
    let totalConIngresos = 0;

    colaboradoresFiltrados.forEach(colab => {
        const stats = calcularEstadisticasAvance(colab.cedula, true);
        const ingresos = getIngresosUsuario(colab.cedula);

        if (stats.porcentaje === 100 && stats.total > 0) totalCompletadosGlobal++;
        if (ingresos.cantidadIngresos > 0) totalConIngresos++;

        let modulosCeldas = '';
        for (let mId = 1; mId <= 14; mId++) {
            const estadoMod = isModuloCompletado(colab.cedula, mId);

            if (estadoMod === null) {
                modulosCeldas += `<td class="cell-na" title="No aplica para el cargo de ${colab.cargo}">N/A</td>`;
            } else if (estadoMod === true) {
                modulosCeldas += `<td class="cell-check" title="Módulo ${mId}: Completado"><i class="fas fa-check"></i></td>`;
            } else {
                modulosCeldas += `<td class="cell-empty" title="Módulo ${mId}: Pendiente">-</td>`;
            }
        }

        rowsHtml += `
            <tr>
                <td class="font-mono"><strong>${colab.cedula}</strong></td>
                <td><strong>${colab.nombre}</strong></td>
                <td><small>${colab.cargo}</small></td>
                <td><span class="badge-area">${colab.area}</span></td>
                <td><small>${colab.gerencia || 'RB'}</small></td>
                <td><small>${ingresos.primerIngreso}</small></td>
                <td><small>${ingresos.ultimoIngreso}</small></td>
                <td style="text-align: center;"><strong>${ingresos.cantidadIngresos}</strong></td>
                <td><small><strong>${stats.moduloActualTexto}</strong></small></td>
                <td><small>${stats.temaActualTexto}</small></td>
                <td style="text-align: center;"><strong>${stats.completados}/${stats.total}</strong></td>
                <td style="text-align: center;"><strong>${stats.temasVistos}/${stats.totalTemas}</strong></td>
                <td>
                    <div class="progress-cell">
                        <span class="progress-text">${stats.porcentaje}%</span>
                        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${stats.porcentaje}%;"></div></div>
                    </div>
                </td>
                ${modulosCeldas}
                <td>
                    <button class="btn-descargar-acta" onclick="generarActaPDF('${colab.cedula}')" title="Descargar Acta de Inducción PDF">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml || `<tr><td colspan="28" style="text-align:center; padding: 2rem;">No se encontraron registros de colaboradores.</td></tr>`;

    const summaryEl = document.getElementById('adminStatsSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="stat-badge"><i class="fas fa-users"></i> Total: <strong>${colaboradoresFiltrados.length}</strong></div>
            <div class="stat-badge"><i class="fas fa-sign-in-alt"></i> Han ingresado: <strong>${totalConIngresos}</strong></div>
            <div class="stat-badge stat-green"><i class="fas fa-check-circle"></i> Inducción 100%: <strong>${totalCompletadosGlobal}</strong></div>
        `;
    }
}

function filtrarTablaAdmin() {
    const text = document.getElementById('adminSearchInput').value;
    renderizarTablaAdmin(text);
}

// DESCARGA DE REPORTE COMPLETO EN EXCEL (.XLSX) CON DATOS PERSONALES Y STATUS DE AVANCE
function descargarReporteExcelColaboradores() {
    const rowsReporte = colaboradoresData.map(colab => {
        const stats = calcularEstadisticasAvance(colab.cedula, true);
        const ingresos = getIngresosUsuario(colab.cedula);

        const rowObj = {
            'Cédula': colab.cedula,
            'Nombre Completo': colab.nombre,
            'Cargo': colab.cargo,
            'Área': colab.area,
            'Gerencia': colab.gerencia || 'GERENCIA DE GESTIÓN HUMANA',
            'Cédula Jefe Inmediato': colab.jefe || '',
            'Rol en Plataforma': colab.rol || 'Estudiante',
            'Primer Ingreso': ingresos.primerIngreso,
            'Último Ingreso': ingresos.ultimoIngreso,
            'Cantidad de Ingresos': ingresos.cantidadIngresos,
            'En qué Módulo va': stats.moduloActualTexto,
            'En qué Tema va': stats.temaActualTexto,
            'Módulos Completados': stats.completados,
            'Módulos Habilitados': stats.total,
            'Resumen Módulos': `${stats.completados}/${stats.total}`,
            'Temas Vistos': stats.temasVistos,
            'Temas Habilitados': stats.totalTemas,
            'Resumen Temas': `${stats.temasVistos}/${stats.totalTemas}`,
            '% de Avance': `${stats.porcentaje}%`
        };

        for (let mId = 1; mId <= 14; mId++) {
            const estadoMod = isModuloCompletado(colab.cedula, mId);
            rowObj[`M${mId}`] = estadoMod === null ? 'N/A' : (estadoMod === true ? 'COMPLETADO' : 'PENDIENTE');
        }

        return rowObj;
    });

    const fechaStr = new Date().toISOString().slice(0, 10);

    // Si SheetJS (XLSX) está cargado, exportar archivo .xlsx nativo
    if (window.XLSX) {
        const worksheet = XLSX.utils.json_to_sheet(rowsReporte);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Status Colaboradores');

        // Ajustar ancho de columnas automáticamente
        const headers = Object.keys(rowsReporte[0] || {});
        worksheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));

        XLSX.writeFile(workbook, `Reporte_Status_Induccion_RB_${fechaStr}.xlsx`);
        return;
    }

    // Fallback CSV con BOM UTF-8 compatible con Excel si no hay internet para la librería XLSX
    const headers = Object.keys(rowsReporte[0] || {});
    const csvLines = [
        headers.map(h => `"${h}"`).join(';'),
        ...rowsReporte.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';'))
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Status_Induccion_RB_${fechaStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// GENERACIÓN DE ACTA DE INDUCCIÓN CORPORATIVA EN PDF (CON jsPDF)
function generarActaPDF(cedula) {
    const colab = colaboradoresData.find(c => cleanCedula(c.cedula) === cleanCedula(cedula));
    if (!colab) {
        alert('No se encontraron datos del colaborador.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const stats = calcularEstadisticasAvance(colab.cedula, true);
    const ingresos = getIngresosUsuario(colab.cedula);
    const enabledModulos = getModulosHabilitadosParaCargo(colab.cargo, true);
    const fechaEmision = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFillColor(0, 30, 71);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RECAUDO BOGOTÁ S.A.S.', 15, 15);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('ACTA OFICIAL DE INDUCCIÓN CORPORATIVA', 15, 23);
    doc.text(`Fecha de Emisión: ${fechaEmision}`, 145, 23);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DEL COLABORADOR', 15, 43);

    doc.setDrawColor(0, 136, 204);
    doc.setLineWidth(0.5);
    doc.line(15, 45, 195, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', 15, 53);
    doc.setFont('helvetica', 'normal');
    doc.text(colab.nombre, 45, 53);

    doc.setFont('helvetica', 'bold');
    doc.text('Cédula:', 130, 53);
    doc.setFont('helvetica', 'normal');
    doc.text(colab.cedula, 155, 53);

    doc.setFont('helvetica', 'bold');
    doc.text('Cargo:', 15, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(colab.cargo, 45, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('Área:', 130, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(colab.area, 155, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('Gerencia:', 15, 67);
    doc.setFont('helvetica', 'normal');
    doc.text(colab.gerencia || 'RECAUDO BOGOTÁ S.A.S.', 45, 67);

    doc.setFont('helvetica', 'bold');
    doc.text('Primer Ingreso:', 15, 74);
    doc.setFont('helvetica', 'normal');
    doc.text(ingresos.primerIngreso, 45, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('Último Ingreso:', 130, 74);
    doc.setFont('helvetica', 'normal');
    doc.text(ingresos.ultimoIngreso, 155, 74);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. DECLARACIÓN DE CUMPLIMIENTO', 15, 86);
    doc.line(15, 88, 195, 88);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const declaracionText = `Recaudo Bogotá S.A.S. declara y certifica que el colaborador ha recibido, visualizado y completado satisfactoriamente los contenidos y temas asignados en el programa de Inducción Corporativa, alcanzando un progreso del ${stats.porcentaje}% (${stats.completados}/${stats.total} módulos y ${stats.temasVistos}/${stats.totalTemas} temas habilitados; ${ingresos.cantidadIngresos} ingresos registrados).`;
    const splitText = doc.splitTextToSize(declaracionText, 180);
    doc.text(splitText, 15, 95);

    const tableBody = enabledModulos.map(m => {
        const completado = isModuloCompletado(colab.cedula, m.id);
        const estadoStr = completado ? 'COMPLETADO' : 'PENDIENTE';
        const temasStr = m.subtemas.map(st => st.titulo).join(', ');
        return [m.numero, m.titulo, temasStr, estadoStr];
    });

    doc.autoTable({
        startY: 110,
        head: [['Módulo', 'Título del Módulo', 'Temas Habilitados / Contenidos', 'Estado']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [0, 30, 71], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 50 },
            2: { cellWidth: 85 },
            3: { cellWidth: 25, fontStyle: 'bold' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 3) {
                if (data.cell.raw === 'COMPLETADO') {
                    data.cell.styles.textColor = [39, 174, 96];
                } else {
                    data.cell.styles.textColor = [231, 76, 60];
                }
            }
        }
    });

    const finalY = Math.min(doc.lastAutoTable.finalY + 25, 260);

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.4);

    doc.line(25, finalY, 85, finalY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma y Visto Bueno del Colaborador', 25, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`C.C. ${colab.cedula}`, 25, finalY + 10);
    doc.text(colab.nombre, 25, finalY + 15);

    doc.line(125, finalY, 185, finalY);
    doc.setFont('helvetica', 'bold');
    doc.text('Gestión Humana y HSE', 125, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Recaudo Bogotá S.A.S.', 125, finalY + 10);
    doc.text('Firma Autorizada', 125, finalY + 15);

    doc.save(`Acta_Induccion_RB_${cleanCedula(colab.cedula)}_${colab.nombre.replace(/\s+/g, '_')}.pdf`);
}

// HELPERS AUXILIARES DE INTERFAZ
function mostrarModalAuth() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

function ocultarModalAuth() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function mostrarLoading(state) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = state ? 'flex' : 'none';
}

function actualizarSheetStatus(msg) {
    const el = document.getElementById('sheetStatus');
    if (el) el.innerHTML = msg;
}
