import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
} from "../components/AdminLayout";
import { btnPrimaryClass, inputClass } from "../lib/adminUi";

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

const ROLE_LABEL: Record<string, string> = {
  client: "Cliente",
  driver: "Chofer",
  admin: "Admin",
  superadmin: "Superadmin",
};

/** Bandeja de mensajería interna con usuarios de la app. */
export function SupportView() {
  const threads = useQuery(api.support.listThreadsForAdmin);
  const markAdminRead = useMutation(api.support.markAdminRead);
  const sendFromAdmin = useMutation(api.support.sendFromAdmin);
  const [selectedId, setSelectedId] = useState<Id<"supportThreads"> | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const detail = useQuery(
    api.support.listMessagesForAdmin,
    selectedId === null ? "skip" : { threadId: selectedId },
  );
  const lastMessageId = detail?.messages.at(-1)?._id;

  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    void markAdminRead({ threadId: selectedId });
  }, [markAdminRead, selectedId, detail?.messages.length]);

  useEffect(() => {
    const node = transcriptRef.current;
    if (node === null || lastMessageId === undefined) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [lastMessageId]);

  async function handleSend() {
    if (selectedId === null) {
      return;
    }
    const body = draft.trim();
    if (body === "") {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendFromAdmin({ threadId: selectedId, body });
      setDraft("");
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "No se pudo enviar el mensaje.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminPage>
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <AdminCard className="p-0 sm:p-0">
          <div className="border-b border-zinc-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">Conversaciones</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Mensajería a Soporte Técnico desde la app
            </p>
          </div>
          {threads === undefined ? (
            <div className="p-4">
              <AdminLoading message="Cargando hilos…" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-4">
              <AdminEmpty message="Nadie ha escrito todavía." />
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {threads.map((thread) => {
                const active = thread._id === selectedId;
                return (
                  <li key={thread._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(thread._id);
                        setError(null);
                      }}
                      className={`flex w-full flex-col gap-0.5 border-b border-zinc-100 px-4 py-3 text-left transition ${
                        active ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {thread.userName}
                        </span>
                        {thread.unreadForAdmin > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-zinc-900 text-white"
                            }`}
                          >
                            {thread.unreadForAdmin}
                          </span>
                        )}
                      </span>
                      <span
                        className={`truncate text-xs ${
                          active ? "text-white/70" : "text-zinc-500"
                        }`}
                      >
                        {thread.lastMessagePreview || "Sin mensajes"}
                      </span>
                      <span
                        className={`text-[11px] ${
                          active ? "text-white/50" : "text-zinc-400"
                        }`}
                      >
                        {ROLE_LABEL[thread.userRole] ?? thread.userRole}
                        {thread.userEmail !== "" ? ` · ${thread.userEmail}` : ""}
                        {" · "}
                        {formatWhen(thread.lastMessageAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        <AdminCard className="flex min-h-[28rem] flex-col p-0 sm:p-0">
          {selectedId === null ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <p className="text-sm text-zinc-500">
                Elige un hilo para responder.
              </p>
            </div>
          ) : detail === undefined ? (
            <div className="p-6">
              <AdminLoading message="Cargando mensajes…" />
            </div>
          ) : (
            <>
              <div className="border-b border-zinc-100 px-4 py-3">
                <h2 className="truncate text-sm font-semibold text-zinc-900">
                  {detail.thread.userName}
                </h2>
                <p className="truncate text-xs text-zinc-500">
                  {ROLE_LABEL[detail.thread.userRole] ?? detail.thread.userRole}
                  {detail.thread.userEmail !== ""
                    ? ` · ${detail.thread.userEmail}`
                    : ""}
                </p>
              </div>
              <div
                ref={transcriptRef}
                className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {detail.messages.length === 0 ? (
                  <p className="text-sm text-zinc-500">Sin mensajes.</p>
                ) : (
                  detail.messages.map((message) => {
                    const staff = message.authorRole === "staff";
                    return (
                      <div
                        key={message._id}
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                          staff
                            ? "ml-auto bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-800"
                        }`}
                      >
                        <p className="text-[11px] font-medium opacity-70">
                          {staff ? "Operaciones" : "App"}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-5">
                          {message.body}
                        </p>
                        <p className="mt-1 text-[10px] opacity-60">
                          {formatWhen(message.createdAt)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              <form
                className="border-t border-zinc-100 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSend();
                }}
              >
                {error !== null && (
                  <p className="mb-2 text-xs text-red-600">{error}</p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={2}
                    maxLength={1500}
                    placeholder="Responder al usuario…"
                    className={`${inputClass} min-h-[2.75rem] resize-y`}
                  />
                  <button
                    type="submit"
                    disabled={sending || draft.trim() === ""}
                    className={`${btnPrimaryClass} shrink-0`}
                  >
                    {sending ? "Enviando…" : "Enviar"}
                  </button>
                </div>
              </form>
            </>
          )}
        </AdminCard>
      </div>
    </AdminPage>
  );
}
