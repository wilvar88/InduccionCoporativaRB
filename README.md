# 🎬 Galería de Videos Corporativa - Inducción RB

Una aplicación web moderna y elegante para mostrar videos de inducción corporativa con efecto carrusel 360°, diseño glassmorphism y totalmente personalizable.

## 🚀 Características Principales

✨ **Diseño Glassmorphism**: Efecto de vidrio transparente moderno y elegante  
🎯 **Carrusel 360°**: Los videos rotan automáticamente cada 5 segundos  
📱 **Totalmente Responsivo**: Adaptable a todos los dispositivos  
🎨 **Personalizable**: Colores, imágenes y transparencia totalmente configurables  
🌊 **Efecto Ola de Mar**: Los botones de categorías tienen animación fluida  
🔍 **Búsqueda en Tiempo Real**: Encuentra videos rápidamente  
🔗 **Botón Plataforma Externa**: Enlace personalizable a otras plataformas  
⌨️ **Controles de Teclado**: Usa las flechas para navegar  

## 📋 Personalización Rápida

### 🎨 Colores Personalizables
```css
:root {
    --color-primario: #2c3e50;        /* Azul oscuro corporativo */
    --color-secundario: #3498db;     /* Azul brillante */
    --color-terciario: #e74c3c;      /* Rojo para acentos */
    --transparencia-fondo: 0.75;      /* 0 = transparente, 1 = opaco */
    --blur-vidrio: 20px;              /* Desenfoque del efecto vidrio */
}
```

### 🖼️ Imagen de Fondo
```css
--imagen-fondo: url('TU_URL_DE_IMAGEN_AQUI');
```

### 🔤 Textos Personalizables
```html
<h1 class="titulo">Inducción Corporativa RB</h1>
<!-- Cambia el texto por el nombre de tu empresa -->
```

## 🎬 Agregar Videos Nuevos

### YouTube
```javascript
agregarVideo({
    titulo: "Tu Título",
    descripcion: "Tu descripción",
    categoria: "bienvenida",
    tipo: "youtube",
    url: "https://www.youtube.com/embed/VIDEO_ID",
    thumbnail: "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
});
```

### Google Drive
```javascript
agregarVideo({
    titulo: "Tu Título",
    descripcion: "Tu descripción",
    categoria: "seguridad",
    tipo: "drive",
    url: "https://drive.google.com/file/d/ID_DEL_ARCHIVO/preview",
    thumbnail: "assets/tu-imagen.jpg"
});
```

## 📁 Estructura de Archivos

```
📁 Proyecto/
├── 📄 index.html              # Página principal
├── 📄 style.css               # Estilos y personalización
├── 📄 script.js               # Lógica del carrusel 360°
├── 📄 ejemplos-videos.js       # Ejemplos para agregar videos
├── 📁 assets/                 # Imágenes y recursos
│   ├── 🖼️ logo.png              # Logo de la empresa
│   ├── 🖼️ video-bienvenida.jpg # Miniaturas de videos
│   ├── 🖼️ video-seguridad.jpg
│   └── 🖼️ video-procesos.jpg
└── 📄 README.md               # Este archivo
```

## 🎯 Categorías Disponibles

- `bienvenida`: Videos de introducción y bienvenida
- `seguridad`: Protocolos y procedimientos de seguridad  
- `procesos`: Flujos de trabajo y procedimientos
- `capacitacion`: Videos de formación y entrenamiento
- `tecnologia`: Herramientas y sistemas tecnológicos
- `operacion`: Procesos operativos diarios

## 🕹️ Controles del Carrusel 360°

- **Rotación Automática**: Cada 5 segundos
- **Controles Manuales**: Botones de anterior/siguiente
- **Indicadores**: Puntos inferiores para navegación directa
- **Teclado**: Flechas izquierda/derecha para navegar
- **Play/Pausa**: Botón para controlar la rotación automática

## 🌊 Efecto Ola de Mar

Los botones de categorías tienen un efecto especial que simula una ola:
- Se elevan y se balancean al pasar el mouse
- Animación fluida con múltiples puntos de control
- Efecto de temblor sutil para simular movimiento de agua

## 🎨 Transparencia y Efecto Vidrio

Puedes ajustar la transparencia de diferentes elementos:
```css
--transparencia-fondo: 0.75;      /* Fondo general */
--transparencia-botones: 0.85;    /* Botones específicamente */
--blur-vidrio: 20px;              /* Desenfoque del efecto */
```

## 📱 Responsive Design

- **Desktop**: Layout de 3 columnas (categorías | videos | controles)
- **Tablet**: 2 columnas (oculta controles laterales)
- **Móvil**: 1 columna con carrusel horizontal de categorías

## ⌨️ Atajos de Teclado

- `ESC`: Cerrar video modal
- `← →`: Navegar entre videos del carrusel
- `Enter`: Abrir URL externa (cuando el campo está activo)

## 🔧 Solución de Problemas

### Los videos no se reproducen
1. Verifica que los videos de Google Drive tengan permisos públicos
2. Asegúrate de usar el formato correcto: `/preview` para Drive, `/embed` para YouTube
3. Comprueba que el formato de video sea compatible (MP4 recomendado)

### El carrusel no rota automáticamente
1. Verifica que hay más de 1 video en la categoría
2. Asegúrate de que el botón de play/pausa esté en modo play
3. Revisa la consola del navegador (F12) para errores

### Las imágenes no cargan
1. Verifica que las imágenes estén en la carpeta `assets/`
2. Asegúrate de que los nombres de archivo coincidan exactamente
3. Comprueba que las imágenes no sean demasiado grandes (< 500KB)

## 🚀 Próximas Mejoras Sugeridas

1. **Miniaturas Dinámicas**: Generar automáticamente miniaturas de videos
2. **Favoritos**: Permitir marcar videos como favoritos
3. **Historial**: Guardar videos vistos recientemente
4. **Compartir**: Botones para compartir videos en redes sociales
5. **Descargas**: Opción para descargar videos
6. **Subtítulos**: Soporte para subtítulos en videos
7. **Velocidad de Reproducción**: Control de velocidad en videos
8. **Modo Oscuro**: Alternar entre modo claro y oscuro

## 📞 Soporte

Para cualquier duda o problema:
1. Revisa la consola del navegador (F12) para mensajes de error
2. Verifica que todos los archivos estén en sus carpetas correctas
3. Asegúrate de que los videos tengan permisos públicos
4. Prueba en diferentes navegadores (Chrome, Firefox, Safari)

---

**¡Disfruta tu nueva galería de videos corporativa! 🎬✨**