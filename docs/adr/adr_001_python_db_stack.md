# ADR 001: Selección del Stack de Base de Datos y ORM en Python

## Estado
Aceptado

## Contexto
El proyecto HoneyTrace requiere un servicio de backend (Honeypot) robusto que sea capaz de manejar entidades relacionales complejas como usuarios, órdenes, productos, notas y archivos. Para lograr esto, se necesita elegir un motor de base de datos, un ORM y una herramienta de control de versiones de esquema que sean modernos, escalables y seguros, en conjunto con Docker y WSL.

## Decisión
Se ha decidido implementar el siguiente stack tecnológico para la capa de persistencia en Python:
- **Base de Datos**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0
- **Migraciones**: Alembic
- **Driver**: psycopg (v3)
- **Despliegue**: Docker Compose

## Consecuencias

### Positivas
- **Tipado Fuerte**: SQLAlchemy 2.0 introdujo una sintaxis mejorada con `Mapped` y `mapped_column`, lo que permite un control de tipos más estricto y excelente integración con Pydantic y FastAPI.
- **Rendimiento y Escalabilidad**: PostgreSQL es una base de datos relacional altamente confiable, y el driver `psycopg` (v3) proporciona soporte de alto rendimiento.
- **Trazabilidad**: Alembic proporciona un control de versiones robusto sobre los cambios de la base de datos, asegurando que los esquemas puedan recrearse en diferentes entornos.
- **Portabilidad**: Docker y Docker Compose encapsulan la base de datos y la aplicación, lo que facilita levantar el entorno completo.

### Negativas
- **Curva de Aprendizaje**: SQLAlchemy 2.0 y el estilo de mapeo declarativo estricto puede presentar una curva de aprendizaje inicial.
- **Sensibilidad a codificación en WSL/Docker**: Se descubrió que la codificación de archivos, como `requirements.txt` guardado en formato UTF-16, genera errores silenciosos en la construcción de los contenedores Docker bajo WSL en Windows, dificultando el levantamiento inicial (este problema ha sido resuelto estableciendo formato UTF-8).

## Notas de Implementación
- Se corrigieron múltiples inconsistencias en las relaciones ORM bidireccionales (`back_populates`) para asegurar una correcta construcción del grafo por SQLAlchemy.
- El archivo `requirements.txt` fue recodificado a `UTF-8` para corregir la incompatibilidad de instalación mediante `pip` dentro del contenedor Linux.
- El 19 de agosto de 2026 se verificó el esquema contra los modelos mediante `alembic check`, sin operaciones pendientes.
- Esta decisión complementa los ADR numerados de `docs/adr/`; debe incorporarse a su índice o renumerarse para evitar dos documentos identificados como ADR 001.
