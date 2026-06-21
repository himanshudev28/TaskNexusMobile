package com.tasknexus.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "todos")
data class Todo(
    @PrimaryKey val id: String,
    val title: String,
    val priority: String, // "high", "medium", "low"
    val category: String,
    val due: String,
    val note: String,
    val done: Boolean,
    val created: Long
)
