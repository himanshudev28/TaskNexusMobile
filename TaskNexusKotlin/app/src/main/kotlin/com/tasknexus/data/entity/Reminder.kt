package com.tasknexus.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "reminders")
data class Reminder(
    @PrimaryKey val id: String,
    val text: String,
    val at: String, // ISO datetime
    val done: Boolean,
    val created: Long
)
