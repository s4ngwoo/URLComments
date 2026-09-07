# 🛠️ Guía de Ejecución de Migraciones en Supabase

🌍 [English](../SUPABASE_MIGRATION_GUIDE.md) | [한국어](../ko/SUPABASE_MIGRATION_GUIDE.md) | [日本語](../ja/SUPABASE_MIGRATION_GUIDE.md) | [中文](../zh/SUPABASE_MIGRATION_GUIDE.md) | [Español](SUPABASE_MIGRATION_GUIDE.md)

Este documento detalla el procedimiento para aplicar los esquemas de base de datos y las políticas de seguridad RLS en tu proyecto de Supabase.

---

## 1. Seguridad de Claves API

> [!CAUTION]
> En la extensión del cliente (`lib/config.js`), usa únicamente la URL del proyecto y la clave pública **`ANON_KEY`**. La clave **`SERVICE_ROLE_KEY`** anula todas las restricciones de RLS y jamás debe incluirse en la extensión.

---

## 2. Ejecución Secuencial

En el **Editor SQL** del panel de Supabase, ejecuta los archivos de `supabase/migrations/` uno por uno en orden numérico:

1. `001_comments_baseline.sql`: Tablas principales, índices y políticas RLS iniciales.
2. `002_profiles_public_identity.sql`: Tabla `profiles`, validación de ID público y nombres visibles.
3. `003_comment_votes.sql`: Votaciones y disparadores de recuento atómico.
4. `004_comment_moderation.sql`: Tabla de reportes y protección de transiciones de estado.
5. `005_verify_schema.sql`: Consulta de comprobación de esquema (solo lectura).
6. `006_fix_linter_warnings.sql`: Corrección de advertencias de linter en Supabase.
7. `007_one_depth_replies.sql`: Soporte para respuestas de 1 nivel de profundidad (`parent_id`).
