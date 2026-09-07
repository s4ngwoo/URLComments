# 🤝 Guía de Contribución para URLComments

🌍 [English](../CONTRIBUTING.md) | [한국어](../ko/CONTRIBUTING.md) | [日本語](../ja/CONTRIBUTING.md) | [中文](../zh/CONTRIBUTING.md) | [Español](CONTRIBUTING.md)

¡Muchas gracias por tu interés en colaborar con **URLComments**! Esta guía te ayudará a configurar tu entorno local, ejecutar pruebas y preparar tus Pull Requests.

---

## 📋 Requisitos Previos

- **Node.js**: v18.x o superior
- **npm**: v9.x o superior
- **Google Chrome** (o cualquier navegador basado en Chromium con Manifest V3)
- Una cuenta de **Supabase** para pruebas

---

## 🚀 Puesta en Marcha

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/URLComments.git
cd URLComments
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Credenciales de Supabase
Crea el archivo `lib/config.js` (ignorado por `.gitignore` para proteger tus claves):

```javascript
// lib/config.js
export const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
export const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';
```

> [!CAUTION]
> **No uses jamás la `SERVICE_ROLE_KEY`.** La extensión del cliente debe utilizar únicamente la clave pública `ANON_KEY`.

### 4. Cargar la Extensión en Chrome
1. Abre `chrome://extensions` en Google Chrome.
2. Activa el **Modo de desarrollador** arriba a la derecha.
3. Haz clic en **Cargar descomprimida** y selecciona el directorio raíz de `URLComments`.

---

## 🧪 Ejecutar Pruebas

Ejecutamos pruebas automatizadas utilizando Jest:

```bash
# Ejecutar todas las pruebas
npm test

# Validar paridad de claves en todos los idiomas
npm test test/locales.test.js
```

---

## 🛡️ Principios de Desarrollo

1. **Privacidad como Máxima Prioridad**: Cero rastreo en segundo plano. Las peticiones a la red se producen únicamente cuando el usuario abre la extensión o refresca.
2. **Vanilla JS Modular**: Código limpio, rápido y sin dependencias pesadas de frameworks externos.
3. **Comparaciones BigInt Seguras**: Los IDs de Supabase deben compararse siempre mediante `String(a) === String(b)`.
4. **Orden Cronológico Invariable**: Hilos y respuestas se muestran siempre en orden ascendente de fecha de creación (`created_at ASC`).
