# 💬 URLComments (Deja tu opinión en cualquier lugar)

🌍 [🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇯🇵 日本語](README.ja.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇪🇸 Español](README.es.md)

**URLComments** es una extensión de Chrome que prioriza la privacidad (Privacy-First) y convierte cada URL web normalizada en un espacio de discusión público. Deja y descubre comentarios públicos breves en artículos, blogs, documentación y tiendas online, dondequiera que exista una URL.

---

## 🚀 Inicio Rápido y Modo de Uso (Usage)

### 1. Instalación (Cargar Extensión Descomprimida)
1. Descarga la versión más reciente de **`URLComments-vX.X.X.zip`** desde [GitHub Releases](https://github.com/s4ngwoo/URLComments/releases).
2. Descomprime el archivo ZIP descargado en una carpeta local.
3. Abre Google Chrome y accede a `chrome://extensions`.
4. Activa el **Modo de desarrollador** en la esquina superior derecha.
5. Haz clic en **Cargar descomprimida** (arriba a la izquierda) y selecciona la carpeta descomprimida.
6. Fija el icono de URLComments en la barra de herramientas de tu navegador.

### 2. Cómo Usar la Extensión
1. **Navega por la Web**: Abre cualquier página web (artículo, blog, documentación, tienda online, etc.).
2. **Abre la Extensión**: Haz clic en el icono de URLComments en la barra de herramientas para abrir el panel lateral o popup.
3. **Inicia Sesión**: Pulsa el botón de Google para iniciar sesión rápidamente (solo la primera vez).
4. **Descubre Comentarios**: Lee los comentarios públicos asociados a la URL normalizada actual (`origin + pathname`).
5. **Participa e Interactúa**:
   - Escribe tu opinión (hasta 1.000 caracteres) y haz clic en **Publicar**.
   - Haz clic en `↳ Responder` en cualquier comentario para dejar una respuesta encadenada de 1 nivel.
   - Pulsa 👍 (Me gusta) o 👎 (No me gusta) junto al nombre del autor para reaccionar.
6. **Mis Comentarios y Ajustes**: Usa la barra inferior para consultar tu historial de comentarios o personalizar el tema (Oscuro/Claro), tamaño de fuente e idioma.

---

## 🛡️ Principio de Privacidad

URLComments protege estrictamente tu historial de navegación y tu privacidad:

- **Sin Transmisión de URL al Navegar**: Las URL nunca se envían automáticamente a Supabase ni a ningún servidor externo mientras navegas por la web o cambias de pestaña.
- **Solo por Interacción Explícita del Usuario**: La extensión lee la URL de la pestaña activa y obtiene comentarios específicos de la página únicamente después de que abras explícitamente el panel lateral o la ventana emergente y solicites una actualización.
- **Normalización Estricta de URL**: Los parámetros de consulta (`?query=...`) y los fragmentos hash (`#section`) se excluyen, anclando los comentarios estrictamente a `origin + pathname`. Esto evita la filtración de identificadores de seguimiento (UTM, tokens de sesión, etc.).
- **Cero Vigilancia y Telemetría**: No incluye monitoreo en segundo plano, análisis (Analytics), telemetría, ni ejecución remota de código.

---

## ✨ Características Principales

- **Inicio de sesión con Google**: Autenticación rápida y segura a través de Supabase Auth y Chrome Identity `launchWebAuthFlow`.
- **Comentarios basados en URL Normalizada**: Publica comentarios de hasta 1.000 caracteres vinculados a la URL normalizada (sin consultas ni hashes).
- **Reacciones a Comentarios Compactas (Me gusta/No me gusta)**: Grupo de reacción en línea, compacto y sin saltos de línea, ubicado directamente junto al nombre del autor para ahorrar espacio, asegurando plena accesibilidad por teclado.
- **Edición y Eliminación Suave de Comentarios**: Edita tus propios comentarios o elimínalos de forma lógica (`is_deleted = true`).
- **Respuestas Múltiples de Nivel 1 (1-Depth Multi-Sibling Replies)**:
  - Un comentario principal activo puede recibir múltiples respuestas de nivel hermano.
  - Las respuestas se renderizan debajo de su comentario padre en orden ascendente por fecha de creación (`created_at ASC`).
  - Los comentarios principales activos tienen un botón `↳ Responder`; las respuestas en sí no permiten respuestas adicionales (limitado estrictamente a 1 nivel de profundidad).
- **Paginación en Memoria por Hilos (Threads)**:
  - Los hilos de comentarios principales se paginan en bloques de 10 (`THREADS_PER_PAGE = 10`), manteniendo juntos al comentario padre y todas sus respuestas.
  - El cambio de página renderiza inmediatamente desde la caché en memoria, sin necesidad de nuevas peticiones de red a Supabase.
  - Conserva la posición de lectura al refrescar la página o al escribir una respuesta.
- **Ordenación Cronológica Ascendente Estricta (Chronological ASC)**:
  - Todos los comentarios principales y respuestas se ordenan de forma consistente según el tiempo de creación (`created_at ASC`), utilizando una comparación segura de IDs como desempate en caso de timestamps idénticos. (Las opciones y UI de ordenación antiguas han sido eliminadas por completo).
- **Configuración de Idioma Independiente (Language)**:
  - Soporta Español, Inglés, Coreano, Japonés, Chino Simplificado, Chino Tradicional y el valor predeterminado del sistema.
  - Supera las limitaciones de `chrome.i18n` dependientes del navegador a través de un módulo i18n personalizado, permitiendo anular instantáneamente el idioma dentro de la extensión.
- **Preferencias de Tamaño de Fuente Independientes (Font Size)**:
  - Selecciona entre tamaño Pequeño (Small), Predeterminado (Default) o Grande (Large), que se guarda de forma persistente en `chrome.storage.local` independientemente del tema de color.
  - La interfaz entera se escala naturalmente usando el atributo `data-font-size` y variables CSS en la raíz del documento.
- **Truncado Seguro del Nombre de Usuario (Ellipsis)**:
  - Los nombres largos se truncan visualmente con puntos suspensivos sin afectar los botones de reacción, conservando el nombre completo a través de `title` y `aria-label`.
- **Conservación de Contexto en Comentarios Padre Eliminados**:
  - Si un comentario principal que tiene respuestas activas se elimina, se muestra el marcador "Este comentario fue eliminado" para mantener el contexto de la conversación, mientras que las respuestas existentes siguen siendo visibles.
  - Los comentarios padre eliminados no muestran botón de respuesta, bloqueando nuevas participaciones.
- **Carga Diferida y Anulación de Caché de "Mis Comentarios"**: El historial de comentarios personales solo se carga al hacer clic en la pestaña "Mis Comentarios". La caché se anula automáticamente al crear/editar/eliminar un comentario, reflejando siempre el estado más reciente.
- **Persistencia del Tema**: Soporta valores predeterminados del sistema / Modo Claro / Modo Oscuro, que se guardan de forma persistente en `chrome.storage.local`.
- **Tooltip del Public ID**: Proporciona un Tooltip horizontal seguro al pasar el ratón o hacer foco con el teclado sobre el nombre del autor para revelar su ID público.
- **Área de texto autoajustable (Textarea)**: La altura del área de texto crece de manera suave desde un mínimo de 48px hasta un máximo de 140px dependiendo del contenido.

---

## 🏗️ Arquitectura y Estructura de Directorios

```text
URLComments/
├── manifest.json              # Configuración de extensión Manifest V3
├── background.js              # Service worker para eventos de panel lateral y cambio de pestañas
├── popup/                     # Módulos del frontend para popup y panel lateral
│   ├── popup.html             # Marcado para pestañas de Inicio, Mis Comentarios, Ajustes y Modal de Perfil
│   ├── popup.css              # Variables de tema, diseño y estilos de componentes (Vanilla CSS)
│   ├── popup.js               # Inicialización de ciclo de vida, enrutamiento y delegación de eventos
│   ├── comments.js            # Recuperación de comentarios, agrupación, lógica CRUD, respuestas y tamaño de textarea
│   ├── auth.js                # Verificación de sesión de Google OAuth y controladores de inicio/cierre de sesión
│   ├── my_comments.js         # Vista de Mis Comentarios y manejo de caché
│   ├── settings.js            # Gestión de temas y preferencias de usuario
│   ├── ui.js                  # Transiciones de estado (cargando, vacío, lista) y caché del DOM
│   ├── state.js               # Almacenamiento de estado global reactivo en memoria
│   ├── profile.js             # Gestión de nombres a mostrar y Public ID
│   ├── votes.js               # Controlador de Me gusta/No me gusta
│   └── spa.js                 # Normalización de URL y detección de SPA (Aplicación de Página Única)
├── content/
│   ├── spaDetector.js         # Content script para detectar cambios de ruta en el cliente (SPA)
│   └── config.js              # Configuración para la detección de SPA
├── lib/
│   ├── config.js              # Configuración de URL y Anon Key para Supabase
│   ├── supabaseClient.js      # Wrapper del cliente JS de Supabase y adaptador de almacenamiento para Chrome
│   ├── publicId.js            # Generador de ID público único basado en Base62
│   └── utils.js               # Funciones auxiliares puras
├── utils/
│   └── urlHelper.js           # Utilidad de normalización de URL (elimina query/hash)
├── _locales/                  # Recursos de internacionalización (i18n) para ko, en, ja, zh_CN, zh_TW, es
└── supabase/
    └── migrations/            # Esquema de base de datos, políticas RLS y triggers
        ├── 001_comments_baseline.sql
        ├── 002_profiles_public_identity.sql
        ├── 003_comment_votes.sql
        ├── 004_comment_moderation.sql
        ├── 005_verify_schema.sql
        ├── 006_fix_linter_warnings.sql
        └── 007_one_depth_replies.sql
```

---

## 🔑 Permisos de la Extensión (Permissions Audit)

Todos los permisos definidos en `manifest.json` se adhieren al principio del mínimo privilegio:

| Permiso | Propósito real en el código |
| :--- | :--- |
| `sidePanel` | Configura y abre la interfaz en el panel lateral nativo de Chrome sin interrumpir la navegación. |
| `storage` | Guarda preferencias de tema, estado de autenticación y banderas de detección SPA en `chrome.storage.local`. |
| `identity` | Inicia de forma segura la autenticación OAuth de Google mediante `chrome.identity.launchWebAuthFlow` sin ventanas emergentes del navegador. |
| `tabs` | 1) Escucha cambios de pestaña activa (`chrome.tabs.onActivated/onUpdated`) en `background.js` para notificar al panel lateral si debe sugerir un refresco. 2) Abre URLs desde Mis Comentarios en nuevas pestañas usando `chrome.tabs.create`. |
| `activeTab` | Otorga acceso temporal a la URL de la pestaña actual solo en el momento en que el usuario interactúa con la extensión, sin requerir permisos de host `<all_urls>` amplios. |

