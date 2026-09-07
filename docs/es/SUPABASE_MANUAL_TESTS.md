# 🧪 Guía de Verificación Manual de Supabase y RLS

🌍 [English](../SUPABASE_MANUAL_TESTS.md) | [한국어](../ko/SUPABASE_MANUAL_TESTS.md) | [日本語](../ja/SUPABASE_MANUAL_TESTS.md) | [中文](../zh/SUPABASE_MANUAL_TESTS.md) | [Español](SUPABASE_MANUAL_TESTS.md)

Este documento detalla la lista de comprobación de extremo a extremo para validar los disparadores de base de datos y las políticas de seguridad RLS en entornos reales.

---

## 1. Principio Fundamental de Verificación

> [!CAUTION]
> **El Editor SQL de Supabase no valida RLS por completo.**
> Las consultas en el Editor SQL se ejecutan como superusuario (`BYPASSRLS`). Una comprobación rigurosa debe realizarse mediante la interfaz de la extensión con dos cuentas reales de Google (Usuario A y Usuario B).

---

## 2. Casos de Prueba Principales

| N.º | Escenario | Cuenta | Resultado Esperado |
|---|---|---|---|
| **1** | **Perfil e ID Público** | Usuario A | Al iniciar sesión por primera vez se genera un ID `@...` y un nombre visible. |
| **2** | **Crear Comentario** | Usuario A | El comentario se guarda con `is_deleted = false` y aparece en la lista. |
| **3** | **Editar Comentario Propio** | Usuario A | La edición muestra la etiqueta `(editado)` y persiste en la base de datos. |
| **4** | **Bloqueo de Edición/Borrado Ajeno** | Usuario B | No se muestran controles de edición ni borrado en comentarios del Usuario A. |
| **5** | **Respuestas de 1 Nivel** | Usuario B | Se pueden enviar respuestas con `↳ Responder` a comentarios principales. |
| **6** | **Sin Respuestas Anidadas** | Usuario A | Las respuestas no tienen botón de responder (máximo 1 nivel de profundidad). |
| **7** | **Reportar Comentario** | Usuario B | El reporte se registra en `reported_comments`; no se admiten duplicados. |
| **8** | **Borrado Lógico y Contexto** | Usuario A | Al borrar un comentario padre, las respuestas se mantienen para preservar el contexto. |
