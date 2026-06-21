package com.tasknexus.data

import com.tasknexus.data.entity.BudgetTx
import com.tasknexus.data.entity.Note
import com.tasknexus.data.entity.QuickLink
import com.tasknexus.data.entity.Reminder
import com.tasknexus.data.entity.Todo
import kotlinx.coroutines.flow.Flow

class AppRepository(private val db: AppDatabase) {

    // ── Flows ────────────────────────────────────────────────────────────────

    val notes: Flow<List<Note>> = db.noteDao().getAllNotes()
    val todos: Flow<List<Todo>> = db.todoDao().getAllTodos()
    val reminders: Flow<List<Reminder>> = db.reminderDao().getAllReminders()
    val transactions: Flow<List<BudgetTx>> = db.budgetDao().getAllTransactions()
    val quickLinks: Flow<List<QuickLink>> = db.quickLinkDao().getAllLinks()

    // ── Notes ────────────────────────────────────────────────────────────────

    suspend fun insertNote(note: Note) = db.noteDao().insertNote(note)
    suspend fun updateNote(note: Note) = db.noteDao().updateNote(note)
    suspend fun deleteNote(id: String) = db.noteDao().deleteNote(id)

    // ── Todos ────────────────────────────────────────────────────────────────

    suspend fun insertTodo(todo: Todo) = db.todoDao().insertTodo(todo)
    suspend fun updateTodo(todo: Todo) = db.todoDao().updateTodo(todo)
    suspend fun deleteTodo(id: String) = db.todoDao().deleteTodo(id)
    suspend fun deleteCompletedTodos() = db.todoDao().deleteCompleted()

    // ── Reminders ────────────────────────────────────────────────────────────

    suspend fun insertReminder(reminder: Reminder) = db.reminderDao().insertReminder(reminder)
    suspend fun updateReminder(reminder: Reminder) = db.reminderDao().updateReminder(reminder)
    suspend fun deleteReminder(id: String) = db.reminderDao().deleteReminder(id)

    // ── Budget ───────────────────────────────────────────────────────────────

    suspend fun insertTransaction(tx: BudgetTx) = db.budgetDao().insertTransaction(tx)
    suspend fun deleteTransaction(id: String) = db.budgetDao().deleteTransaction(id)

    // ── Quick Links ──────────────────────────────────────────────────────────

    suspend fun insertLink(link: QuickLink) = db.quickLinkDao().insertLink(link)
    suspend fun deleteLink(id: String) = db.quickLinkDao().deleteLink(id)

    // ── Utilities ────────────────────────────────────────────────────────────

    fun generateId(): String =
        System.currentTimeMillis().toString(36) + (0..9999).random().toString(36)
}
