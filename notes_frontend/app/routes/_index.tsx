import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

/**
 * ---- NOTES API CONFIGURATION ----
 * Adjust the API URL below to point to your notes_database container REST endpoint.
 * The API is expected to provide endpoints:
 *   GET    /notes         -> list notes
 *   POST   /notes         -> create new note (body: {title, body})
 *   PUT    /notes/:id     -> update note (body: {title, body})
 *   DELETE /notes/:id     -> delete note
 *   GET    /notes/:id     -> fetch one note
 */
const NOTES_API_BASE =
  typeof process !== "undefined" && process.env.NOTES_API_BASE
    ? process.env.NOTES_API_BASE
    : "http://localhost:4000";

// ---- Loader fetches all notes and (optionally) a focused note ----
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const noteId = url.searchParams.get("noteId");
  const [notesRes, noteRes] = await Promise.all([
    fetch(`${NOTES_API_BASE}/notes`),
    noteId
      ? fetch(`${NOTES_API_BASE}/notes/${noteId}`)
      : Promise.resolve({ ok: false }),
  ]);
  const notes = notesRes.ok ? await notesRes.json() : [];
  let activeNote = null;
  if (noteRes.ok) {
    activeNote = await noteRes.json();
  }
  return json({ notes, activeNote, selectedId: noteId || null });
}