---

## 💻 Desarrollo Local y Pruebas

### Prerrequisitos
- Node.js 18+
- Navegador Google Chrome
- Proyecto de Supabase (PostgreSQL + Auth)

### 1. Instalación
```bash
# Clonar repositorio
git clone https://github.com/s4ngwoo/URLComments.git
cd URLComments

# Instalar dependencias
npm install
```

### 2. Configurar Credenciales de Supabase
Copia `lib/config.example.js` a `lib/config.js` y establece tus credenciales del proyecto Supabase:
```javascript
window.APP_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key"
};
```

### 3. Ejecutar Pruebas Unitarias
Ejecuta las pruebas de Jest para verificar las funciones puras, los flujos de estado, el manejo de respuestas de nivel 1 y las estructuras DOM:
```bash
npm test
```

### 4. Cargar Extensión Descomprimida en Chrome
1. Navega a `chrome://extensions/` en Google Chrome.
2. Activa el **Modo de desarrollador** en la esquina superior derecha.
3. Haz clic en **Cargar descomprimida** y selecciona la carpeta raíz `URLComments`.

---

## 🗄️ Migraciones de Supabase

Aplica las migraciones secuencialmente desde el **SQL Editor** en el panel de control de Supabase:

1. `001_comments_baseline.sql`: Esquema base y políticas RLS para la tabla de `comments`.
2. `002_profiles_public_identity.sql`: Perfiles de usuario, nombre visible y generación de Public ID.
3. `003_comment_votes.sql`: Votaciones y triggers de conteo en el lado del servidor.
4. `004_comment_moderation.sql`: Tablas para la moderación y reportes de comentarios.
5. `005_verify_schema.sql`: Vistas y funciones de verificación de la integridad de la base de datos.
6. `006_fix_linter_warnings.sql`: Optimización de rendimiento e índices.
7. `007_one_depth_replies.sql`: Clave foránea `parent_id`, trigger para forzar 1-nivel de profundidad (`check_comment_one_depth()`), y función comprobadora de respuestas activas (`comment_has_active_replies()`).

