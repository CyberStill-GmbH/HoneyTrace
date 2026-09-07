# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El usuario principal presenta HoneyTrace en una demostración académica. Durante la demostración necesita recorrer evidencia técnica con claridad y explicar cómo los eventos individuales forman una reconstrucción causal.

## Product Purpose

HoneyTrace captura, normaliza, correlaciona y reconstruye ataques observados por honeypots. La interfaz existe para investigar profundamente una reconstrucción causal y comunicar sus evidencias, secuencia, técnicas y nivel de confianza sin trasladar lógica investigativa al frontend.

## Positioning

La interfaz no se limita a enumerar alertas: expone la cadena causal producida por el Engine como grafo, timeline y evidencia verificable vinculada al evento original.

## Operating Context

Se utiliza localmente durante una demostración académica. El recorrido principal parte de los análisis disponibles, abre una reconstrucción y navega entre sus eventos, relaciones causales y evidencias. El dashboard sirve como punto de situación; Dispositivos configura tokens de ingestión y Configuración documenta el entorno activo.

## Capabilities and Constraints

- React, TypeScript, Vite y Tailwind CSS.
- API Express privada por cuenta con PostgreSQL y Prisma ORM.
- Autenticación mediante GitHub OAuth.
- Dashboard, historial con filtros server-side, Attack Explorer 3D, timeline, evidencias, exportación y gestión de tokens de ingestión.
- Los datos visibles deben proceder de la API; el frontend no correlaciona ni reconstruye ataques.
- Ejecución exclusivamente local; no se requiere despliegue público.
- Deben conservarse las cuatro áreas principales: Dashboard, Análisis, Dispositivos y Configuración.

## Brand Commitments

- Nombre HoneyTrace.
- Logo oficial en `visualizer/frontend/public/honeytrace-logo.svg`.
- Paleta oscura y violeta especificada por el usuario y documentada en los lineamientos entregados.
- Voz técnica, precisa y sobria; la severidad nunca se comunica únicamente mediante color.

## Evidence on Hand

- Contratos, fixtures y pruebas del pipeline dentro del repositorio.
- API funcional y privada en `visualizer/backend`.
- Logo oficial proporcionado por el usuario.
- Lineamientos de componentes, grafo 3D, principios UX y tokens proporcionados por el usuario durante la implementación.
- No existen testimonios, clientes, métricas comerciales ni benchmarks que deban presentarse como evidencia.

## Product Principles

- La causalidad y la evidencia tienen prioridad sobre métricas decorativas.
- Cada dato mostrado debe poder rastrearse hasta la API o el Engine.
- La demostración debe ser legible sin simplificar en exceso el contenido técnico.
- La interfaz debe favorecer una explicación fluida desde la visión general hasta el evento individual.
- La privacidad por cuenta y el funcionamiento local deben preservarse.

## Accessibility & Inclusion

La interfaz debe funcionar con teclado, mantener foco visible, respetar reducción de movimiento, ofrecer contraste suficiente y acompañar toda codificación cromática con texto legible.