// ---- Handles create, update, and delete ----
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("_intent");
  const title = formData.get("title")?.toString() ?? "";
  const body = formData.get("body")?.toString() ?? "";
  const id = formData.get("id")?.toString();

  // CREATE
  if (intent === "create") {
    const res = await fetch(`${NOTES_API_BASE}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const newNote = res.ok ? await res.json() : null;
    if (newNote) {
      return redirect(`/?noteId=${encodeURIComponent(newNote.id)}`);
    }
    return json({ error: "Failed to create note." }, { status: 400 });
  }

  // UPDATE
  if (intent === "update" && id) {
    const res = await fetch(`${NOTES_API_BASE}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    if (res.ok) {
      return redirect(`/?noteId=${encodeURIComponent(id)}`);
    }
    return json({ error: "Failed to update note." }, { status: 400 });
  }

  // DELETE
  if (intent === "delete" && id) {
    const res = await fetch(`${NOTES_API_BASE}/notes/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      return redirect("/");
    }
    return json({ error: "Failed to delete note." }, { status: 400 });
  }

  return json({ error: "Invalid request." }, { status: 400 });
}

// ---- UI COMPONENTS ----

function classNames(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Minimalistic, modern, and light themed app.
 * Color palette:
 *   "primary":   #1976d2 (Title, focused, selected)
 *   "secondary": #424242 (Sidebar, divider, text)
 *   "accent":    #fbc02d (Buttons and highlights)
 */
export default function NotesApp() {
  const { notes, activeNote, selectedId } = useLoaderData<{
    notes: Note[];
    activeNote: Note | null;
    selectedId: string | null;
  }>();
  const actionData = useActionData<{ error?: string }>();
  const creationFormRef = useRef<HTMLFormElement | null>(null);
  const [isEditMode, setIsEditMode] = useState(selectedId ? true : false);

  // When selected note changes, leave edit mode (unless just created)
  useEffect(() => {
    setIsEditMode(selectedId ? true : false);
  }, [selectedId]);

  // Auto-focus new note input
  useEffect(() => {
    if (!selectedId)
      creationFormRef.current?.elements.namedItem("title")?.focus();
  }, [selectedId]);

  return (
    <div className="bg-white min-h-screen h-screen flex flex-col font-sans">
      {/* HEADER */}
      <header
        className="flex items-center px-8 py-5 border-b border-gray-200"
        style={{
          background: "#fff",
        }}
      >
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#1976d2", letterSpacing: "-0.5px" }}
        >
          Personal Notes
        </h1>
      </header>
      {/* MAIN */}
      <main className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* SIDEBAR - Note list */}
        <aside
          className="bg-gray-100 border-r border-gray-200 w-72 min-w-0 flex flex-col"
          style={{ color: "#424242" }}
        >
          {/* New note form */}
          <div className="p-4 border-b border-gray-200">
            <Form
              ref={creationFormRef}
              method="post"
              replace
              onSubmit={() => {
                setTimeout(() => {
                  creationFormRef.current?.reset();
                }, 200);
              }}
            >
              <input type="hidden" name="_intent" value="create" />
              <input
                type="text"
                name="title"
                placeholder="New note title..."
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2"
                style={{
                  borderColor: "#1976d2",
                }}
                required
                maxLength={60}
              />
              <button
                type="submit"
                className="mt-3 w-full bg-[#fbc02d] text-[#424242] font-bold py-1 px-2 rounded hover:bg-[#ffe082] transition-all"
              >
                + New Note
              </button>
            </Form>
          </div>
          {/* Notes List */}
          <nav className="flex-1 overflow-y-auto">
            <ul>
              {notes.length === 0 && (
                <li className="p-6 text-gray-400 italic text-center">
                  No notes yet.
                </li>
              )}
              {notes.map((note) => (
                <li key={note.id}>
                  <Link
                    to={`/?noteId=${encodeURIComponent(note.id)}`}
                    prefetch="intent"
                    className={classNames(
                      "block px-4 py-3 border-b border-gray-50 truncate cursor-pointer hover:bg-[#fbc02d]/10 transition",
                      selectedId === note.id
                        ? "bg-[#1976d2]/10 text-[#1976d2] font-semibold"
                        : ""
                    )}
                    aria-current={selectedId === note.id ? "page" : undefined}
                  >
                    {note.title ? note.title : <span className="italic text-gray-400">Untitled</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        {/* DETAIL/EDIT PANE */}
        <section className="flex-1 min-w-0 flex flex-col justify-stretch">
          <div className="flex-1 flex items-stretch min-h-0">
            <div className="flex-1 max-w-2xl mx-auto w-full p-10 sm:p-14 flex flex-col">
              {!selectedId ? (
                <div className="text-center text-gray-400 mt-32">
                  <div className="inline-block p-3 bg-gray-100 rounded-lg mb-6">
                    <span className="text-3xl">📝</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-3">Select or create a note to get started</h2>
                  <p className="text-base text-gray-400">
                    Your notes will appear here.
                  </p>
                </div>
              ) : (
                <NoteDetailPane
                  key={activeNote?.id}
                  note={activeNote}
                  isEdit={isEditMode}
                  onEdit={setIsEditMode}
                  actionError={actionData?.error}
                />
              )}
            </div>
          </div>
          <footer className="text-center p-4 text-xs text-gray-300 border-t border-gray-100">
            &copy; {new Date().getFullYear()} Personal Notes App. All rights reserved.
          </footer>
        </section>
      </main>
    </div>
  );
}

/**
 * Shows and edits a note; allows toggling between edit and read mode, and deleting.
 */
interface Note {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at?: string;
}

function NoteDetailPane({
  note,
  isEdit,
  onEdit,
  actionError,
}: {
  note: Note;
  isEdit: boolean;
  onEdit: (mode: boolean) => void;
  actionError?: string;
}) {
  const [localEdit, setLocalEdit] = useState(isEdit);
  const [title, setTitle] = useState(note?.title || "");
  const [body, setBody] = useState(note?.body || "");
  const editInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setTitle(note?.title || "");
    setBody(note?.body || "");
    setLocalEdit(isEdit);
  }, [note, isEdit]);

  useEffect(() => {
    if (localEdit) editInputRef.current?.focus();
  }, [localEdit]);

  if (!note) {
    return null;
  }
  return (
    <div className="w-full relative">
      <div className="flex items-center mb-4 gap-4">
        {localEdit ? (
          <span className="text-sm text-[#424242] opacity-80 font-semibold">
            Editing Note
          </span>
        ) : (
          <span className="text-sm text-[#1976d2] font-bold">Viewing Note</span>
        )}
        <div className="flex-1" />
        <button
          className={classNames(
            "text-xs px-3 py-1 rounded font-bold",
            "transition-all ml-2",
            localEdit
              ? "bg-gray-100 text-[#1976d2] border border-blue-200 hover:bg-gray-200"
              : "bg-[#fbc02d] text-[#424242] border-none hover:bg-[#ffe082]"
          )}
          type="button"
          onClick={() => onEdit(!localEdit)}
        >
          {localEdit ? "Cancel" : "Edit"}
        </button>
      </div>
      {actionError && (
        <div className="text-red-500 text-sm mb-2">{actionError}</div>
      )}
      <Form
        method="post"
        replace
        onSubmit={ev => {
          if (!window.confirm("Save changes to this note?")) {
            ev.preventDefault();
          }
        }}
        className="flex flex-col gap-6"
        style={localEdit ? undefined : { pointerEvents: "none", opacity: 0.98 }}
      >
        <input type="hidden" name="id" value={note.id} />
        <input type="hidden" name="_intent" value="update" />
        <input
          ref={editInputRef}
          name="title"
          type="text"
          placeholder="Title"
          className={classNames(
            "w-full text-lg font-semibold px-2 py-1 border-b border-gray-200 bg-transparent mb-3",
            localEdit
              ? "focus-within:outline-none focus-within:border-[#1976d2]"
              : ""
          )}
          style={localEdit ? { borderColor: "#1976d2" } : undefined}
          value={title}
          onChange={e => setTitle(e.target.value)}
          readOnly={!localEdit}
          maxLength={60}
          required
        />
        <textarea
          name="body"
          placeholder="Write your note here..."
          rows={12}
          className={classNames(
            "w-full p-2 text-base border rounded resize-vertical",
            localEdit
              ? "bg-white border-gray-300 focus:outline-none focus:border-[#1976d2]"
              : "bg-gray-100 border-gray-100 text-gray-500"
          )}
          style={localEdit ? { borderColor: "#1976d2" } : undefined}
          value={body}
          onChange={e => setBody(e.target.value)}
          readOnly={!localEdit}
        />
        {localEdit && (
          <div className="flex gap-3 mt-2">
            <button
              className="bg-[#1976d2] text-white rounded px-6 py-2 font-bold hover:bg-[#1565c0] transition"
              type="submit"
            >
              Save
            </button>
            <DeleteNoteButton noteId={note.id} />
          </div>
        )}
      </Form>
      {!localEdit && (
        <div className="mt-8">
          <div className="text-xs text-gray-400">
            Created: {new Date(note.created_at).toLocaleString()}
            {note.updated_at && note.updated_at !== note.created_at
              ? ` | Updated: ${new Date(note.updated_at).toLocaleString()}`
              : ""}
          </div>
        </div>
      )}
    </div>
  );
}

/** Separate form for deleting a note */
function DeleteNoteButton({ noteId }: { noteId: string }) {
  return (
    <Form
      method="post"
      replace
      className="inline"
      onSubmit={ev => {
        if (!window.confirm("Are you sure you want to delete this note?")) {
          ev.preventDefault();
        }
      }}
    >
      <input type="hidden" name="_intent" value="delete" />
      <input type="hidden" name="id" value={noteId} />
      <button
        type="submit"
        className="inline-block px-6 py-2 ml-2 rounded font-bold bg-[#fbc02d] text-[#424242] hover:bg-[#ffd54f] border-2 border-[#fbc02d]"
        style={{
          boxShadow: "0 1px 5px rgba(251, 192, 45, 0.07)",
        }}
      >
        Delete
      </button>
    </Form>
  );
}
