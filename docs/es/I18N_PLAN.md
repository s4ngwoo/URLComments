# 🌐 Arquitectura del Plan de Internacionalización (i18n)

🌍 [English](../I18N_PLAN.md) | [한국어](../ko/I18N_PLAN.md) | [日本語](../ja/I18N_PLAN.md) | [中文](../zh/I18N_PLAN.md) | [Español](I18N_PLAN.md)

Este documento detalla los mecanismos de resolución de idiomas, la jerarquía de reserva y el plan de soporte multilingüe en URLComments.

---

## 1. Detección y Reserva de Idiomas

- La interfaz utiliza `chrome.i18n.getMessage` y atributos HTML (`data-i18n`) para cargar textos desde `_locales/<locale>/messages.json`.
- En `manifest.json`, `"default_locale": "en"` sirve como idioma base ante claves faltantes.
- En la pestaña de Ajustes, el usuario puede seleccionar explícitamente el idioma de la interfaz.

---

## 2. Idiomas Soportados

- 🇺🇸 Inglés (`en`)
- 🇰🇷 Coreano (`ko`)
- 🇯🇵 Japonés (`ja`)
- 🇨🇳 Chino Simplificado (`zh_CN`)
- 🇹🇼 Chino Tradicional (`zh_TW`)
- 🇪🇸 Español (`es`)

---

## 3. Pruebas Automatizadas de Paridad

Para evitar claves faltantes, la suite de pruebas de Jest comprueba la paridad total de claves en CI:

```bash
npm test test/locales.test.js
```
