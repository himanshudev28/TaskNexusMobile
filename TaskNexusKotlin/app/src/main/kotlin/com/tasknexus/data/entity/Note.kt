package com.tasknexus.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notes")
data class Note(
    @PrimaryKey val id: String,
    val title: String,
    val body: String,
    val color: String,
    val pinned: Boolean,
    val created: Long,
    val updated: Long
)
