package com.tasknexus.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.tasknexus.data.AppDatabase
import com.tasknexus.data.AppRepository
import com.tasknexus.data.entity.Todo
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class TodoViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: AppRepository =
        AppRepository(AppDatabase.getInstance(application))

    val uiState: StateFlow<List<Todo>> = repository.todos
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    fun addTodo(todo: Todo) {
        viewModelScope.launch { repository.insertTodo(todo) }
    }

    fun updateTodo(todo: Todo) {
        viewModelScope.launch { repository.updateTodo(todo) }
    }

    fun deleteTodo(id: String) {
        viewModelScope.launch { repository.deleteTodo(id) }
    }

    fun deleteCompleted() {
        viewModelScope.launch { repository.deleteCompletedTodos() }
    }

    fun generateId(): String = repository.generateId()
}