### 📌 Política de Respuestas y Anidamiento Múltiple Deferido
- **Política Actual**: Se permiten múltiples respuestas a un mismo comentario padre activo. Se evita estrictamente (vía trigger en base de datos) responder a una respuesta (anidamiento de profundidad mayor a 1).
- **Plan a Futuro**: El anidamiento profundo de múltiples niveles se ha pospuesto intencionalmente. Si se decide implementarlo, se requerirá alterar el trigger `007_one_depth_replies.sql` y añadir un componente recursivo de árbol de respuestas.

---

## ⚠️ Limitaciones Conocidas (Known Limitations)

- **Sin Actualizaciones Automáticas en Tiempo Real**: Las suscripciones Realtime (WebSocket) de Supabase se han omitido intencionalmente para salvaguardar la privacidad, reducir el uso de batería y disminuir la carga del servidor. Utiliza el botón de actualización manual (`↻`) para recargar los comentarios.
- **Emparejamiento Estricto por URL**: Los comentarios están vinculados a la URL canónica normalizada (`origin + pathname`). Los sitios web con estados dinámicos internos que compartan la misma URL compartirán consecuentemente el mismo espacio de discusión.

---

## 🧪 Lista de Verificación de Prueba Manual

1. **Verificación de Privacidad**:
   - Abre el panel Network (Red) de las herramientas de desarrollo (F12) y navega por diferentes pestañas.
   - Verifica que no se despache ninguna URL al fondo ni peticiones automáticas.
   - Confirma que las peticiones de red solo se originan al abrir el panel de la extensión y pulsar refrescar.
