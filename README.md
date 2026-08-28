# OB-AutoPost Client Demo (Next.js + Vercel)

Aplicación cliente de demostración desarrollada en **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** y componentes **shadcn/ui**, diseñada para demostrar cómo cualquier plataforma SaaS puede utilizar **OB-AutoPost** como **pasarela (gateway) de autenticación OAuth multired y publicación automatizada**.

---

## ✨ Características Principales

- 🔗 **Hub de Pasarela OAuth**: Conexión de cuentas en 1 clic para **Facebook Pages**, **Instagram Business**, **TikTok Direct Posting** y **LinkedIn** mediante ventanas emergentes (popups) y escucha de eventos `postMessage` en tiempo real.
- 👥 **Gestor de Cuentas Conectadas**: Visualización de perfiles activos, avatares, identificadores de plataforma y desvinculación segura.
- 🚀 **Compositor de Publicaciones**: Subida directa de multimedia a la pasarela (o enlaces externos), contador de caracteres, selector de hashtags y soporte para publicación inmediata o programada.
- 📊 **Monitor de Trabajos**: Seguimiento reactivo del estado de los posts (`PENDING` &rarr; `PROCESSING` &rarr; `PUBLISHED` / `FAILED`) con auto-polling.
- 🛠️ **Inspector de Tráfico API (Live Logs)**: Consola en vivo que audita las llamadas HTTP REST, headers `X-API-Key`, payloads JSON y duración de cada petición con copiado de comandos `cURL`.
- ⚙️ **Selector Dinámico de Pasarela**: Permite ajustar la URL de la pasarela y las credenciales desde la interfaz para probar tanto en local como en producción.

---

## 🚀 Despliegue en Vercel (Paso a Paso)

### Opción 1: Despliegue desde Vercel Dashboard (Recomendado)

1. Ve a [Vercel Dashboard](https://vercel.com/new).
2. Conecta tu repositorio de GitHub `ob_autopost-main`.
3. En la sección **Root Directory**, selecciona la carpeta `client-demo`.
4. En **Environment Variables**, añade:
   - `NEXT_PUBLIC_OB_GATEWAY_URL`: La URL pública de tu backend de OB-AutoPost (ej: `https://autopost.otherbrain.tech`).
   - `OB_API_KEY`: Tu API Key del Tenant registrado (ej: `dev_api_key_123`).
   - `OB_TENANT_ID`: Tu Tenant UUID (ej: `11111111-2222-3333-4444-555555555555`).
   - `NEXT_PUBLIC_DEFAULT_CLIENT_USER_ID`: Un ID de usuario por defecto (ej: `demo_client_user`).
5. Haz clic en **Deploy**. ¡Tu aplicación cliente estará lista en segundos en un dominio `*.vercel.app`!

---

## 🛠️ Ejecución Local

1. Entra al directorio del cliente:
   ```bash
   cd client-demo
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Asegúrate de tener el archivo `.env.local` configurado:
   ```env
   NEXT_PUBLIC_OB_GATEWAY_URL=http://localhost:8087
   OB_API_KEY=dev_api_key_123
   OB_TENANT_ID=11111111-2222-3333-4444-555555555555
   NEXT_PUBLIC_DEFAULT_CLIENT_USER_ID=demo_client_user
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📚 Documentación Técnica Adicional

- [Guía Completa de Integración de Pasarela (Docs)](../docs/GATEWAY_INTEGRATION_GUIDE.md)
- [Arquitectura del Servidor Backend Go](../README.md)
