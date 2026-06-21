package com.tasknexus.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.tasknexus.data.AppDatabase
import com.tasknexus.data.AppRepository
import com.tasknexus.data.entity.QuickLink
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class QuickLinkViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: AppRepository =
        AppRepository(AppDatabase.getInstance(application))

    val uiState: StateFlow<List<QuickLink>> = repository.quickLinks
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    fun addLink(link: QuickLink) {
        viewModelScope.launch { repository.insertLink(link) }
    }

    fun deleteLink(id: String) {
        viewModelScope.launch { repository.deleteLink(id) }
    }

    fun generateId(): String = repository.generateId()
}
