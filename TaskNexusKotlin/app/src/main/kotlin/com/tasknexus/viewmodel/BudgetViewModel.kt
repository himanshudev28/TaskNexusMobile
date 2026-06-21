package com.tasknexus.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.tasknexus.data.AppDatabase
import com.tasknexus.data.AppRepository
import com.tasknexus.data.entity.BudgetTx
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class BudgetViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: AppRepository =
        AppRepository(AppDatabase.getInstance(application))

    val uiState: StateFlow<List<BudgetTx>> = repository.transactions
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    fun addTransaction(tx: BudgetTx) {
        viewModelScope.launch { repository.insertTransaction(tx) }
    }

    fun deleteTransaction(id: String) {
        viewModelScope.launch { repository.deleteTransaction(id) }
    }

    fun generateId(): String = repository.generateId()
}