2. **Respuestas Múltiples de Nivel Hermano**:
   - Publica un comentario principal P.
   - Haz clic en `↳ Responder` y envía la Respuesta A.
   - Haz clic nuevamente en `↳ Responder` en el mismo comentario padre P y envía la Respuesta B.
   - Comprueba que la Respuesta A y B se renderizan en orden ascendente (más antiguas primero) debajo del padre P, sin que las respuestas muestren botón propio de responder.
3. **Eliminación Suave y Conservación del Contexto**:
   - Elimina un comentario padre que contenga respuestas activas.
   - Verifica que el texto cambie a `"Este comentario fue eliminado"` y las respuestas permanezcan intactas.
   - Confirma que no se puede volver a responder a ese comentario.
4. **Verificación de "Mis Comentarios"**:
   - Publica un comentario y ve a la pestaña "Mis Comentarios". Verifica que se muestra correctamente en la lista.
   - Haz clic en el botón "Ver original" y verifica que la URL se abra en una pestaña nueva.
5. **Persistencia de Temas**:
   - Cambia entre modo Sistema, Claro y Oscuro en los ajustes.
   - Cierra y reabre la extensión para comprobar que se mantiene el tema deseado.
6. **Paginación de Hilos y Conservación de la Posición**:
   - En una página con >10 comentarios principales, verifica que la barra de paginación (`< Anterior`, `1 / N`, `Siguiente >`) funciona correctamente sin hacer más peticiones de red.
   - Confirma que al refrescar la página manualmente, te mantienes en la página actual.
7. **Verificación de Fuente y Cabecera Compacta**:
   - Cambia el tamaño de fuente (Pequeño, Normal, Grande). Verifica el cambio inmediato de interfaz y la persistencia al reabrir la extensión.
   - Comprueba que los botones de Me gusta y No me gusta aparecen agrupados justo a la derecha del nombre del usuario y que un usuario con nombre largo se trunca (...) limpiamente sin romper la cabecera.

---

## 🤝 Cómo Contribuir (Contributing)

¡Agradecemos enormemente cualquier contribución, reporte de fallos y sugerencias!

- **Guía de Contribución**: Consulta [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) para conocer la configuración del entorno de desarrollo local, estándares de código y flujo de PRs.
- **Descripción de la Arquitectura**: Lee [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para comprender el diseño del sistema y las garantías de privacidad.
- **Inicio Rápido**:
  ```bash
  npm install              # Instalar dependencias de desarrollo
  npm test                 # Ejecutar la suite de pruebas automáticas (Jest)
  npm test test/locales    # Validar la paridad de claves de traducción en los 6 idiomas
  ```
- **Prioridad a la Privacidad**: Toda contribución debe respetar estrictamente nuestras garantías de privacidad (sin rastreo de pestañas en segundo plano, solicitudes únicamente ante acciones explícitas del usuario y normalización estricta de URLs).
