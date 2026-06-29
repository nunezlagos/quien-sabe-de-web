# OpenSpec — quien-sabe-de-web

Contrato de requerimientos del proyecto. Cada REQ vive en `changes/REQ-XX-slug/`
con un `req.md` (definición) y `state.yaml` (status/created/archived).

## Estructura

```
openspec/
├── README.md                       ← este archivo
├── changes/
│   ├── INDEX.md                    ← índice maestro de REQs y dependencias
│   ├── REQ-01-autenticacion-sesiones/
│   │   ├── req.md
│   │   ├── state.yaml
│   │   └── hus/                    ← se crea cuando arranca la primera HU
│   │       └── HU-XX.Y-slug/
│   │           ├── hu.md
│   │           ├── proposal.md
│   │           ├── design.md
│   │           ├── tasks.md
│   │           └── state.yaml
│   └── REQ-XX-slug/ ...
└── archive/                        ← REQs archivados
```

## Flujo

1. **Crear un REQ:** ya scaffoldeado (18 REQs cubren la plataforma).
2. **Iniciar HU:** ejecutar `opsx_propose` con `HU-XX.Y-slug` (genera el árbol bajo `hus/`).
3. **Archivar HU:** `opsx_archive HU-XX.Y-slug` cuando todos los tests del HU estén verdes y el código fusionado.
4. **Archivar REQ:** `opsx_archive_req REQ-XX-slug` cuando todas sus HUs estén archivadas.

## Convenciones

- **REQ slug:** `REQ-NN-<kebab-corto>` (NN con dos dígitos).
- **HU slug:** `HU-NN.M-<kebab-corto>` (NN coincide con el REQ padre; M secuencial).
- **Rama por HU:** `feat|fix/HU-NN.M-<slug>` desde `main`. 1 HU = 1 rama = 1 PR.
- **Tests obligatorios por HU:**
  - **Unit (Vitest):** lógica pura (validadores Zod, funciones de dominio, parsers).
  - **Integración (Vitest + @cloudflare/vitest-pool-workers):** contratos de endpoints contra D1/R2/KV mockeados.
  - **E2E (Playwright):** flujo de usuario por navegador.
- **Sabotaje:** después de Green, romper el fix, confirmar que tests caen, restaurar. Documentar en memoria.

## Vinculación con objetivos

Cada REQ declara con qué objetivo estratégico se enlaza (OE1/OE2/OE3 de
`docs/avance-1/03-fundamentacion-del-proyecto.md` §3.3):

- **OE1** (mes 4): registro + verificación + perfil con p95 < 500 ms.
- **OE2** (mes 6): buscador geográfico con 100 % precisión en tests de aceptación.
- **OE3** (mes 12): donaciones cubren ≥ 80 % de costos operativos.

## Nota sobre MCP-opsx

El MCP-opsx global está configurado para otro proyecto (`OPSX_PROJECT=ace-did-2025`).
Para que `opsx_*` funcione sobre este repo, crear `.mcp.json` en la raíz con:

```json
{
  "mcpServers": {
    "opsx": {
      "command": "node",
      "args": ["/home/nunezlagos/Proyectos/mcp-opsx/server.js"],
      "env": { "OPSX_PROJECT": "/home/nunezlagos/Proyectos/quien-sabe-de-web" }
    }
  }
}
```

Y reiniciar Claude Code.
