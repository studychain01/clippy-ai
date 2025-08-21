/**
 * MESSAGE STATE + PERSISTENCE
 * - Holds messages[] and actions: addMessage, clear, hydrate
 * - Persists to localStorage under key 'clippy.messages.v1'
 * - Hydrates on app start
 *
 * Message shape:
 *   { id: string, role: 'user'|'assistant', content: string, ts: number }
 */
