# 🚀 Planes Futuros: Monetización y Sistema de Avatares

🌍 [English](../FUTURE_MONETIZATION_AND_AVATARS.md) | [한국어](../ko/FUTURE_MONETIZATION_AND_AVATARS.md) | [日本語](../ja/FUTURE_MONETIZATION_AND_AVATARS.md) | [中文](../zh/FUTURE_MONETIZATION_AND_AVATARS.md) | [Español](FUTURE_MONETIZATION_AND_AVATARS.md)

Este documento detalla las directrices internas, principios de privacidad y consideraciones de costes respecto al sistema de avatares y la función de auto-refresco en URLComments.

---

## 1. Política sobre Imágenes

- **Subida arbitraria de imágenes**: No disponible
- **Fotos de perfil personalizadas**: No disponible
- **Adjuntos de imágenes en comentarios**: No disponible por el momento
- **Renderizado de URLs externas de imagen**: No disponible
- **Almacenamiento en Base64**: No disponible

### Justificación
- Riesgo de alojamiento de contenido ilícito, ofensivo o con derechos de autor.
- Prevención de balizas web (web beacons) y seguimiento externo.
- Costes significativos de almacenamiento, CDN y moderación manual.

---

## 2. Catálogo de Avatares Pre-verificados

En lugar de permitir subidas libres de imágenes, se plantea ofrecer una colección cerrada de avatares estáticos seleccionados por los administradores:
- En la base de datos solo se guarda la cadena `avatar_id`.
- Los avatares se empaquetan en la extensión o se sirven desde una CDN estática propia.
- Cualquier identificador desconocido utiliza el avatar por defecto.

---

## 3. Motivos de la Retención del Auto-Refresco

URLComments solo obtiene comentarios cuando el usuario abre la extensión o pulsa refrescar (`↻`):
- **Privacidad**: Consultar la URL en segundo plano equivale a registrar el historial de navegación del usuario.
- **Coste**: Genera un volumen innecesario de peticiones en páginas donde no existen comentarios.
- **Filosofía**: Mantiene la experiencia de descubrimiento voluntario tipo "búsqueda del tesoro".
