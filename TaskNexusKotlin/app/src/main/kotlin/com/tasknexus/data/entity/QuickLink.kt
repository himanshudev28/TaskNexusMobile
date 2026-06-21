package com.tasknexus.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "quick_links")
data class QuickLink(
    @PrimaryKey val id: String,
    val label: String,
    val url: String,
    val color: String,
    val created: Long
)
