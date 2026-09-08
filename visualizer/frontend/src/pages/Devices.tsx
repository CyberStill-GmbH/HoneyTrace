import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Copy, KeyRound, Plus, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import type { IngestToken } from "../types";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

export function Devices() {
  const client = useQueryClient();
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [pendingDelete, setPendingDelete] = useState<IngestToken | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const confirmationInput = useRef<HTMLInputElement>(null);
  const tokens = useQuery({ queryKey: ["tokens"], queryFn: api.tokens });
  const create = useMutation({
    mutationFn: api.createToken,
    onSuccess: (token) => {
      setRevealed(token.token ?? null);
      setCopyState("idle");
      setName("");
      void client.invalidateQueries({ queryKey: ["tokens"] });
    },
  });
  const revoke = useMutation({
    mutationFn: api.revokeToken,
    onSuccess: () => {
      setPendingDelete(null);
      setConfirmation("");
      void client.invalidateQueries({ queryKey: ["tokens"] });
    },
  });

  useEffect(() => {
    if (pendingDelete) confirmationInput.current?.focus();
  }, [pendingDelete]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) create.mutate(name.trim());
  };
  const copyToken = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
    }
  };
  const closeDelete = () => {
    if (revoke.isPending) return;
    setPendingDelete(null);
    setConfirmation("");
  };

  return <div className="page">
    <div className="page-heading"><div><h1 className="page-title font-display">Dispositivos</h1><p className="page-subtitle">Tokens para asociar el Engine o una Raspberry Pi con tu cuenta.</p></div></div>
    <section className="card mb-4">
      <div className="section-header"><div><h2 className="section-title">Nuevo token de ingestión</h2><p className="mt-1 text-sm text-[var(--text-tertiary)]">El valor completo se muestra una sola vez.</p></div></div>
      <form className="flex flex-wrap items-end gap-3 p-5" onSubmit={submit}><label className="min-w-64 flex-1 text-sm text-[var(--text-tertiary)]">Nombre del dispositivo<input className="input mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Raspberry laboratorio" maxLength={80} /></label><button className="button-primary" disabled={!name.trim() || create.isPending}><Plus size={16} />Crear token</button></form>
      {revealed && <div className="token-reveal m-5 mt-0"><div className="mb-2 flex items-center gap-2 font-medium"><KeyRound size={16} />Guárdalo ahora</div><div className="flex items-center gap-2"><code className="font-mono min-w-0 flex-1 overflow-x-auto text-sm">{revealed}</code><button className={`copy-token-button button-secondary ${copyState}`} onClick={() => void copyToken()} aria-label={copyState === "copied" ? "Token copiado" : "Copiar token"}>{copyState === "copied" ? <><Check size={16} />Copiada</> : <><Copy size={16} />Copiar</>}</button></div>{copyState === "error" && <p className="copy-error" role="alert">No se pudo copiar. Selecciona el token manualmente.</p>}<span className="sr-only" aria-live="polite">{copyState === "copied" ? "Token copiado al portapapeles" : ""}</span></div>}
    </section>
    <section className="card">
      <div className="section-header"><h2 className="section-title">Tokens configurados</h2></div>
      {tokens.isLoading ? <LoadingState /> : tokens.isError ? <ErrorState retry={() => void tokens.refetch()} /> : !tokens.data?.length ? <EmptyState title="No hay dispositivos" detail="Crea un token para conectar tu primera fuente." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Nombre</th><th>Identificador</th><th>Creado</th><th>Último uso</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{tokens.data.map((token) => <tr key={token.id}><td className="text-[var(--text-primary)]">{token.name}</td><td className="font-mono">••••••••{token.token_hint}</td><td className="font-mono">{formatDate(token.created_at)}</td><td className="font-mono">{token.last_used_at ? formatDate(token.last_used_at) : "Sin uso"}</td><td><button className="button-ghost button-danger min-h-8 min-w-8" onClick={() => { setPendingDelete(token); setConfirmation(""); }} aria-label={`Eliminar ${token.name}`}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>}
    </section>
    {pendingDelete && <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDelete(); }}>
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-token-title" aria-describedby="delete-token-description">
        <div className="confirm-dialog-header"><span className="danger-icon"><AlertTriangle size={20} /></span><div><h2 id="delete-token-title">Eliminar token</h2><p id="delete-token-description">El dispositivo perderá acceso inmediatamente.</p></div><button className="icon-button" onClick={closeDelete} aria-label="Cerrar confirmación"><X size={18} /></button></div>
        <div className="confirm-dialog-body"><p>Para confirmar, escribe <strong>{pendingDelete.name}</strong> exactamente como aparece.</p><label className="confirm-label" htmlFor="token-confirmation">Nombre del token</label><input ref={confirmationInput} id="token-confirmation" className="input font-mono" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /><p className="confirm-hint" aria-live="polite">{confirmation && confirmation !== pendingDelete.name ? "El nombre todavía no coincide." : ""}</p></div>
        <div className="confirm-dialog-actions"><button className="button-secondary" onClick={closeDelete} disabled={revoke.isPending}>Cancelar</button><button className="button-primary destructive" disabled={confirmation !== pendingDelete.name || revoke.isPending} onClick={() => revoke.mutate(pendingDelete.id)}><Trash2 size={16} />{revoke.isPending ? "Eliminando…" : "Eliminar token"}</button></div>
      </section>
    </div>}
  </div>;
}
