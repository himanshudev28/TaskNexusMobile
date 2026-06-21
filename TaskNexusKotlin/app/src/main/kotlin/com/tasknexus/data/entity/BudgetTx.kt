package com.tasknexus.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "budget_tx")
data class BudgetTx(
    @PrimaryKey val id: String,
    val desc: String,
    val amount: Double,
    val type: String, // "income" or "expense"
    val category: String,
    val date: String,
    val created: Long
)
