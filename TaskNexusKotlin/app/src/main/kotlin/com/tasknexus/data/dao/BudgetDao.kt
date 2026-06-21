package com.tasknexus.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.tasknexus.data.entity.BudgetTx
import kotlinx.coroutines.flow.Flow

@Dao
interface BudgetDao {

    @Query("SELECT * FROM budget_tx ORDER BY created DESC")
    fun getAllTransactions(): Flow<List<BudgetTx>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(tx: BudgetTx)

    @Query("DELETE FROM budget_tx WHERE id = :id")
    suspend fun deleteTransaction(id: String)
}
