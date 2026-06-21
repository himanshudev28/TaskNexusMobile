package com.tasknexus.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.tasknexus.data.entity.QuickLink
import kotlinx.coroutines.flow.Flow

@Dao
interface QuickLinkDao {

    @Query("SELECT * FROM quick_links ORDER BY created DESC")
    fun getAllLinks(): Flow<List<QuickLink>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLink(link: QuickLink)

    @Query("DELETE FROM quick_links WHERE id = :id")
    suspend fun deleteLink(id: String)
}
