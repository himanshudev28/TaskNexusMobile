package com.tasknexus.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.tasknexus.data.dao.BudgetDao
import com.tasknexus.data.dao.NoteDao
import com.tasknexus.data.dao.QuickLinkDao
import com.tasknexus.data.dao.ReminderDao
import com.tasknexus.data.dao.TodoDao
import com.tasknexus.data.entity.BudgetTx
import com.tasknexus.data.entity.Note
import com.tasknexus.data.entity.QuickLink
import com.tasknexus.data.entity.Reminder
import com.tasknexus.data.entity.Todo

@Database(
    entities = [
        Note::class,
        Todo::class,
        Reminder::class,
        BudgetTx::class,
        QuickLink::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun noteDao(): NoteDao
    abstract fun todoDao(): TodoDao
    abstract fun reminderDao(): ReminderDao
    abstract fun budgetDao(): BudgetDao
    abstract fun quickLinkDao(): QuickLinkDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "tasknexus.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
