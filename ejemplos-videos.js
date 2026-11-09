// =============================================================================
// EJEMPLOS DE CÓMO AGREGAR MÁS VIDEOS AL CARRUSEL 360°
// =============================================================================

// PARA AGREGAR MÁS VIDEOS, USA LA FUNCIÓN agregarVideo() CON ESTA ESTRUCTURA:

// EJEMPLO 1: VIDEO DE YOUTUBE
agregarVideo({
    titulo: "Capacitación de Seguridad - YouTube",
    descripcion: "Procedimientos de evacuación y protocolos de emergencia.",
    categoria: "seguridad",
    tipo: "youtube",
    url: "https://www.youtube.com/embed=RrINKjrQ1bM",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
});

// EJEMPLO 2: VIDEO DE GOOGLE DRIVE
agregarVideo({
    titulo: "Manual de Procedimientos - Drive",
    descripcion: "Guía completa de todos los procesos operativos de la empresa.",
    categoria: "procesos",
    tipo: "drive",
    url: "https://drive.google.com/file/d/1sU3iT5aSnLF3BfeMT_bWWS_-MapX4wXI/preview",
    thumbnail: "assets/video-procesos.jpg"
});

// EJEMPLO 3: VIDEO DE CAPACITACIÓN
agregarVideo({
    titulo: "Capacitación Inicial - YouTube",
    descripcion: "Programa completo de inducción para nuevos empleados.",
    categoria: "capacitacion",
    tipo: "youtube",
    url: "https://www.youtube.com/embed/VIDEO_ID_AQUI",
    thumbnail: "https://img.youtube.com/vi/VIDEO_ID_AQUI/maxresdefault.jpg"
});

// EJEMPLO 4: VIDEO DE TECNOLOGÍA
agregarVideo({
    titulo: "Sistemas de la Empresa - Drive",
    descripcion: "Introducción a las herramientas tecnológicas que usamos.",
    categoria: "tecnologia",
    tipo: "drive",
    url: "https://drive.google.com/file/d/TU_ID_DE_DRIVE/preview",
    thumbnail: "assets/video-tecnologia.jpg"
});

// EJEMPLO 5: VIDEO DE OPERACIÓN
agregarVideo({
    titulo: "Procesos Operativos - YouTube",
    descripcion: "Cómo ejecutar eficientemente las tareas diarias.",
    categoria: "operacion",
    tipo: "youtube",
    url: "https://www.youtube.com/embed/OTRO_VIDEO_ID",
    thumbnail: "https://img.youtube.com/vi/OTRO_VIDEO_ID/maxresdefault.jpg"
});

// EJEMPLO 6: VIDEO DE BIENVENIDA
agregarVideo({
    titulo: "Bienvenida al Equipo - Drive",
    descripcion: "Mensaje de bienvenida del CEO y presentación de la empresa.",
    categoria: "bienvenida",
    tipo: "drive",
    url: "https://drive.google.com/file/d/OTRO_ID_DE_DRIVE/preview",
    thumbnail: "assets/video-bienvenida-alternativo.jpg"
});

// =============================================================================
// INSTRUCCIONES PARA OBTENER URLS DE TUS VIDEOS
// =============================================================================

/*

PASO 1: PARA VIDEOS DE YOUTUBE
- Ve a YouTube y busca tu video
- Copia la parte del URL después de "v=" 
- Ejemplo: si el URL es https://www.youtube.com/watch?v=ABC123DEF456
- El ID es: ABC123DEF456
- El URL para embed es: https://www.youtube.com/embed/ABC123DEF456
- La miniatura es: https://img.youtube.com/vi/ABC123DEF456/maxresdefault.jpg

PASO 2: PARA VIDEOS DE GOOGLE DRIVE
- Sube tu video a Google Drive
- Haz clic derecho en el video → "Obtener enlace"
- Copia el ID del enlace (la parte entre /d/ y /view)
- Ejemplo: https://drive.google.com/file/d/1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX9/view
- El ID es: 1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX9
- El URL para embed es: https://drive.google.com/file/d/1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX9/preview
- La miniatura debe ser una imagen que subas a la carpeta assets/

PASO 3: PARA MINIATURAS PERSONALIZADAS
- Crea o busca imágenes para tus miniaturas
- Guárdalas en la carpeta assets/ con nombres descriptivos
- Ejemplos de nombres:
  - assets/capacitacion-seguridad.jpg
  - assets/procesos-operativos.jpg
  - assets/tecnologia-sistemas.jpg
  - assets/operacion-diaria.jpg

PASO 4: CATEGORÍAS DISPONIBLES
- bienvenida: Videos de introducción y bienvenida
- seguridad: Protocolos y procedimientos de seguridad
- procesos: Flujos de trabajo y procedimientos
- capacitacion: Videos de formación y entrenamiento
- tecnologia: Herramientas y sistemas tecnológicos
- operacion: Procesos operativos diarios

*/

// =============================================================================
// CÓDIGO PARA AGREGAR TODOS LOS EJEMPLOS A LA VEZ
// =============================================================================

/*

// Descomenta este código para agregar todos los ejemplos de una vez:

setTimeout(() => {
    console.log('🚀 Agregando videos de ejemplo al carrusel 360°...');
    
    agregarVideo({
        titulo: "Capacitación de Seguridad - YouTube",
        descripcion: "Procedimientos de evacuación y protocolos de emergencia.",
        categoria: "seguridad",
        tipo: "youtube",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    });
    
    agregarVideo({
        titulo: "Manual de Procedimientos - Drive",
        descripcion: "Guía completa de todos los procesos operativos de la empresa.",
        categoria: "procesos",
        tipo: "drive",
        url: "https://drive.google.com/file/d/1sU3iT5aSnLF3BfeMT_bWWS_-MapX4wXI/preview",
        thumbnail: "assets/video-procesos.jpg"
    });
    
    agregarVideo({
        titulo: "Sistemas de la Empresa - Drive",
        descripcion: "Introducción a las herramientas tecnológicas que usamos.",
        categoria: "tecnologia",
        tipo: "drive",
        url: "https://drive.google.com/file/d/1sU3iT5aSnLF3BfeMT_bWWS_-MapX4wXI/preview",
        thumbnail: "assets/video-tecnologia.jpg"
    });
    
    agregarVideo({
        titulo: "Procesos Operativos - YouTube",
        descripcion: "Cómo ejecutar eficientemente las tareas diarias.",
        categoria: "operacion",
        tipo: "youtube",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    });
    
    console.log('✅ Videos de ejemplo agregados al carrusel 360°');
}, 3000);

*/